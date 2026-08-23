import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toSvg } from 'html-to-image';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, ImageRun, ShadingType, HeightRule, TableLayoutType } from 'docx';
import { ExportFormat, PaperSize } from '../types';

// Paper dimensions in mm
const PAPER_SIZES: Record<PaperSize, { width: number; height: number }> = {
    a4: { width: 210, height: 297 },
    letter: { width: 215.9, height: 279.4 },
};

export async function exportToPDF(
    element: HTMLElement,
    filename: string,
    paperSize: PaperSize = 'a4'
): Promise<void> {
    const size = PAPER_SIZES[paperSize] || PAPER_SIZES.a4;

    // Save previous inline styles
    const prevTransform = element.style.transform;
    const prevTransformOrigin = element.style.transformOrigin;
    const prevBoxShadow = element.style.boxShadow;
    const prevZoom = element.style.zoom;

    try {
        // Reset scale so capture is rendered at full 100% paper resolution
        element.style.transform = 'none';
        element.style.transformOrigin = 'top left';
        element.style.boxShadow = 'none';
        element.style.zoom = '1';

        // High quality rasterization
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1200,
        });

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: paperSize === 'a4' ? 'a4' : 'letter',
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = size.width;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdf.save(`${filename || 'worksheet'}.pdf`);
    } finally {
        // Restore previous styles
        element.style.transform = prevTransform;
        element.style.transformOrigin = prevTransformOrigin;
        element.style.boxShadow = prevBoxShadow;
        element.style.zoom = prevZoom;
    }
}

export async function exportToMultiPagePDF(
    elements: HTMLElement[],
    filename: string,
    paperSize: PaperSize = 'a4'
): Promise<void> {
    const size = PAPER_SIZES[paperSize] || PAPER_SIZES.a4;

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: paperSize === 'a4' ? 'a4' : 'letter',
    });

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const prevTransform = el.style.transform;
        const prevBoxShadow = el.style.boxShadow;
        const prevZoom = el.style.zoom;

        try {
            el.style.transform = 'none';
            el.style.boxShadow = 'none';
            el.style.zoom = '1';

            if (i > 0) {
                pdf.addPage();
            }

            const canvas = await html2canvas(el, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = size.width;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        } finally {
            el.style.transform = prevTransform;
            el.style.boxShadow = prevBoxShadow;
            el.style.zoom = prevZoom;
        }
    }

    pdf.save(`${filename || 'worksheet'}.pdf`);
}

export async function exportToPNG(
    element: HTMLElement,
    filename: string
): Promise<void> {
    const prevTransform = element.style.transform;
    const prevBoxShadow = element.style.boxShadow;
    const prevZoom = element.style.zoom;

    try {
        element.style.transform = 'none';
        element.style.boxShadow = 'none';
        element.style.zoom = '1';

        // html-to-image preserves the preview's CSS zoom in cloned descendants,
        // which can leave the worksheet at half size on an otherwise full A4 PNG.
        // html2canvas is also used by the verified PDF path and captures the
        // temporarily unscaled paper at the expected dimensions.
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1200,
        });

        const dataUrl = canvas.toDataURL('image/png', 1.0);

        const link = document.createElement('a');
        link.download = `${filename || 'worksheet'}.png`;
        link.href = dataUrl;
        link.click();
    } finally {
        element.style.transform = prevTransform;
        element.style.boxShadow = prevBoxShadow;
        element.style.zoom = prevZoom;
    }
}

export async function exportToSVG(
    element: HTMLElement,
    filename: string
): Promise<void> {
    const dataUrl = await toSvg(element, {
        backgroundColor: '#ffffff',
    });

    const link = document.createElement('a');
    link.download = `${filename || 'worksheet'}.svg`;
    link.href = dataUrl;
    link.click();
}

// Helper to extract text content from worksheet for DOCX
export interface DocxContent {
    title: string;
    subtitle?: string;
    sections: DocxSection[];
}

export interface DocxSection {
    type: 'paragraph' | 'grid' | 'list' | 'numberedList';
    content: string | string[] | string[][];
}

/**
 * Export the rendered paper as a high-fidelity, single-page DOCX.
 * This is used for worksheets whose images or tracing styles cannot be
 * represented faithfully by the editable text/table DOCX exporter.
 */
