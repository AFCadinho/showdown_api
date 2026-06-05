import { describe, expect, it } from "vitest";
import {
  getViewerKnownPokemonInfo,
  initializeKnownPokemonInfoByViewer,
  updateKnownPokemonInfoFromRequest,
} from "../../src/battle/battle-pokemon-knowledge";

describe("battle pokemon knowledge", () => {
  it("returns confirmed move PP on the maxed PP scale without revealing PP Ups", () => {
    const knownInfo = initializeKnownPokemonInfoByViewer();

    updateKnownPokemonInfoFromRequest(knownInfo, "p1", {
      active: [
        {
          moves: [
            {
              move: "Tail Whip",
              id: "tailwhip",
              pp: 28,
              maxpp: 30,
              target: "normal",
              disabled: false,
            },
          ],
        },
      ],
      side: {
        id: "p1",
        pokemon: [
          {
            ident: "p1: Rattata",
            details: "Rattata, L50, M",
            condition: "100/100",
            active: true,
            moves: ["tailwhip"],
          },
        ],
      },
    });

    expect(getViewerKnownPokemonInfo(knownInfo, "p1", "p1a: Rattata")).toEqual({
      ident: "p1: Rattata",
      confirmedMoves: [
        {
          name: "Tail Whip",
          pp: 46,
          maxpp: 48,
        },
      ],
    });
  });

  it("includes non-zero stat stages only for the active Pokemon", () => {
    const knownInfo = initializeKnownPokemonInfoByViewer();

    updateKnownPokemonInfoFromRequest(knownInfo, "p1", {
      side: {
        id: "p1",
        pokemon: [
          {
            ident: "p1: Hatterene",
            details: "Hatterene, L50, F",
            condition: "100/100",
            active: true,
            moves: [],
            ability: "Magic Bounce",
          },
          {
            ident: "p1: Rattata",
            details: "Rattata, L50, M",
            condition: "100/100",
            active: false,
            moves: [],
          },
        ],
      },
    });

    expect(
      getViewerKnownPokemonInfo(
        knownInfo,
        "p1",
        "p1a: Hatterene",
        { p1: "p1a: Hatterene" },
        {
          "p1: Hatterene": {
            spa: 1,
            spd: 1,
            atk: -1,
          },
          "p1: Rattata": {
            atk: 1,
          },
        }
      )
    ).toEqual({
      ident: "p1: Hatterene",
      confirmedAbility: "magic bounce",
      statChanges: {
        spa: 1,
        spd: 1,
        atk: -1,
      },
    });

    expect(
      getViewerKnownPokemonInfo(
        knownInfo,
        "p1",
        "p1a: Rattata",
        { p1: "p1a: Hatterene" },
        {
          "p1: Rattata": {
            atk: 1,
          },
        }
      )
    ).toBeNull();
  });
});
