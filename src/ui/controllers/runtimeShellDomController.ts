export const isTargetWithinEditorPanel = (
  target: EventTarget | null,
  queryPanel: () => Element | null = () => document.querySelector(".editor-panel")
): boolean => {
  if (!(target instanceof Node)) return false;
  const panel = queryPanel();
  return panel?.contains(target) ?? false;
};

type OrientationLockCapable = {
  orientation?: {
    lock?: (orientation: "landscape") => Promise<void>;
  };
};

export const tryLockLandscape = async (
  screenObject: OrientationLockCapable = screen
): Promise<void> => {
  try {
    if (screenObject.orientation?.lock) {
      await screenObject.orientation.lock("landscape");
    }
  } catch {
    // Ignore failures; browser may require fullscreen or user gesture.
  }
};
