import { describe, expect, it } from "vitest";
import { presentBattleEvents } from "../../src/battle/battle-event-presenter";

describe("presentBattleEvents", () => {
  it("parses move, damage, heal and turn events", () => {
    const events = presentBattleEvents([
      [
        "p1",
        "|move|p1a: Pikachu|Thunderbolt|p2a: Bulbasaur",
        "|-damage|p2a: Bulbasaur|176/231",
        "|move|p2a: Bulbasaur|Giga Drain|p1a: Pikachu",
        "|-damage|p1a: Pikachu|94/211",
        "|-heal|p2a: Bulbasaur|231/231|[from] drain|[of] p1a: Pikachu",
        "|turn|2",
      ].join("\n"),
    ]);

    expect(events).toEqual([
      {
        type: "move",
        actor: "p1a: Pikachu",
        move: "Thunderbolt",
        target: "p2a: Bulbasaur",
      },
      {
        type: "damage",
        target: "p2a: Bulbasaur",
        condition: "176/231",
      },
      {
        type: "move",
        actor: "p2a: Bulbasaur",
        move: "Giga Drain",
        target: "p1a: Pikachu",
      },
      {
        type: "damage",
        target: "p1a: Pikachu",
        condition: "94/211",
      },
      {
        type: "heal",
        target: "p2a: Bulbasaur",
        condition: "231/231",
        source: "drain",
        sourceTarget: "p1a: Pikachu",
      },
      {
        type: "turn",
        turn: 2,
      },
    ]);
  });

  it("parses status, faint and win events", () => {
    const events = presentBattleEvents([
      [
        "p2",
        "|-status|p2a: Bulbasaur|par",
        "|faint|p1a: Pikachu",
        "|win|Gary",
      ].join("\n"),
    ]);

    expect(events).toEqual([
      {
        type: "status",
        target: "p2a: Bulbasaur",
        status: "par",
      },
      {
        type: "faint",
        target: "p1a: Pikachu",
      },
      {
        type: "win",
        winner: "Gary",
      },
    ]);
  });

  it("ignores lines that are not supported battle events", () => {
    const events = presentBattleEvents([
      [
        "p1",
        "",
        "|request|{\"active\":[]}",
        "|upkeep",
        "|t:|1778968278",
        "|start",
      ].join("\n"),
    ]);

    expect(events).toEqual([]);
  });
});
