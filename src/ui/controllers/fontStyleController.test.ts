import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFontStyleController } from "./fontStyleController";

const TEST_DATA_ATTRIBUTE = "menuFontControllerTest";
const TEST_SELECTOR = 'style[data-menu-font-controller-test="true"]';

const clearInjectedTestStyles = () => {
  document.head.querySelectorAll(TEST_SELECTOR).forEach((node) => node.remove());
};

describe("fontStyleController", () => {
  beforeEach(() => {
    clearInjectedTestStyles();
  });

  afterEach(() => {
    clearInjectedTestStyles();
  });

  it("creates and updates style element when css text is provided", () => {
    const controller = createFontStyleController({ dataAttribute: TEST_DATA_ATTRIBUTE });

    controller.sync(".menu { color: red; }");

    const style = document.head.querySelector(TEST_SELECTOR);
    expect(style).not.toBeNull();
    expect(style?.textContent).toBe(".menu { color: red; }");
  });

  it("removes style element when css text becomes empty", () => {
    const controller = createFontStyleController({ dataAttribute: TEST_DATA_ATTRIBUTE });

    controller.sync(".menu { color: red; }");
    controller.sync("");

    const style = document.head.querySelector(TEST_SELECTOR);
    expect(style).toBeNull();
  });

  it("destroy removes injected style element", () => {
    const controller = createFontStyleController({ dataAttribute: TEST_DATA_ATTRIBUTE });

    controller.sync(".menu { color: red; }");
    controller.destroy();

    const style = document.head.querySelector(TEST_SELECTOR);
    expect(style).toBeNull();
  });
});
