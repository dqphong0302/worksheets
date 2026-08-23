import { expect, test, type Download, type Page } from '@playwright/test';

const generators = [
  'crossword',
  'wordSearch',
  'matching',
  'wordScramble',
  'wordSearchImages',
  'matchingImages',
  'spellingTest',
  'wordTracer',
  'mathWorksheet',
  'findIdentical',
  'bingo',
  'flashcards',
  'cryptogram',
  'maze',
  'sudoku',
] as const;

const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const;

function collectRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function readDownloadPrefix(download: Download, bytes = 8): Promise<Buffer> {
  const stream = await download.createReadStream();
  if (!stream) throw new Error(`No download stream for ${download.suggestedFilename()}`);
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of stream) {
    const buffer = Buffer.from(chunk);
    chunks.push(buffer);
    size += buffer.length;
    if (size >= bytes) break;
  }
  return Buffer.concat(chunks).subarray(0, bytes);
}

async function readDownload(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  if (!stream) throw new Error(`No download stream for ${download.suggestedFilename()}`);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function enterPlayMode(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Play|Chơi|Solve|Giải/i }).first().click();
  await expect(page.getByTitle('Đóng (quay lại chỉnh sửa)')).toBeVisible();
  await expect(page.locator('header h1')).toHaveCount(1);
}

test('home catalog, search, category, theme and language persistence', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('main h4')).toHaveCount(15);

  const search = page.getByRole('textbox', { name: /Search worksheet tools/i });
  await search.fill('Sudoku');
  await expect(page.getByRole('heading', { name: 'Visual Sudoku' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Crossword Puzzle' })).toHaveCount(0);
  await search.clear();

  await page.getByRole('button', { name: /Math/ }).click();
  await expect(page.locator('main h4')).toHaveCount(3);
  await page.getByRole('button', { name: /All \(15\)/ }).click();

  await page.getByRole('button', { name: /Light/ }).click();
  await expect(page.getByRole('button', { name: /Dark/ })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.getByRole('button', { name: /Dark/ })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.getByRole('button', { name: /EN/ }).click();
  await expect(page.getByRole('button', { name: /VI/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /VI/ })).toBeVisible();

  // Restore the default UI state for the remaining tests.
  await page.getByRole('button', { name: /VI/ }).click();
  await page.getByRole('button', { name: /Dark/ }).click();
  expect(errors).toEqual([]);
});

for (const generator of generators) {
  test(`${generator}: editor, responsive layout and play mode`, async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    await page.goto(`/editor/${generator}`);

    await expect(page.locator('.paper')).toHaveCount(1);
    await expect(page.locator('.paper h1')).toHaveCount(1);
    await expect(page.getByRole('button', { name: /Export|Xuất file/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Play|Chơi|Solve|Giải/i }).first()).toBeVisible();

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await expect.poll(async () => page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }))).toEqual({ clientWidth: viewport.width, scrollWidth: viewport.width });
      await expect(page.locator('.paper')).toBeVisible();
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await enterPlayMode(page);
    await page.getByTitle('Đóng (quay lại chỉnh sửa)').click();
    await expect(page.locator('.paper')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('undo, redo, reset, autosave and template save/load', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/editor/crossword');

  const title = page.getByRole('textbox', { name: 'Title' });
  const original = await title.inputValue();
  const persistedTitle = `E2E Autosave ${Date.now()}`;
  await title.fill(persistedTitle);

  await page.getByTitle('Hoàn tác (Ctrl+Z)').click();
  await expect(title).toHaveValue(original);
  await page.getByTitle('Làm lại (Ctrl+Y)').click();
  await expect(title).toHaveValue(persistedTitle);

  await page.waitForTimeout(1_200);
  await page.reload();
  await expect(title).toHaveValue(persistedTitle);

  const templateName = `E2E Template ${Date.now()}`;
  await page.getByTitle('Lưu hoặc quản lý các mẫu bài tập').click();
  await page.locator('input[placeholder^="Ví dụ:"]').fill(templateName);
  await page.getByRole('button', { name: /Save to Browser|Xác nhận Lưu Mẫu/ }).click();
  await expect(page.getByRole('heading', { name: /Saved Templates|Kho mẫu/ })).toBeVisible();

  const jsonDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Xuất ra file JSON/ }).click();
  const jsonDownload = await jsonDownloadPromise;
  expect(jsonDownload.suggestedFilename().endsWith('.json')).toBe(true);
  const exportedTemplates = await readDownload(jsonDownload);
  expect(JSON.parse(exportedTemplates.toString('utf8'))).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: templateName, type: 'crossword' }),
  ]));
  await page.getByRole('button', { name: 'Đóng' }).click();

  await title.fill('Temporary title');
  await page.getByTitle('Lưu hoặc quản lý các mẫu bài tập').click();
  await page.getByRole('button', { name: /Mẫu Đã Lưu/ }).click();
  const templateCard = page.getByRole('heading', { name: templateName }).locator('xpath=../..');
  await templateCard.getByRole('button', { name: 'Tải mẫu' }).click();
  await expect(title).toHaveValue(persistedTitle);

  // Delete, import from the exported JSON, and load the imported fixture.
  await page.getByTitle('Lưu hoặc quản lý các mẫu bài tập').click();
  await page.getByRole('button', { name: /Mẫu Đã Lưu/ }).click();
  await page.getByRole('heading', { name: templateName }).locator('xpath=../..').getByTitle('Xóa mẫu').click();
  await expect(page.getByRole('heading', { name: templateName })).toHaveCount(0);
  await page.locator('input[type="file"][accept=".json"]').setInputFiles({
    name: 'worksheet-e2e-templates.json',
    mimeType: 'application/json',
    buffer: exportedTemplates,
  });
  await expect(page.getByRole('heading', { name: templateName })).toBeVisible();
  await page.getByRole('heading', { name: templateName }).locator('xpath=../..').getByRole('button', { name: 'Tải mẫu' }).click();
  await expect(title).toHaveValue(persistedTitle);

  // Remove only the E2E fixture created by this test.
  await page.getByTitle('Lưu hoặc quản lý các mẫu bài tập').click();
  await page.getByRole('button', { name: /Mẫu Đã Lưu/ }).click();
  await page.getByRole('heading', { name: templateName }).locator('xpath=../..').getByTitle('Xóa mẫu').click();
  await page.getByRole('button', { name: 'Đóng' }).click();

  await page.getByTitle('Đặt lại cài đặt mặc định').click();
  await expect(title).toHaveValue('Crossword Puzzle');
  expect(errors).toEqual([]);
});

