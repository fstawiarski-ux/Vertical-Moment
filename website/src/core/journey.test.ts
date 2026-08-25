import { describe, expect, it } from "vitest";
import { DEFAULT_STATION_PROGRESS, JOURNEY_STATIONS, journeyStationsFor, stationForProgress, stationMarkersFor } from "./journey";
import type { ScrollScrubSequenceAsset } from "./types";

describe("canonical journey contract", () => {
  it("keeps the four-station order and default anchors stable", () => {
    expect(JOURNEY_STATIONS).toEqual(["region", "rock", "sector", "topo"]);
    expect(journeyStationsFor().map((station) => station.progress)).toEqual([
      DEFAULT_STATION_PROGRESS.region,
      DEFAULT_STATION_PROGRESS.rock,
      DEFAULT_STATION_PROGRESS.sector,
      DEFAULT_STATION_PROGRESS.topo,
    ]);
  });

  it("uses a pilot master timeline everywhere while preserving its order", () => {
    const sequence = {
      poster: "/poster.jpg",
      chapters: [],
      master: {
        video: "/master.mp4",
        duration: 12,
        alt: "Master journey",
        stations: { region: 0, rock: 0.3068, sector: 0.524, topo: 0.7808 },
      },
    } as ScrollScrubSequenceAsset;

    expect(journeyStationsFor(sequence).map((station) => station.progress)).toEqual([0, 0.3068, 0.524, 0.7808]);
    expect(stationForProgress(0.31, stationMarkersFor(sequence))).toBe("rock");
    expect(stationForProgress(0.53, stationMarkersFor(sequence))).toBe("sector");
    expect(stationForProgress(0.79, stationMarkersFor(sequence))).toBe("topo");
  });

  it("falls back to safe defaults for malformed or out-of-order anchors", () => {
    const sequence = {
      poster: "/poster.jpg",
      chapters: [],
      master: {
        video: "/master.mp4",
        duration: 12,
        alt: "Master journey",
        stations: { region: 0.4, rock: 0.2, sector: 0.7, topo: 1.2 },
      },
    } as unknown as ScrollScrubSequenceAsset;

    expect(stationMarkersFor(sequence)).toEqual(DEFAULT_STATION_PROGRESS);
  });
});
