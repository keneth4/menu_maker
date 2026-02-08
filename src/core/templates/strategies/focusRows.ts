import type { MenuItem } from "../../../lib/types";
import { getCircularOffset } from "./shared";

export const FOCUS_ROWS_WHEEL_STEP_THRESHOLD = 260;
export const FOCUS_ROWS_WHEEL_SETTLE_MS = 200;
export const FOCUS_ROWS_WHEEL_DELTA_CAP = 140;
export const FOCUS_ROWS_TOUCH_DELTA_SCALE = 2.2;
export const FOCUS_ROWS_TOUCH_INTENT_THRESHOLD = 10;

export const normalizeFocusRowWheelDelta = (event: WheelEvent) => {
  const modeScale = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? 240 : 1;
  const scaled = event.deltaX * modeScale;
  return Math.max(-FOCUS_ROWS_WHEEL_DELTA_CAP, Math.min(FOCUS_ROWS_WHEEL_DELTA_CAP, scaled));
};

export const getFocusRowRenderItems = (items: MenuItem[]) =>
  items.map((item, index) => ({
    item,
    sourceIndex: index,
    key: `${item.id}-focus`
  }));

export const getFocusRowCardStyle = (activeIndex: number, sourceIndex: number, count: number) => {
  const offset = getCircularOffset(activeIndex, sourceIndex, count);
  const distance = Math.abs(offset);
  const stepX = 220;
  const maxDistance = 2.6;
  const hideAt = Math.max(1.6, count / 2 - 0.25);
  const x = offset * stepX;
  const y = Math.min(18, distance * 6);
  const scale = distance < 0.5 ? 1 : Math.max(0.68, 1 - distance * 0.14);
  let opacity = distance < 0.5 ? 1 : distance <= maxDistance ? Math.max(0, 1 - distance * 0.34) : 0;
  if (distance >= hideAt) {
    opacity = 0;
  }
  const blur = Math.min(8, distance * 2.4);
  const depth = Math.max(1, 120 - Math.round(distance * 18));
  return `--row-x:${x.toFixed(1)}px;--row-y:${y.toFixed(1)}px;--row-scale:${scale.toFixed(
    3
  )};--row-opacity:${opacity.toFixed(3)};--row-blur:${blur.toFixed(2)}px;--row-depth:${depth};`;
};
