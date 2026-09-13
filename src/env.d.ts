/// <reference types="astro/client" />

interface Window {
  PagefindUI?: new (options: {
    element: string;
    showSubResults: boolean;
    translations: Record<string, string>;
  }) => unknown;
}
