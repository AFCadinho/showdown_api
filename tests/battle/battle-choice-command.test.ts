import { describe, expect, it } from "vitest";
import { buildChoiceCommand } from "../../src/battle/battle-choice-command";

describe("buildChoiceCommand", () => {
  it("builds a move command for Pokemon Showdown player streams", () => {
    const command = buildChoiceCommand({
      playerId: "p1",
      type: "move",
      slot: 1,
    });

    expect(command).toBe("move 1");
  });

  it("builds a switch command for Pokemon Showdown player streams", () => {
    const command = buildChoiceCommand({
      playerId: "p2",
      type: "switch",
      slot: 3,
    });

    expect(command).toBe("switch 3");
  });
});
