import { describe, expect, it } from "vitest";
import { presentBattleRequest } from "../../src/battle/battle-request-presenter";

describe("presentBattleRequest", () => {
  it("keeps force switch state from Showdown requests", () => {
    const request = {
      forceSwitch: [true],
      side: {
        pokemon: [
          {
            ident: "p1: Magikarp",
            details: "Magikarp, L1, M",
            condition: "0 fnt",
            active: true,
          },
          {
            ident: "p1: Charizard",
            details: "Charizard, L50, M",
            condition: "153/153",
            active: false,
          },
        ],
      },
    };

    const presentedRequest = presentBattleRequest(
      request,
      "gen9nationaldex"
    ) as any;

    expect(presentedRequest.forceSwitch).toEqual([true]);
    expect(presentedRequest.side.pokemon[0]).toMatchObject({
      ident: "p1: Magikarp",
      condition: "0 fnt",
    });
  });
});
