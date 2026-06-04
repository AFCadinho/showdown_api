import { describe, expect, it } from "vitest";
import { presentBattleField } from "../../src/battle/battle-field-presenter";

describe("presentBattleField", () => {
  it("returns an empty field snapshot by default", () => {
    expect(presentBattleField()).toEqual({
      effects: [],
    });
  });

  it("returns provided field effects", () => {
    expect(
      presentBattleField({
        effects: [
          {
            scope: "field",
            effect: "RainDance",
          },
          {
            scope: "side",
            side: "p1",
            effect: "move: Tailwind",
          },
        ],
      })
    ).toEqual({
      effects: [
        {
          scope: "field",
          effect: "RainDance",
        },
        {
          scope: "side",
          side: "p1",
          effect: "move: Tailwind",
        },
      ],
    });
  });

  it("adds remaining turns when current turn and duration data are available", () => {
    expect(
      presentBattleField(
        {
          effects: [
            {
              scope: "field",
              effectType: "weather",
              effect: "RainDance",
              startedTurn: 2,
              minDuration: 5,
              maxDuration: 8,
            },
            {
              scope: "side",
              side: "p2",
              effectType: "sideCondition",
              effect: "move: Stealth Rock",
              startedTurn: 2,
            },
          ],
        },
        3
      )
    ).toEqual({
      effects: [
        {
          scope: "field",
          effectType: "weather",
          effect: "RainDance",
          startedTurn: 2,
          minDuration: 5,
          maxDuration: 8,
          minRemainingTurns: 4,
          maxRemainingTurns: 7,
        },
        {
          scope: "side",
          side: "p2",
          effectType: "sideCondition",
          effect: "move: Stealth Rock",
          startedTurn: 2,
        },
      ],
    });
  });
});
