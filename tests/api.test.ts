import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server = app.listen(0, "127.0.0.1", (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      const address = server.address() as AddressInfo;
      if (!address) {
        reject(new Error("Test server did not receive an address"));
        return;
      }

      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
    server.once("error", reject);
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

async function postJson(path: string, body: unknown) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

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

describe("Showdown API", () => {
  it("returns health status", async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
    });
  });

  it("returns API info", async () => {
    const response = await fetch(`${baseUrl}/info`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      name: "showdown-api",
      version: "1.0.0",
      engine: "pokemon-showdown",
      routes: {
        createBattle: "/create_battle",
        chooseLead: "/battles/:battleId/lead",
      },
    });
  });

  it("rejects create battle requests without teams", async () => {
    const response = await postJson("/create_battle", {});

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: "Missing teams",
    });
  });

  it("creates a wild battle with both slot 1 leads selected", async () => {
    const response = await postJson("/create_wild_battle", {
      p1: {
        team: [pikachu],
      },
      p2: {
        team: [bulbasaur],
      },
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.requests.p1.teamPreview).not.toBe(true);
    expect(body.requests.p2.teamPreview).not.toBe(true);
    expect(body.requests.p1.active[0].moves[0]).toMatchObject({
      id: "thunderbolt",
      pp: 24,
      maxpp: 24,
    });
    expect(body.requests.p2.active[0].moves[0]).toMatchObject({
      id: "gigadrain",
      pp: 16,
      maxpp: 16,
    });
  });

  it("rejects lead selection for an unknown battle", async () => {
    const response = await postJson("/battles/unknown-battle-id/lead", {
      playerId: "p1",
      slot: 1,
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      success: false,
      error: "Battle not found",
    });
  });
});
