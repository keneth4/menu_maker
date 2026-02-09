import {
  buildCenteredContainPadFfmpegFilter,
  buildCenteredCoverCropFfmpegFilter,
  computeCenteredContainPlacement,
  computeCenteredCoverCrop
} from "./fit";

describe("fit helpers", () => {
  it("computes centered contain placement with symmetric padding", () => {
    const placement = computeCenteredContainPlacement(200, 100, 100, 100);
    expect(placement.dx).toBeCloseTo(0);
    expect(placement.dy).toBeCloseTo(25);
    expect(placement.dw).toBeCloseTo(100);
    expect(placement.dh).toBeCloseTo(50);
  });

  it("computes centered cover crop with symmetric trimming", () => {
    const crop = computeCenteredCoverCrop(200, 100, 100, 100);
    expect(crop.sx).toBeCloseTo(50);
    expect(crop.sy).toBeCloseTo(0);
    expect(crop.sw).toBeCloseTo(100);
    expect(crop.sh).toBeCloseTo(100);
  });

  it("builds centered ffmpeg contain+pad filter", () => {
    expect(buildCenteredContainPadFfmpegFilter(768, 768)).toBe(
      "scale=768:768:force_original_aspect_ratio=decrease,pad=768:768:(ow-iw)/2:(oh-ih)/2:color=0x00000000"
    );
  });

  it("builds centered ffmpeg cover+crop filter", () => {
    expect(buildCenteredCoverCropFfmpegFilter(1920, 1080)).toBe(
      "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080:(iw-ow)/2:(ih-oh)/2"
    );
  });
});
