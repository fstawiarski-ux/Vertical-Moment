import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { createContributionArchive, safeArchiveName, type LocalEvidenceFile } from "../../lib/contribution-local";

describe("local contribution packages", () => {
  it("normalizes filenames for portable review packages", () => {
    expect(safeArchiveName("Waldm\u00fchle approach 01.gpx")).toBe("Waldmuhle-approach-01.gpx");
  });

  it("exports the manifest and evidence bytes", async () => {
    const files: LocalEvidenceFile[] = [{
      id: "file-1",
      name: "wall photo.jpg",
      size: 4,
      type: "image/jpeg",
      kind: "photo",
      caption: "Full wall",
      blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/jpeg" }),
      lastModified: 0,
    }];

    const archive = await createContributionArchive({ submission: "VM-TEST-1" }, files);
    const entries = unzipSync(new Uint8Array(await archive.arrayBuffer()));

    expect(strFromU8(entries["manifest.json"])).toContain('"submission": "VM-TEST-1"');
    expect([...entries["evidence/01-wall-photo.jpg"]]).toEqual([1, 2, 3, 4]);
  });
});
