import { describe, expect, it } from "vitest";
import {
  calculateFieldEffectRemainingTurns,
  getFieldEffectDurationMetadata,
} from "../../src/battle/battle-field-effect-metadata";

describe("getFieldEffectDurationMetadata", () => {
  it("returns a duration range for weather", () => {
    expect(
      getFieldEffectDurationMetadata({
        effectType: "weather",
        effect: "RainDance",
      })
    ).toEqual({
      minDuration: 5,
      maxDuration: 8,
    });
  });

  it("returns a fixed duration for Trick Room", () => {
    expect(
      getFieldEffectDurationMetadata({
        effectType: "fieldCondition",
        effect: "move: Trick Room",
      })
    ).toEqual({
      minDuration: 5,
      maxDuration: 5,
    });
  });

  it("returns a duration range for terrain", () => {
    expect(
      getFieldEffectDurationMetadata({
        effectType: "fieldCondition",
        effect: "move: Psychic Terrain",
      })
    ).toEqual({
      minDuration: 5,
      maxDuration: 8,
    });
  });

  it("returns a duration range for Tailwind", () => {
    expect(
      getFieldEffectDurationMetadata({
        effectType: "sideCondition",
        effect: "move: Tailwind",
      })
    ).toEqual({
      minDuration: 4,
      maxDuration: 6,
    });
  });

  it("returns duration ranges for screens and Safeguard", () => {
    expect(
      getFieldEffectDurationMetadata({
        effectType: "sideCondition",
        effect: "move: Reflect",
      })
    ).toEqual({
      minDuration: 5,
      maxDuration: 8,
    });

    expect(
      getFieldEffectDurationMetadata({
        effectType: "sideCondition",
        effect: "move: Safeguard",
      })
    ).toEqual({
      minDuration: 5,
      maxDuration: 7,
    });
  });

  it("returns fixed durations from Showdown condition data", () => {
    expect(
      getFieldEffectDurationMetadata({
        effectType: "sideCondition",
        effect: "move: Mist",
      })
    ).toEqual({
      minDuration: 5,
      maxDuration: 5,
    });
  });

  it("does not return duration metadata for hazards", () => {
    expect(
      getFieldEffectDurationMetadata({
        effectType: "sideCondition",
        effect: "move: Stealth Rock",
      })
    ).toEqual({});
  });
});

describe("calculateFieldEffectRemainingTurns", () => {
  it("calculates remaining turns from the started turn and current turn", () => {
    expect(
      calculateFieldEffectRemainingTurns({
        currentTurn: 3,
        startedTurn: 2,
        minDuration: 5,
        maxDuration: 8,
      })
    ).toEqual({
      minRemainingTurns: 4,
      maxRemainingTurns: 7,
    });
  });

  it("does not return remaining turns when duration data is missing", () => {
    expect(
      calculateFieldEffectRemainingTurns({
        currentTurn: 3,
        startedTurn: 2,
      })
    ).toEqual({});
  });

  it("does not return remaining turns when started turn is missing", () => {
    expect(
      calculateFieldEffectRemainingTurns({
        currentTurn: 3,
        minDuration: 5,
        maxDuration: 8,
      })
    ).toEqual({});
  });

  it("does not go below zero", () => {
    expect(
      calculateFieldEffectRemainingTurns({
        currentTurn: 10,
        startedTurn: 2,
        minDuration: 5,
        maxDuration: 8,
      })
    ).toEqual({
      minRemainingTurns: 0,
      maxRemainingTurns: 0,
    });
  });

  it("uses upkeep ticks when they are ahead of the visible turn count", () => {
    expect(
      calculateFieldEffectRemainingTurns({
        currentTurn: 2,
        startedTurn: 2,
        minDuration: 5,
        maxDuration: 8,
        upkeepTicks: 1,
      })
    ).toEqual({
      minRemainingTurns: 4,
      maxRemainingTurns: 7,
    });
  });
});
