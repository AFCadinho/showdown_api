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
