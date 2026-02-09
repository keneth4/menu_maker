export const INTERACTIVE_GIF_MAX_FRAMES = 72;
export const INTERACTIVE_KEEP_ORIGINAL_PLACEMENT = true;

export const getCircularOffset = (activeIndex: number, targetIndex: number, count: number) => {
  if (count <= 1) return 0;
  let offset = targetIndex - activeIndex;
  const half = count / 2;
  while (offset > half) offset -= count;
  while (offset < -half) offset += count;
  return offset;
};

export const wrapCarouselIndex = (value: number, count: number) => {
  if (count <= 0) return 0;
  return ((value % count) + count) % count;
};
