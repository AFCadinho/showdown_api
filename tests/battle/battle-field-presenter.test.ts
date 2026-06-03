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
});
