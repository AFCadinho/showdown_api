import { describe, expect, it } from "vitest";
import { BattleStore } from "../../src/battle/battle-store";
import type { BattleData } from "../../src/battle/types";

function createBattleData(): BattleData {
  return {
    stream: {},
    playerStreams: {
      p1: {
        write: async () => {},
      },
      p2: {
        write: async () => {},
      },
    },
    log: [],
    requests: {},
    state: {
      turn: 1,
      ended: false,
      winner: null,
    },
    players: {
      p1: { name: "Ash" },
      p2: { name: "Gary" },
    },
  };
}

describe("BattleStore", () => {
  it("saves and returns a battle", () => {
    const store = new BattleStore();
    const battle = createBattleData();

    store.saveBattle("battle-1", battle);

    expect(store.getBattle("battle-1")).toBe(battle);
  });

  it("removes a battle", () => {
    const store = new BattleStore();
    const battle = createBattleData();

    store.saveBattle("battle-1", battle);
    store.removeBattle("battle-1");

    expect(store.getBattle("battle-1")).toBeUndefined();
  });

  it("updates a player request", () => {
    const store = new BattleStore();
    const battle = createBattleData();
    const request = { rqid: 1 };

    store.saveBattle("battle-1", battle);
    store.updateRequest("battle-1", "p1", request);

    expect(store.getBattle("battle-1")?.requests.p1).toBe(request);
  });

  it("appends battle logs", () => {
    const store = new BattleStore();
    const battle = createBattleData();

    store.saveBattle("battle-1", battle);
    store.appendLog("battle-1", "p1\n|request|{}");

    expect(store.getBattle("battle-1")?.log).toEqual(["p1\n|request|{}"]);
  });

  it("ignores updates for unknown battles", () => {
    const store = new BattleStore();

    expect(() => store.updateRequest("missing", "p1", { rqid: 1 })).not.toThrow();
    expect(() => store.appendLog("missing", "log")).not.toThrow();
  });
});
