import { describe, expect, it } from "vitest";
import {
  consumeBattleEventsForResponse,
  presentBattleEventsForResponse,
} from "../../src/battle/battle-event-presenter";
import type { BattleData } from "../../src/battle/types";

describe("presentBattleEventsForResponse", () => {
  it("parses move, damage, heal and turn events", () => {
    const events = presentBattleEventsForResponse([
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
    const events = presentBattleEventsForResponse([
      [
        "p1",
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

  it("parses cant events when a Pokemon cannot move", () => {
    const events = presentBattleEventsForResponse([
      [
        "p1",
        "|cant|p1a: Pikachu|flinch",
        "|cant|p2a: Charizard|recharge|Hyper Beam",
      ].join("\n"),
    ]);

    expect(events).toEqual([
      {
        type: "cant",
        target: "p1a: Pikachu",
        reason: "flinch",
        move: undefined,
      },
      {
        type: "cant",
        target: "p2a: Charizard",
        reason: "recharge",
        move: "Hyper Beam",
      },
    ]);
  });

  it("parses fail events when a move action fails", () => {
    const events = presentBattleEventsForResponse([
      [
        "p1",
        "|-fail|p1a: Pikachu|move: Protect",
        "|-fail|p2a: Persian",
      ].join("\n"),
    ]);

    expect(events).toEqual([
      {
        type: "fail",
        target: "p1a: Pikachu",
        action: "move: Protect",
      },
      {
        type: "fail",
        target: "p2a: Persian",
        action: undefined,
      },
    ]);
  });

  it("parses switch events when a Pokemon enters battle", () => {
    const events = presentBattleEventsForResponse([
      [
        "p1",
        "|switch|p1a: Gyarados|Gyarados, M|353/353",
        "|switch|p2a: Venusaur|Venusaur, F|364/364",
      ].join("\n"),
    ]);

    expect(events).toEqual([
      {
        type: "switch",
        pokemon: "p1a: Gyarados",
        details: "Gyarados, M",
        condition: "353/353",
      },
      {
        type: "switch",
        pokemon: "p2a: Venusaur",
        details: "Venusaur, F",
        condition: "364/364",
      },
    ]);
  });

  it("ignores lines that are not supported battle events", () => {
    const events = presentBattleEventsForResponse([
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

  it("ignores duplicate battle events from player two stream chunks", () => {
    const events = presentBattleEventsForResponse([
      ["p1", "|turn|1"].join("\n"),
      ["p2", "|turn|1"].join("\n"),
    ]);

    expect(events).toEqual([
      {
        type: "turn",
        turn: 1,
      },
    ]);
  });
});

describe("consumeBattleEventsForResponse", () => {
  it("returns only events that were added after the event cursor", () => {
    const battleData = {
      log: [
        ["p1", "|turn|1"].join("\n"),
        ["p2", "|turn|1"].join("\n"),
      ],
      eventCursor: 0,
    } as BattleData;

    expect(consumeBattleEventsForResponse(battleData)).toEqual([
      {
        type: "turn",
        turn: 1,
      },
    ]);
    expect(battleData.eventCursor).toBe(2);

    expect(consumeBattleEventsForResponse(battleData)).toEqual([]);
    expect(battleData.eventCursor).toBe(2);

    battleData.log.push(
      [
        "p1",
        "|move|p1a: Pikachu|Thunderbolt|p2a: Bulbasaur",
        "|-damage|p2a: Bulbasaur|176/231",
      ].join("\n")
    );

    expect(consumeBattleEventsForResponse(battleData)).toEqual([
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
    ]);
    expect(battleData.eventCursor).toBe(3);
  });
});