export async function exportPreviewToDOCX(
    element: HTMLElement,
    filename: string,
    paperSize: PaperSize = 'a4'
): Promise<void> {
    const prevTransform = element.style.transform;
    const prevTransformOrigin = element.style.transformOrigin;
    const prevBoxShadow = element.style.boxShadow;
    const prevZoom = element.style.zoom;

    try {
        element.style.transform = 'none';
        element.style.transformOrigin = 'top left';
        element.style.boxShadow = 'none';
        element.style.zoom = '1';

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1200,
        });

        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(value => value ? resolve(value) : reject(new Error('Unable to render worksheet image')), 'image/png', 1);
        });
        const imageData = new Uint8Array(await blob.arrayBuffer());
        const size = PAPER_SIZES[paperSize] || PAPER_SIZES.a4;
        const imageWidth = Math.round((size.width - 20) * 96 / 25.4);
        const imageHeight = Math.round(imageWidth * canvas.height / canvas.width);

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        size: {
                            width: Math.round(size.width * 1440 / 25.4),
                            height: Math.round(size.height * 1440 / 25.4),
                        },
                        margin: { top: 567, right: 567, bottom: 567, left: 567 },
                    },
                },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 0 },
                        children: [
                            new ImageRun({
                                type: 'png',
                                data: imageData,
                                transformation: { width: imageWidth, height: imageHeight },
                            }),
                        ],
                    }),
                ],
            }],
        });

        const docxBlob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(docxBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename || 'worksheet'}.docx`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
        element.style.transform = prevTransform;
        element.style.transformOrigin = prevTransformOrigin;
        element.style.boxShadow = prevBoxShadow;
        element.style.zoom = prevZoom;
    }
}

export async function exportToDOCX(
    content: DocxContent,
    filename: string
): Promise<void> {
    const children: (Paragraph | Table)[] = [];

    // Title
    children.push(
        new Paragraph({
            text: content.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
        })
    );

    // Subtitle
    if (content.subtitle) {
        children.push(
            new Paragraph({
                text: content.subtitle,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            })
        );
    }

    // Sections
    for (const section of content.sections) {
        if (section.type === 'paragraph') {
            children.push(
                new Paragraph({
                    text: section.content as string,
                    spacing: { after: 200 },
                })
            );
        } else if (section.type === 'list') {
            const items = section.content as string[];
            for (const item of items) {
                children.push(
                    new Paragraph({
                        text: `• ${item}`,
                        spacing: { after: 100 },
                    })
                );
            }
        } else if (section.type === 'numberedList') {
            const items = section.content as string[];
            items.forEach((item, index) => {
                children.push(
                    new Paragraph({
                        text: /^\d+[.)]\s/.test(item) ? item : `${index + 1}. ${item}`,
                        spacing: { after: 100 },
                    })
                );
            });
        } else if (section.type === 'grid') {
            const grid = section.content as string[][];
            const columnCount = Math.max(1, ...grid.map(row => row.length));
            const cellSize = Math.max(240, Math.min(420, Math.floor(6000 / columnCount)));
            const rows = grid.map(row =>
                new TableRow({
                    height: { value: cellSize, rule: HeightRule.EXACT },
                    children: row.map(cell => {
                        const isBlocked = cell === '■';
                        const borderColor = isBlocked ? 'D1D5DB' : '333333';
                        return new TableCell({
                            children: [new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 0, after: 0 },
                                children: [new TextRun({ text: isBlocked ? '' : (cell || ''), size: 18 })],
                            })],
                            shading: isBlocked ? { fill: 'E5E7EB', type: ShadingType.CLEAR } : undefined,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            width: { size: Math.floor(100 / Math.max(1, row.length)), type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
                                left: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
                                right: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
                            },
                        });
                    }),
                })
            );

            children.push(
                new Table({
                    rows,
                    width: { size: 65, type: WidthType.PERCENTAGE },
                    layout: TableLayoutType.FIXED,
                    alignment: AlignmentType.CENTER,
                })
            );
        }
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children,
        }],
    });

    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename || 'worksheet'}.docx`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// Generic export function
export async function exportWorksheet(
    element: HTMLElement,
    format: ExportFormat,
    filename: string,
    paperSize: PaperSize = 'a4',
    docxContent?: DocxContent
): Promise<void> {
    switch (format) {
        case 'pdf':
            await exportToPDF(element, filename, paperSize);
            break;
        case 'png':
            await exportToPNG(element, filename);
            break;
        case 'docx':
            if (docxContent) {
                await exportToDOCX(docxContent, filename);
            } else {
                await exportToPNG(element, filename);
            }
            break;
    }
}
