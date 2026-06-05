import { describe, expect, it } from "vitest";
import {
  getVisibleStatStages,
  updatePokemonStatStagesFromLine,
} from "../../src/battle/battle-pokemon-stat-stages";
import type { PokemonStatStagesByIdent } from "../../src/battle/types";

describe("battle pokemon stat stages", () => {
  it("tracks ordinary boost and unboost stages", () => {
    const stages: PokemonStatStagesByIdent = {};

    updatePokemonStatStagesFromLine(stages, "|-boost|p1a: Hatterene|spa|1");
    updatePokemonStatStagesFromLine(stages, "|-boost|p1a: Hatterene|spd|1");
    updatePokemonStatStagesFromLine(stages, "|-unboost|p1a: Hatterene|atk|1");

    expect(getVisibleStatStages(stages, "p1: Hatterene")).toEqual({
      spa: 1,
      spd: 1,
      atk: -1,
    });
  });

  it("clamps stages between -6 and 6 and hides zero stages", () => {
    const stages: PokemonStatStagesByIdent = {};

    updatePokemonStatStagesFromLine(stages, "|-boost|p1a: Dragonite|atk|7");
    updatePokemonStatStagesFromLine(stages, "|-unboost|p1a: Dragonite|atk|6");

    expect(getVisibleStatStages(stages, "p1a: Dragonite")).toBeUndefined();
  });

  it("does not track ability modifier effects as ordinary stat stages", () => {
    const stages: PokemonStatStagesByIdent = {};

    updatePokemonStatStagesFromLine(stages, "|-activate|p1a: Great Tusk|Protosynthesisatk");
    updatePokemonStatStagesFromLine(stages, "|-activate|p2a: Iron Hands|QuarkDrivedef");

    expect(getVisibleStatStages(stages, "p1a: Great Tusk")).toBeUndefined();
    expect(getVisibleStatStages(stages, "p2a: Iron Hands")).toBeUndefined();
  });

  it("resets stages on switch, faint and battle win", () => {
    const stages: PokemonStatStagesByIdent = {};

    updatePokemonStatStagesFromLine(stages, "|-boost|p1a: Hatterene|spa|1");
    updatePokemonStatStagesFromLine(stages, "|switch|p1a: Hatterene|Hatterene, F|100/100");
    expect(getVisibleStatStages(stages, "p1a: Hatterene")).toBeUndefined();

    updatePokemonStatStagesFromLine(stages, "|-boost|p1a: Hatterene|spa|1");
    updatePokemonStatStagesFromLine(stages, "|faint|p1a: Hatterene");
    expect(getVisibleStatStages(stages, "p1a: Hatterene")).toBeUndefined();

    updatePokemonStatStagesFromLine(stages, "|-boost|p1a: Hatterene|spa|1");
    updatePokemonStatStagesFromLine(stages, "|win|Gary");
    expect(getVisibleStatStages(stages, "p1a: Hatterene")).toBeUndefined();
  });
});
