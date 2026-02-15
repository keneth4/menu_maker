type FontStyleControllerDeps = {
  dataAttribute?: string;
  createStyleElement?: () => HTMLStyleElement;
  getHead?: () => HTMLHeadElement | null;
};

export type FontStyleController = {
  sync: (cssText: string) => void;
  destroy: () => void;
};

const getHeadDefault = () => {
  if (typeof document === "undefined") return null;
  return document.head;
};

const createStyleElementDefault = () => document.createElement("style");

export const createFontStyleController = (
  deps: FontStyleControllerDeps = {}
): FontStyleController => {
  const dataAttribute = deps.dataAttribute ?? "menuFont";
  const getHead = deps.getHead ?? getHeadDefault;
  const createStyleElement = deps.createStyleElement ?? createStyleElementDefault;
  let styleEl: HTMLStyleElement | null = null;

  const removeStyle = () => {
    if (styleEl) {
      styleEl.remove();
      styleEl = null;
    }
  };

  const sync = (cssText: string) => {
    const head = getHead();
    if (!head) {
      removeStyle();
      return;
    }
    if (!cssText) {
      removeStyle();
      return;
    }
    if (!styleEl) {
      styleEl = createStyleElement();
      styleEl.dataset[dataAttribute] = "true";
      head.appendChild(styleEl);
    }
    styleEl.textContent = cssText;
  };

  const destroy = () => {
    removeStyle();
  };

  return {
    sync,
    destroy
  };
};
