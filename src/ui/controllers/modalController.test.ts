import { describe, expect, it, vi } from "vitest";
import type { MenuProject } from "../../lib/types";
import { createModalController, type ActiveDishSelection } from "./modalController";

const createProject = (slug = "demo"): MenuProject =>
  ({
    meta: {
      slug
    },
    categories: [
      {
        id: "cat-1",
        items: [
          {
            id: "item-1",
            media: { hero360: "hero-1.webp", originalHero360: "" }
          },
          {
            id: "item-2",
            media: { hero360: "hero-2.webp", originalHero360: "" }
          }
        ]
      }
    ]
  }) as unknown as MenuProject;

describe("createModalController", () => {
  it("prefetches detail/interactive assets with dedupe and resets on project signature change", () => {
    const imageFactory = vi.fn(() => ({ decoding: "", src: "" } as unknown as HTMLImageElement));
    const prefetchInteractiveBytes = vi.fn(async () => new ArrayBuffer(0));
    let activeItem: ActiveDishSelection = null;
    let project = createProject("demo");
    const controller = createModalController({
      getProject: () => project,
      getActiveItem: () => activeItem,
      setActiveItem: (value) => {
        activeItem = value;
      },
      getDetailImageSource: (item) => `/details/${item.id}.webp`,
      getInteractiveDetailAsset: (item) =>
        item ? { source: `/interactive/${item.id}.webp`, mime: "image/webp" } : null,
      supportsInteractiveMedia: () => true,
      prefetchInteractiveBytes,
      setRotateDirection: () => undefined,
      setupInteractiveMedia: async () => undefined,
      teardownInteractiveMedia: () => undefined,
      getDishRotateDirection: () => -1,
      schedulePostOpen: () => undefined,
      createImage: imageFactory
    });

    controller.syncProject(project);
    controller.prefetchDishDetail("cat-1", "item-1", true);
    expect(imageFactory).toHaveBeenCalledTimes(2);
    expect(prefetchInteractiveBytes).toHaveBeenCalledTimes(2);

    controller.prefetchDishDetail("cat-1", "item-1", true);
    expect(imageFactory).toHaveBeenCalledTimes(2);
    expect(prefetchInteractiveBytes).toHaveBeenCalledTimes(2);

    project = createProject("demo-2");
    controller.syncProject(project);
    controller.prefetchDishDetail("cat-1", "item-1", false);
    expect(imageFactory).toHaveBeenCalledTimes(3);
    expect(prefetchInteractiveBytes).toHaveBeenCalledTimes(3);
  });

  it("opens and closes dish with media orchestration", () => {
    let activeItem: ActiveDishSelection = null;
    const setupInteractiveMedia = vi.fn(async () => undefined);
    const teardownInteractiveMedia = vi.fn(() => undefined);
    const setRotateDirection = vi.fn(() => undefined);
    const schedulePostOpen = vi.fn((task: () => void) => task());
    const controller = createModalController({
      getProject: () => createProject("open-close"),
      getActiveItem: () => activeItem,
      setActiveItem: (value) => {
        activeItem = value;
      },
      getDetailImageSource: () => "",
      getInteractiveDetailAsset: (item) =>
        item ? { source: `/interactive/${item.id}.webp`, mime: "image/webp" } : null,
      supportsInteractiveMedia: () => true,
      prefetchInteractiveBytes: async () => null,
      setRotateDirection,
      setupInteractiveMedia,
      teardownInteractiveMedia,
      getDishRotateDirection: () => 1,
      schedulePostOpen
    });

    controller.openDish("cat-1", "item-2");
    expect(activeItem).toEqual({ category: "cat-1", itemId: "item-2" });
    expect(schedulePostOpen).toHaveBeenCalledTimes(1);
    expect(setRotateDirection).toHaveBeenCalledWith(1);
    expect(setupInteractiveMedia).toHaveBeenCalledWith({
      source: "/interactive/item-2.webp",
      mime: "image/webp"
    });

    controller.closeDish();
    expect(teardownInteractiveMedia).toHaveBeenCalledTimes(1);
    expect(setRotateDirection).toHaveBeenCalledWith(-1);
    expect(activeItem).toBeNull();
  });
});
