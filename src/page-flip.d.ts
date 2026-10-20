declare module "page-flip/dist/js/page-flip.module.js" {
  export class PageFlip {
    constructor(
      element: HTMLElement,
      settings: { width: number; height: number; [key: string]: unknown },
    );
    on(
      event: string,
      callback: (e: { data: number | string; object: PageFlip }) => void,
    ): void;
    loadFromHTML(elements: NodeListOf<Element>): void;
    flipNext(): void;
    flipPrev(): void;
    getBoundsRect(): { left: number; top: number };
    getFlipController(): { flip(point: { x: number; y: number }): void };
    turnToPage(page: number): void;
    getPage(index: number): { setDensity(density: "soft" | "hard"): void };
    destroy(): void;
  }
}
