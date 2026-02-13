import { describe, expect, it } from "vitest";
import { fromBase64, getMimeType, isResponsiveImageMime, toBase64, withVariantSuffix } from "./mediaWorkflow";

describe("mediaWorkflow", () => {
  it("encodes and decodes base64 bytes", () => {
    const input = new Uint8Array([0, 1, 2, 250, 255]);
    const encoded = toBase64(input);
    const decoded = fromBase64(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(input));
  });

  it("resolves expected mime types", () => {
    expect(getMimeType("photo.jpg")).toBe("image/jpeg");
    expect(getMimeType("clip.webm")).toBe("video/webm");
    expect(getMimeType("font.woff2")).toBe("font/woff2");
    expect(getMimeType("unknown.bin")).toBe("application/octet-stream");
  });

  it("matches responsive mime whitelist and variant suffix behavior", () => {
    expect(isResponsiveImageMime("image/png")).toBe(true);
    expect(isResponsiveImageMime("image/webp")).toBe(false);
    expect(withVariantSuffix("assets/items/soup.webp", "md")).toBe("assets/items/soup-md.webp");
    expect(withVariantSuffix("assets/items/soup", "md")).toBe("assets/items/soup-md");
  });
});
