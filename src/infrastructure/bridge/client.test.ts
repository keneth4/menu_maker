import { createBridgeAssetClient } from "./client";
import type { MenuProject } from "../../lib/types";

const asResponse = (value: unknown) => value as Response;

describe("bridge client prepare-derived", () => {
  it("posts project payload and returns processed project data", async () => {
    const sourceProject = {
      meta: { name: "Demo", locale: "en", currency: "USD", currencyPosition: "left" },
      categories: [],
      backgrounds: []
    } as unknown as MenuProject;
    const processedProject = {
      ...sourceProject,
      meta: { ...sourceProject.meta, slug: "demo" }
    } as unknown as MenuProject;

    const fetchMock = vi.fn().mockResolvedValue(
      asResponse({
        ok: true,
        json: vi.fn().mockResolvedValue({ project: processedProject })
      })
    );
    const client = createBridgeAssetClient(fetchMock as unknown as typeof fetch);

    const result = await client.prepareProjectDerivedAssets("my project", sourceProject);

    expect(result).toEqual(processedProject);
    expect(fetchMock).toHaveBeenCalledWith("/api/assets/prepare-derived?project=my%20project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: sourceProject })
    });
  });

  it("throws bridge error message when prepare-derived fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      asResponse({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: "ffmpeg unavailable" })
      })
    );
    const client = createBridgeAssetClient(fetchMock as unknown as typeof fetch);

    await expect(
      client.prepareProjectDerivedAssets("demo", {} as MenuProject)
    ).rejects.toThrow("ffmpeg unavailable");
  });

  it("throws when bridge response is missing processed project payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      asResponse({
        ok: true,
        json: vi.fn().mockResolvedValue({})
      })
    );
    const client = createBridgeAssetClient(fetchMock as unknown as typeof fetch);

    await expect(
      client.prepareProjectDerivedAssets("demo", {} as MenuProject)
    ).rejects.toThrow("Bridge response missing processed project data");
  });
});
