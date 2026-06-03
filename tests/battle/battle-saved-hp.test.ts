import { describe, expect, it } from "vitest";
import { buildApplySavedHpEvalCommand } from "../../src/battle/battle-saved-hp";

describe("buildApplySavedHpEvalCommand", () => {
  it("builds an eval command for player one saved HP", () => {
    const command = buildApplySavedHpEvalCommand("p1", {
      "p1: Pikachu": [
        {
          instanceId: "pokemon_123",
          currentHp: 12,
          maxHp: 35,
        },
      ],
    });

    expect(command).toContain(">eval");
    expect(command).toContain("battle.sides[0]");
    expect(command).toContain(
      JSON.stringify([
        {
          name: "Pikachu",
          occurrence: 0,
          currentHp: 12,
        },
      ])
    );
    expect(command).toContain("pokemon.sethp(saved.currentHp)");
    expect(command).toContain("battle.makeRequest()");
  });

  it("builds an eval command for player two saved HP", () => {
    const command = buildApplySavedHpEvalCommand("p2", {
      "p2: Bulbasaur": [
        {
          instanceId: "pokemon_456",
          currentHp: 8,
          maxHp: 21,
        },
      ],
    });

    expect(command).toContain("battle.sides[1]");
    expect(command).toContain('"name":"Bulbasaur"');
    expect(command).toContain('"currentHp":8');
  });

  it("escapes Pokemon names through JSON payload", () => {
    const command = buildApplySavedHpEvalCommand("p1", {
      'p1: Sparky "One"': [
        {
          instanceId: "pokemon_123",
          currentHp: 12,
          maxHp: 35,
        },
      ],
    });

    expect(command).toContain('\\"One\\"');
  });
});
