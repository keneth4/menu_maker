export type ContainPlacement = {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
};

export type CoverCrop = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

const clampPositive = (value: number) => (Number.isFinite(value) && value > 0 ? value : 1);

export const computeCenteredContainPlacement = (
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): ContainPlacement => {
  const srcW = clampPositive(sourceWidth);
  const srcH = clampPositive(sourceHeight);
  const dstW = clampPositive(targetWidth);
  const dstH = clampPositive(targetHeight);
  const scale = Math.min(dstW / srcW, dstH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  return {
    dx: (dstW - dw) / 2,
    dy: (dstH - dh) / 2,
    dw,
    dh
  };
};

export const computeCenteredCoverCrop = (
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): CoverCrop => {
  const srcW = clampPositive(sourceWidth);
  const srcH = clampPositive(sourceHeight);
  const dstW = clampPositive(targetWidth);
  const dstH = clampPositive(targetHeight);
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const sw = dstW / scale;
  const sh = dstH / scale;
  return {
    sx: (srcW - sw) / 2,
    sy: (srcH - sh) / 2,
    sw,
    sh
  };
};

export const buildCenteredContainPadFfmpegFilter = (
  width: number,
  height: number,
  options: { color?: string } = {}
) => {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const color = options.color ?? "0x00000000";
  return `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=${color},format=rgba`;
};

export const buildCenteredCoverCropFfmpegFilter = (width: number, height: number) => {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  return `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}:(iw-ow)/2:(ih-oh)/2`;
};
