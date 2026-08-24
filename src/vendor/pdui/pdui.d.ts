/** Type surface for the PDUI runtime bundle (`pdui.js`), an IIFE with no exports. */
export {};

declare global {
  interface Window {
    PDUI?: {
      Theme: {
        get(): 'light' | 'dark';
        set(theme: 'light' | 'dark'): void;
        toggle(): void;
        init(): void;
      };
      Toast: { show(message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number): void };
      Modal: { open(id: string): void; close(id: string): void; init(): void };
      Tabs: { select(tab: Element): void; init(): void };
      version: string;
    };
  }
}
