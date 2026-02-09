import type { MenuItem } from "../../../lib/types";
import { getCircularOffset } from "./shared";

export const JUKEBOX_WHEEL_STEP_THRESHOLD = 300;
export const JUKEBOX_WHEEL_SETTLE_MS = 240;
export const JUKEBOX_WHEEL_DELTA_CAP = 140;
export const JUKEBOX_TOUCH_DELTA_SCALE = 2.1;
export const JUKEBOX_TOUCH_INTENT_THRESHOLD = 10;

export const normalizeJukeboxWheelDelta = (event: WheelEvent) => {
  const modeScale = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? 240 : 1;
  const scaled = event.deltaY * modeScale;
  return Math.max(-JUKEBOX_WHEEL_DELTA_CAP, Math.min(JUKEBOX_WHEEL_DELTA_CAP, scaled));
};

export const getJukeboxRenderItems = (items: MenuItem[]) =>
  items.map((item, index) => ({
    item,
    sourceIndex: index,
    key: `${item.id}-jukebox`
  }));

export const getJukeboxCardStyle = (activeIndex: number, sourceIndex: number, count: number) => {
  const offset = getCircularOffset(activeIndex, sourceIndex, count);
  const distance = Math.abs(offset);
  const wheelRadius = 420;
  const stepY = 210;
  const discBiasX = -72;
  const rawY = offset * stepY;
  const clampedY = Math.max(-wheelRadius, Math.min(wheelRadius, rawY));
  const chord = Math.sqrt(Math.max(0, wheelRadius * wheelRadius - clampedY * clampedY));
  const arcX = distance < 0.5 ? discBiasX : discBiasX - (wheelRadius - chord);
  const focusShift = distance < 0.5 ? -arcX : 0;
  const arcY = clampedY;
  const scale = distance < 0.5 ? 1 : 0.88;
  const opacity = distance < 0.5 ? 1 : distance <= 1.2 ? 0.82 : 0;
  const depth = Math.max(1, 220 - Math.round(distance * 26));
  return `--arc-x:${arcX.toFixed(1)}px;--arc-y:${arcY.toFixed(1)}px;--card-scale:${scale.toFixed(
    3
  )};--card-opacity:${opacity.toFixed(3)};--focus-shift:${focusShift.toFixed(
    1
  )}px;--ring-depth:${depth};`;
};
