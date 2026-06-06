import { describe, expect, it } from "vitest";
import { updateFieldFromBattleLine } from "../../src/battle/battle-stream-listener";
import type { BattleFieldSnapshot } from "../../src/battle/battle-field-presenter";

describe("updateFieldFromBattleLine", () => {
  it("adds active weather to the field snapshot", () => {
    const field: BattleFieldSnapshot = {
      effects: [],
    };

    updateFieldFromBattleLine("|-weather|RainDance", {
      field,
      state: { turn: 2, ended: false, winner: null },
    });

    expect(field.effects).toEqual([
      {
        scope: "field",
        effectType: "weather",
        effect: "RainDance",
        startedTurn: 2,
        minDuration: 5,
        maxDuration: 8,
      },
    ]);
  });

  it("replaces previous weather in the field snapshot", () => {
    const field: BattleFieldSnapshot = {
      effects: [
        {
          scope: "field",
          effectType: "weather",
          effect: "RainDance",
        },
      ],
    };

    updateFieldFromBattleLine("|-weather|Sandstorm", { field });

    expect(field.effects).toEqual([
      {
        scope: "field",
        effectType: "weather",
        effect: "Sandstorm",
        minDuration: 5,
        maxDuration: 8,
      },
    ]);
  });

  it("keeps weather started turn when Showdown reports upkeep", () => {
    const field: BattleFieldSnapshot = {
      effects: [
        {
          scope: "field",
          effectType: "weather",
          effect: "RainDance",
          startedTurn: 2,
          minDuration: 5,
          maxDuration: 8,
        },
      ],
    };

    updateFieldFromBattleLine("|-weather|RainDance|[upkeep]", {
      field,
      state: { turn: 3, ended: false, winner: null },
    });

    expect(field.effects).toEqual([
      {
        scope: "field",
        effectType: "weather",
        effect: "RainDance",
        startedTurn: 2,
        minDuration: 5,
        maxDuration: 8,
        upkeepTicks: 1,
      },
    ]);
  });

  it("removes weather when Showdown reports none", () => {
    const field: BattleFieldSnapshot = {
      effects: [
        {
          scope: "field",
          effectType: "weather",
          effect: "RainDance",
        },
      ],
    };

    updateFieldFromBattleLine("|-weather|none", { field });

    expect(field.effects).toEqual([]);
  });

  it("keeps non-weather effects when weather changes", () => {
    const field: BattleFieldSnapshot = {
      effects: [
        {
          scope: "field",
          effect: "move: Trick Room",
        },
      ],
    };

    updateFieldFromBattleLine("|-weather|SunnyDay", { field });

    expect(field.effects).toEqual([
      {
        scope: "field",
        effect: "move: Trick Room",
      },
      {
        scope: "field",
        effectType: "weather",
        effect: "SunnyDay",
        minDuration: 5,
        maxDuration: 8,
      },
    ]);
  });

  it("adds field conditions to the field snapshot", () => {
    const field: BattleFieldSnapshot = {
      effects: [],
    };

    updateFieldFromBattleLine("|-fieldstart|move: Trick Room", {
      field,
      state: { turn: 2, ended: false, winner: null },
    });
    updateFieldFromBattleLine("|-fieldstart|move: Electric Terrain", {
      field,
      state: { turn: 3, ended: false, winner: null },
    });

    expect(field.effects).toEqual([
      {
        scope: "field",
        effectType: "fieldCondition",
        effectGroup: undefined,
        effect: "move: Trick Room",
        startedTurn: 2,
        minDuration: 5,
        maxDuration: 5,
      },
      {
        scope: "field",
        effectType: "fieldCondition",
        effect: "move: Electric Terrain",
        effectGroup: "terrain",
        startedTurn: 3,
        minDuration: 5,
        maxDuration: 8,
      },
    ]);
  });

  it("removes field conditions from the field snapshot", () => {
    const field: BattleFieldSnapshot = {
      effects: [
        {
          scope: "field",
          effectType: "fieldCondition",
          effect: "move: Trick Room",
        },
        {
          scope: "field",
          effectType: "fieldCondition",
          effect: "move: Electric Terrain",
          effectGroup: "terrain",
        },
      ],
    };

    updateFieldFromBattleLine("|-fieldend|move: Trick Room", { field });

    expect(field.effects).toEqual([
      {
        scope: "field",
        effectType: "fieldCondition",
        effect: "move: Electric Terrain",
        effectGroup: "terrain",
      },
    ]);
  });

  it("keeps weather when field conditions end", () => {
    const field: BattleFieldSnapshot = {
      effects: [
        {
          scope: "field",
          effectType: "weather",
          effect: "RainDance",
        },
        {
          scope: "field",
          effectType: "fieldCondition",
          effect: "move: Trick Room",
        },
      ],
    };

    updateFieldFromBattleLine("|-fieldend|move: Trick Room", { field });

    expect(field.effects).toEqual([
      {
        scope: "field",
        effectType: "weather",
        effect: "RainDance",
      },
    ]);
  });

  it("replaces terrain field conditions", () => {
    const field: BattleFieldSnapshot = {
      effects: [
        {
          scope: "field",
          effectType: "fieldCondition",
          effectGroup: "terrain",
          effect: "move: Electric Terrain",
        },
        {
          scope: "field",
          effectType: "fieldCondition",
          effect: "move: Trick Room",
        },
      ],
    };

    updateFieldFromBattleLine("|-fieldstart|move: Grassy Terrain", {
      field,
      state: { turn: 4, ended: false, winner: null },
    });

    expect(field.effects).toEqual([
      {
        scope: "field",
        effectType: "fieldCondition",
        effect: "move: Trick Room",
      },
      {
        scope: "field",
        effectType: "fieldCondition",
        effectGroup: "terrain",
        effect: "move: Grassy Terrain",
        startedTurn: 4,
        minDuration: 5,
        maxDuration: 8,
      },
    ]);
  });

  it("adds side conditions to the field snapshot", () => {
    const field: BattleFieldSnapshot = {
      effects: [],
    };

    updateFieldFromBattleLine("|-sidestart|p1: Ash|move: Tailwind", {
      field,
      state: { turn: 2, ended: false, winner: null },
    });
    updateFieldFromBattleLine("|-sidestart|p2: Wild|move: Stealth Rock", {
      field,
      state: { turn: 3, ended: false, winner: null },
    });

    expect(field.effects).toEqual([
      {
        scope: "side",
        side: "p1",
        effectType: "sideCondition",
        effect: "move: Tailwind",
        startedTurn: 2,
        minDuration: 4,
        maxDuration: 6,
      },
      {
        scope: "side",
        side: "p2",
        effectType: "sideCondition",
        effect: "move: Stealth Rock",
        startedTurn: 3,
      },
    ]);
  });

  it("tracks layers for stackable side conditions", () => {
    const field: BattleFieldSnapshot = {
      effects: [],
    };

    updateFieldFromBattleLine("|-sidestart|p2: Wild|move: Spikes", {
      field,
      state: { turn: 2, ended: false, winner: null },
    });
    updateFieldFromBattleLine("|-sidestart|p2: Wild|move: Spikes", {
      field,
      state: { turn: 3, ended: false, winner: null },
    });
    updateFieldFromBattleLine("|-sidestart|p2: Wild|move: Spikes", {
      field,
      state: { turn: 4, ended: false, winner: null },
    });
    updateFieldFromBattleLine("|-sidestart|p2: Wild|move: Spikes", {
      field,
      state: { turn: 5, ended: false, winner: null },
    });

    expect(field.effects).toEqual([
      {
        scope: "side",
        side: "p2",
        effectType: "sideCondition",
        effect: "move: Spikes",
        startedTurn: 2,
        layers: 3,
      },
    ]);
  });

  it("tracks Toxic Spikes up to two layers", () => {
    const field: BattleFieldSnapshot = {
      effects: [],
    };

    updateFieldFromBattleLine("|-sidestart|p1: Ash|move: Toxic Spikes", {
      field,
    });
    updateFieldFromBattleLine("|-sidestart|p1: Ash|move: Toxic Spikes", {
      field,
    });
    updateFieldFromBattleLine("|-sidestart|p1: Ash|move: Toxic Spikes", {
      field,
    });

    expect(field.effects).toEqual([
      {
        scope: "side",
        side: "p1",
        effectType: "sideCondition",
        effect: "move: Toxic Spikes",
        startedTurn: undefined,
        layers: 2,
      },
    ]);
  });

  it("adds duration metadata for side effects with Showdown condition durations", () => {
    const field: BattleFieldSnapshot = {
      effects: [],
    };

    updateFieldFromBattleLine("|-sidestart|p1: Ash|move: Reflect", {
      field,
      state: { turn: 2, ended: false, winner: null },
    });
    updateFieldFromBattleLine("|-sidestart|p2: Wild|move: Safeguard", {
      field,
      state: { turn: 3, ended: false, winner: null },
    });

    expect(field.effects).toEqual([
      {
        scope: "side",
        side: "p1",
        effectType: "sideCondition",
        effect: "move: Reflect",
        startedTurn: 2,
        minDuration: 5,
        maxDuration: 8,
      },
      {
        scope: "side",
        side: "p2",
        effectType: "sideCondition",
        effect: "move: Safeguard",
        startedTurn: 3,
        minDuration: 5,
        maxDuration: 7,
      },
    ]);
  });

  it("removes side conditions from the field snapshot", () => {
    const field: BattleFieldSnapshot = {
      effects: [
        {
          scope: "side",
          side: "p1",
          effectType: "sideCondition",
          effect: "move: Tailwind",
        },
        {
          scope: "side",
          side: "p2",
          effectType: "sideCondition",
          effect: "move: Stealth Rock",
        },
      ],
    };

    updateFieldFromBattleLine("|-sideend|p1: Ash|move: Tailwind", {
      field,
    });

    expect(field.effects).toEqual([
      {
        scope: "side",
        side: "p2",
        effectType: "sideCondition",
        effect: "move: Stealth Rock",
      },
    ]);
  });

  it("removes side conditions when Showdown omits the move prefix on end", () => {
    const field: BattleFieldSnapshot = {
      effects: [
        {
          scope: "side",
          side: "p2",
          effectType: "sideCondition",
          effect: "move: Stealth Rock",
        },
      ],
    };

    updateFieldFromBattleLine("|-sideend|p2: Wild|Stealth Rock", {
      field,
    });

    expect(field.effects).toEqual([]);
  });

  it("keeps field effects when side conditions end", () => {
    const field: BattleFieldSnapshot = {
      effects: [
        {
          scope: "field",
          effectType: "fieldCondition",
          effect: "move: Trick Room",
        },
        {
          scope: "side",
          side: "p1",
          effectType: "sideCondition",
          effect: "move: Tailwind",
        },
      ],
    };

    updateFieldFromBattleLine("|-sideend|p1: Ash|move: Tailwind", {
      field,
    });

    expect(field.effects).toEqual([
      {
        scope: "field",
        effectType: "fieldCondition",
        effect: "move: Trick Room",
      },
    ]);
  });
});
