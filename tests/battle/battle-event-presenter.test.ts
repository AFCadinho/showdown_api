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
        previousCondition: "176/231",
        condition: "231/231",
        previousHp: 176,
        hp: 231,
        maxHp: 231,
        amount: 55,
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

  it("parses weather events as field effects", () => {
    const events = presentBattleEventsForResponse([
      [
        "p1",
        "|-weather|RainDance",
        "|-weather|Sandstorm|[upkeep]",
        "|-weather|none",
      ].join("\n"),
    ]);

    expect(events).toEqual([
      {
        type: "fieldEffect",
        scope: "field",
        effectType: "weather",
        effect: "RainDance",
        state: "start",
        minDuration: 5,
        maxDuration: 8,
      },
      {
        type: "fieldEffect",
        scope: "field",
        effectType: "weather",
        effect: "Sandstorm",
        state: "upkeep",
        minDuration: 5,
        maxDuration: 8,
      },
      {
        type: "fieldEffect",
        scope: "field",
        effectType: "weather",
        effect: "none",
        state: "end",
      },
    ]);
  });

  it("parses weather source metadata from Showdown bracket fields", () => {
    const events = presentBattleEventsForResponse([
      [
        "p1",
        "|-weather|RainDance|[from] ability: Drizzle|[of] p1a: Pelipper",
      ].join("\n"),
    ]);

    expect(events).toEqual([
      {
        type: "fieldEffect",
        scope: "field",
        effectType: "weather",
        effect: "RainDance",
        state: "start",
        source: "ability: Drizzle",
        sourceTarget: "p1a: Pelipper",
        minDuration: 5,
        maxDuration: 8,
      },
    ]);
  });

  it("parses field condition events as field effects", () => {
    const events = presentBattleEventsForResponse([
      [
        "p1",
        "|-fieldstart|move: Trick Room",
        "|-fieldstart|move: Grassy Terrain",
        "|-fieldend|move: Trick Room",
      ].join("\n"),
    ]);

    expect(events).toEqual([
      {
        type: "fieldEffect",
        scope: "field",
        effectType: "fieldCondition",
        effectGroup: undefined,
        effect: "move: Trick Room",
        state: "start",
        minDuration: 5,
        maxDuration: 5,
      },
      {
        type: "fieldEffect",
        scope: "field",
        effectType: "fieldCondition",
        effectGroup: "terrain",
        effect: "move: Grassy Terrain",
        state: "start",
        minDuration: 5,
        maxDuration: 8,
      },
      {
        type: "fieldEffect",
        scope: "field",
        effectType: "fieldCondition",
        effectGroup: undefined,
        effect: "move: Trick Room",
        state: "end",
        minDuration: 5,
        maxDuration: 5,
      },
    ]);
  });

  it("parses field condition source metadata from Showdown bracket fields", () => {
    const events = presentBattleEventsForResponse([
      [
        "p1",
        "|-fieldstart|move: Electric Terrain|[from] ability: Electric Surge|[of] p1a: Pincurchin",
      ].join("\n"),
    ]);

    expect(events).toEqual([
      {
        type: "fieldEffect",
        scope: "field",
        effectType: "fieldCondition",
        effectGroup: "terrain",
        effect: "move: Electric Terrain",
        state: "start",
        source: "ability: Electric Surge",
        sourceTarget: "p1a: Pincurchin",
        minDuration: 5,
        maxDuration: 8,
      },
    ]);
  });

  it("parses side condition events as field effects", () => {
    const events = presentBattleEventsForResponse([
      [
        "p1",
        "|-sidestart|p1: Ash|move: Tailwind",
        "|-sidestart|p2: Wild|move: Stealth Rock",
        "|-sideend|p1: Ash|move: Tailwind",
        "|-sideend|p2: Wild|Stealth Rock",
      ].join("\n"),
    ]);

    expect(events).toEqual([
      {
        type: "fieldEffect",
        scope: "side",
        side: "p1",
        effectType: "sideCondition",
        effect: "move: Tailwind",
        state: "start",
        minDuration: 4,
        maxDuration: 4,
      },
      {
        type: "fieldEffect",
        scope: "side",
        side: "p2",
        effectType: "sideCondition",
        effect: "move: Stealth Rock",
        state: "start",
      },
      {
        type: "fieldEffect",
        scope: "side",
        side: "p1",
        effectType: "sideCondition",
        effect: "move: Tailwind",
        state: "end",
        minDuration: 4,
        maxDuration: 4,
      },
      {
        type: "fieldEffect",
        scope: "side",
        side: "p2",
        effectType: "sideCondition",
        effect: "move: Stealth Rock",
        state: "end",
      },
    ]);
  });

  it("parses side condition source metadata from Showdown bracket fields", () => {
    const events = presentBattleEventsForResponse([
      [
        "p1",
        "|-sidestart|p2: Wild|move: Stealth Rock|[from] move: Stealth Rock|[of] p1a: Golem",
      ].join("\n"),
    ]);

    expect(events).toEqual([
      {
        type: "fieldEffect",
        scope: "side",
        side: "p2",
        effectType: "sideCondition",
        effect: "move: Stealth Rock",
        state: "start",
        source: "move: Stealth Rock",
        sourceTarget: "p1a: Golem",
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
        playerId: "p1",
        from: undefined,
        fromIdent: undefined,
        to: "Gyarados",
        toIdent: "p1a: Gyarados",
        pokemon: "p1a: Gyarados",
        details: "Gyarados, M",
        condition: "353/353",
      },
      {
        type: "switch",
        playerId: "p2",
        from: undefined,
        fromIdent: undefined,
        to: "Venusaur",
        toIdent: "p2a: Venusaur",
        pokemon: "p2a: Venusaur",
        details: "Venusaur, F",
        condition: "364/364",
      },
    ]);
  });

  it("adds from and to details to switch events from active state", () => {
    const activeByPlayer = {
      p1: "p1a: Venusaur",
    };

    const events = presentBattleEventsForResponse(
      [["p1", "|switch|p1a: Blastoise|Blastoise, M|299/299"].join("\n")],
      {},
      {},
      activeByPlayer
    );

    expect(events).toEqual([
      {
        type: "switch",
        playerId: "p1",
        from: "Venusaur",
        fromIdent: "p1a: Venusaur",
        to: "Blastoise",
        toIdent: "p1a: Blastoise",
        pokemon: "p1a: Blastoise",
        details: "Blastoise, M",
        condition: "299/299",
      },
    ]);
    expect(activeByPlayer.p1).toBe("p1a: Blastoise");
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
      conditionByPokemon: {
        "p2a: Pidgey": "16/16",
      },
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

  it("adds previous HP values to damage events from condition state", () => {
    const battleData = {
      requests: {
        p2: {
          side: {
            pokemon: [
              {
                ident: "p2: Pidgey",
                condition: "16/16",
                active: true,
              },
            ],
          },
        },
      },
      log: [
        [
          "p1",
          "|move|p1a: Pikachu|Thunderbolt|p2a: Pidgey",
          "|-damage|p2a: Pidgey|0 fnt",
        ].join("\n"),
      ],
      eventCursor: 0,
      conditionByPokemon: {
        "p2a: Pidgey": "16/16",
      },
    } as BattleData;

    expect(consumeBattleEventsForResponse(battleData)).toEqual([
      {
        type: "move",
        actor: "p1a: Pikachu",
        move: "Thunderbolt",
        target: "p2a: Pidgey",
      },
      {
        type: "damage",
        target: "p2a: Pidgey",
        previousCondition: "16/16",
        condition: "0 fnt",
        previousHp: 16,
        hp: 0,
        maxHp: 16,
        amount: 16,
      },
    ]);
  });

  it("adds previous HP values to heal events from condition state", () => {
    const battleData = {
      requests: {
        p2: {
          side: {
            pokemon: [
              {
                ident: "p2: Bulbasaur",
                condition: "176/231",
                active: true,
              },
            ],
          },
        },
      },
      log: [
        [
          "p1",
          "|-heal|p2a: Bulbasaur|231/231|[from] drain|[of] p1a: Pikachu",
        ].join("\n"),
      ],
      eventCursor: 0,
      conditionByPokemon: {
        "p2a: Bulbasaur": "176/231",
      },
    } as BattleData;

    expect(consumeBattleEventsForResponse(battleData)).toEqual([
      {
        type: "heal",
        target: "p2a: Bulbasaur",
        previousCondition: "176/231",
        condition: "231/231",
        previousHp: 176,
        hp: 231,
        maxHp: 231,
        amount: 55,
        source: "drain",
        sourceTarget: "p1a: Pikachu",
      },
    ]);
  });

  it("uses the latest request condition when log damage uses visible HP percentages", () => {
    const battleData = {
      requests: {
        p2: {
          side: {
            pokemon: [
              {
                ident: "p2: Mewtwo",
                condition: "92/353",
                active: true,
              },
            ],
          },
        },
      },
      log: [
        [
          "p1",
          "|-damage|p2a: Mewtwo|27/100",
        ].join("\n"),
      ],
      eventCursor: 0,
      conditionByPokemon: {
        "p2a: Mewtwo": "353/353",
      },
    } as BattleData;

    expect(consumeBattleEventsForResponse(battleData)).toEqual([
      {
        type: "damage",
        target: "p2a: Mewtwo",
        previousCondition: "353/353",
        condition: "92/353",
        previousHp: 353,
        hp: 92,
        maxHp: 353,
        amount: 261,
      },
    ]);
  });
});