test('advanced play interactions: crossword, flashcards and bingo', async ({ page }) => {
  const errors = collectRuntimeErrors(page);

  await page.goto('/editor/crossword');
  await enterPlayMode(page);
  await expect(page.getByText('0 / 5', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Xem đáp án/ }).click();
  await expect(page.getByText('5 / 5', { exact: true })).toBeVisible();

  await page.goto('/editor/flashcards');
  await enterPlayMode(page);
  await page.getByText('Apple', { exact: true }).click();
  await expect(page.getByText('Quả Táo', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Lật Ghép Cặp/i }).click();
  await expect(page.getByText(/Số lượt:/i)).toBeVisible();

  await page.goto('/editor/bingo');
  await enterPlayMode(page);
  const firstCell = page.locator('main .grid button').first();
  await firstCell.click();
  await page.getByRole('button', { name: /Caller Machine/i }).click();
  const callButton = page.getByRole('button', { name: /Bốc Từ Tiếp Theo/ });
  await expect(callButton).toContainText('(30 từ còn lại)');
  await callButton.click();
  await expect(callButton).toContainText('(29 từ còn lại)');
  expect(errors).toEqual([]);
});

test('PDF and PNG exports download; all generators provide DOCX', async ({ page }) => {
  const errors = collectRuntimeErrors(page);

  await page.goto('/editor/crossword');
  for (const item of [
    { label: 'Xuất PDF (A4)', extension: '.pdf', signature: Buffer.from('%PDF-') },
    { label: 'Xuất Ảnh PNG (HD)', extension: '.png', signature: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
  ]) {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export|Xuất file/i }).click();
    await page.getByText(item.label, { exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename().endsWith(item.extension)).toBe(true);
    expect(await download.failure()).toBeNull();
    expect((await readDownloadPrefix(download, item.signature.length)).equals(item.signature)).toBe(true);
  }

  for (const generator of generators) {
    await page.goto(`/editor/${generator}`);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export|Xuất file/i }).click();
    await page.getByText('Xuất File Word (DOCX)', { exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename().endsWith('.docx')).toBe(true);
    expect(await download.failure()).toBeNull();
    expect((await readDownloadPrefix(download, 2)).equals(Buffer.from('PK'))).toBe(true);
  }
  expect(errors).toEqual([]);
});
