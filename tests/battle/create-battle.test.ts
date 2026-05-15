import { describe, expect, it } from "vitest";
import { createBattle } from "../../src/battle/battle-service";

const pikachu = {
  species: "Pikachu",
  ability: "Static",
  item: "Light Ball",
  moves: ["Thunderbolt", "Quick Attack", "Iron Tail", "Volt Switch"],
};

const bulbasaur = {
  species: "Bulbasaur",
  ability: "Overgrow",
  item: "Eviolite",
  moves: ["Giga Drain", "Sludge Bomb", "Sleep Powder", "Protect"],
};

describe("createBattle", () => {
  it("rejects requests without both teams", async () => {
    const result = await createBattle({});

    expect(result).toEqual({
      success: false,
      error: "Missing teams",
    });
  });

  it("uses the default format when no formatId is given", async () => {
    const result = await createBattle({
      p1: {
        team: [pikachu],
      },
      p2: {
        team: [bulbasaur],
      },
    });

    expect(result).toMatchObject({
      success: true,
      formatId: "gen9nationaldex",
    });
  });

  it("uses default player names when names are not given", async () => {
    const result = await createBattle({
      p1: {
        team: [pikachu],
      },
      p2: {
        team: [bulbasaur],
      },
    });

    expect(result).toMatchObject({
      success: true,
      players: {
        p1: { name: "Player 1" },
        p2: { name: "Player 2" },
      },
    });
  });

  it("returns custom player names and a battleId", async () => {
    const result = await createBattle({
      p1: {
        name: "Ash",
        team: [pikachu],
      },
      p2: {
        name: "Gary",
        team: [bulbasaur],
      },
    });

    expect(result).toMatchObject({
      success: true,
      players: {
        p1: { name: "Ash" },
        p2: { name: "Gary" },
      },
    });
    expect(result.battleId).toEqual(expect.any(String));
  });
});
