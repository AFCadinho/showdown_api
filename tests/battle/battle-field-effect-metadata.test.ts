import { describe, expect, it } from "vitest";
import { getFieldEffectDurationMetadata } from "../../src/battle/battle-field-effect-metadata";

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

  it("returns a fixed duration for Tailwind", () => {
    expect(
      getFieldEffectDurationMetadata({
        effectType: "sideCondition",
        effect: "move: Tailwind",
      })
    ).toEqual({
      minDuration: 4,
      maxDuration: 4,
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
