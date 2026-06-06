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
        pokemonStats: "/pokemon-stats",
        parsePokemon: "/parse_pokemon",
        parseTeam: "/parse_team",
        createBattle: "/create_battle",
        chooseLead: "/battles/:battleId/lead",
      },
    });
  });

  it("returns Pokemon speed ranges with level 100 as default", async () => {
    const response = await fetch(`${baseUrl}/pokemon-stats?species=Mewtwo`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      pokemon: {
        species: "Mewtwo",
        level: 100,
        baseStats: {
          hp: 106,
          atk: 110,
          def: 90,
          spa: 154,
          spd: 90,
          spe: 130,
        },
        speed: {
          min: 238,
          minNeutral31Iv: 296,
          maxNeutral31Iv: 359,
          max: 394,
        },
      },
    });
  });

  it("returns Pokemon speed ranges for a custom level", async () => {
    const response = await fetch(`${baseUrl}/pokemon-stats?species=Mewtwo&level=50`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pokemon).toMatchObject({
      species: "Mewtwo",
      level: 50,
      speed: {
        min: 121,
        minNeutral31Iv: 150,
        maxNeutral31Iv: 182,
        max: 200,
      },
    });
  });

  it("rejects unknown Pokemon stats species", async () => {
    const response = await fetch(`${baseUrl}/pokemon-stats?species=Missingnope`);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: "Unknown species",
    });
  });

  it("rejects invalid Pokemon stats levels", async () => {
    const response = await fetch(`${baseUrl}/pokemon-stats?species=Mewtwo&level=101`);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: "level must be an integer from 1 to 100",
    });
  });

  it("parses one Pokemon from Showdown export text", async () => {
    const response = await postJson("/parse_pokemon", {
      text: [
        "Pika (Pikachu) @ Light Ball",
        "Ability: Static",
        "Level: 50",
        "Tera Type: Electric",
        "EVs: 252 Atk / 4 SpD / 252 Spe",
        "Jolly Nature",
        "- Volt Tackle",
        "- Quick Attack",
      ].join("\n"),
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      pokemon: {
        name: "Pika",
        species: "Pikachu",
        item: "Light Ball",
        ability: "Static",
        gender: "",
        nature: "Jolly",
        evs: {
          hp: 0,
          atk: 252,
          def: 0,
          spa: 0,
          spd: 4,
          spe: 252,
        },
        ivs: {
          hp: 31,
          atk: 31,
          def: 31,
          spa: 31,
          spd: 31,
          spe: 31,
        },
        level: 50,
        moves: ["Volt Tackle", "Quick Attack"],
        teraType: "Electric",
      },
    });
  });

  it("rejects parse Pokemon requests without text", async () => {
    const response = await postJson("/parse_pokemon", {});

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: "text is required",
    });
  });

  it("parses a full Pokemon Showdown team export", async () => {
    const response = await postJson("/parse_team", {
      text: [
        "Rillaboom @ Assault Vest",
        "Ability: Grassy Surge",
        "Level: 50",
        "Tera Type: Grass",
        "EVs: 204 HP / 252 Atk / 52 Spe",
        "Adamant Nature",
        "- Grassy Glide",
        "- Knock Off",
        "- U-turn",
        "- Low Kick",
        "",
        "Mewtwo @ Leftovers",
        "Ability: Pressure",
        "Level: 100",
        "Tera Type: Psychic",
        "Timid Nature",
        "- Psystrike",
        "- Aura Sphere",
      ].join("\n"),
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      team: [
        expect.objectContaining({
          species: "Rillaboom",
          item: "Assault Vest",
          ability: "Grassy Surge",
          level: 50,
          nature: "Adamant",
          moves: ["Grassy Glide", "Knock Off", "U-turn", "Low Kick"],
        }),
        expect.objectContaining({
          species: "Mewtwo",
          item: "Leftovers",
          ability: "Pressure",
          level: 100,
          nature: "Timid",
          moves: ["Psystrike", "Aura Sphere"],
        }),
      ],
    });
  });

  it("rejects parse team requests without text", async () => {
    const response = await postJson("/parse_team", {});

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: "text is required",
    });
  });

  it("rejects parsed teams with more than six Pokemon", async () => {
    const text = Array.from({ length: 7 }, (_, index) =>
      [
        `Pikachu${index + 1} (Pikachu)`,
        "Ability: Static",
        "- Thunderbolt",
      ].join("\n")
    ).join("\n\n");

    const response = await postJson("/parse_team", { text });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: "Team must contain 1 to 6 Pokemon",
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
      effectiveness: {
        multiplier: 0.5,
        label: "not_very_effective",
        immune: false,
      },
    });
    expect(body.requests.p2.active[0].moves[0]).toMatchObject({
      id: "gigadrain",
      pp: 16,
      maxpp: 16,
    });
  });

  it("returns confirmed pokemon info for a known pokemon", async () => {
    const createResponse = await postJson("/create_wild_battle", {
      p1: {
        team: [
          {
            species: "Pikachu",
            ability: "Static",
            item: "Life Orb",
            moves: ["Thunderbolt", "Quick Attack"],
          },
        ],
      },
      p2: {
        team: [
          {
            species: "Bulbasaur",
            ability: "Overgrow",
            item: "Leftovers",
            moves: ["Giga Drain", "Sludge Bomb"],
          },
        ],
      },
    });

    const battle = await createResponse.json();

    const infoResponse = await fetch(
      `${baseUrl}/battles/${battle.battleId}/pokemon-info?viewerId=p1&ident=${encodeURIComponent("p1a: Pikachu")}`
    );
    const infoBody = await infoResponse.json();

    expect(infoResponse.status).toBe(200);
    expect(infoBody).toEqual({
      success: true,
      pokemon: {
        ident: "p1: Pikachu",
        confirmedMoves: [
          {
            name: "Thunderbolt",
            pp: 24,
            maxpp: 24,
          },
          {
            name: "Quick Attack",
            pp: 48,
            maxpp: 48,
          },
        ],
        confirmedItem: "life orb",
        confirmedAbility: "static",
      },
    });
  });

  it("does not leak opponent pokemon info through player-specific query", async () => {
    const createResponse = await postJson("/create_wild_battle", {
      p1: {
        team: [
          {
            species: "Pikachu",
            ability: "Static",
            item: "Life Orb",
            moves: ["Thunderbolt", "Quick Attack"],
          },
        ],
      },
      p2: {
        team: [
          {
            species: "Bulbasaur",
            ability: "Overgrow",
            item: "Leftovers",
            moves: ["Giga Drain", "Sludge Bomb"],
          },
        ],
      },
    });

    const battle = await createResponse.json();

    const infoResponse = await fetch(
      `${baseUrl}/battles/${battle.battleId}/pokemon-info?viewerId=p1&ident=${encodeURIComponent("p2a: Bulbasaur")}`
    );
    const infoBody = await infoResponse.json();

    expect(infoResponse.status).toBe(200);
    expect(infoBody).toEqual({
      success: true,
      pokemon: null,
    });
  });

  it("adds move knowledge for opponent pokemon from battle events", async () => {
    const createResponse = await postJson("/create_wild_battle", {
      p1: {
        team: [
          {
            species: "Pikachu",
            ability: "Static",
            item: "Life Orb",
            moves: ["Quick Attack", "Thunder Shock"],
          },
        ],
      },
      p2: {
        team: [
          {
            species: "Bulbasaur",
            ability: "Overgrow",
            item: "Leftovers",
            moves: ["Giga Drain", "Sludge Bomb"],
          },
        ],
      },
    });

    const battle = await createResponse.json();

    await postJson(`/battles/${battle.battleId}/choice`, {
      playerId: "p1",
      type: "move",
      slot: 1,
    });
    await postJson(`/battles/${battle.battleId}/choice`, {
      playerId: "p2",
      type: "move",
      slot: 1,
    });

    const infoResponse = await fetch(
      `${baseUrl}/battles/${battle.battleId}/pokemon-info?viewerId=p1&ident=${encodeURIComponent("p2a: Bulbasaur")}`
    );
    const infoBody = await infoResponse.json();

    expect(infoResponse.status).toBe(200);
    expect(infoBody).toMatchObject({
      success: true,
      pokemon: {
        ident: "p2: Bulbasaur",
        confirmedMoves: [
          expect.objectContaining({
            name: "Giga Drain",
          }),
        ],
      },
    });
  });

  it("uses maxed PP for confirmed move knowledge and counts down from it", async () => {
    const createResponse = await postJson("/create_wild_battle", {
      p1: {
        team: [
          {
            species: "Rattata",
            ability: "Run Away",
            moves: ["Tail Whip"],
          },
        ],
      },
      p2: {
        team: [
          {
            species: "Magikarp",
            ability: "Swift Swim",
            moves: ["Splash"],
          },
        ],
      },
    });

    const battle = await createResponse.json();

    await postJson(`/battles/${battle.battleId}/choice`, {
      playerId: "p1",
      type: "move",
      slot: 1,
    });
    await postJson(`/battles/${battle.battleId}/choice`, {
      playerId: "p2",
      type: "move",
      slot: 1,
    });
    await postJson(`/battles/${battle.battleId}/choice`, {
      playerId: "p1",
      type: "move",
      slot: 1,
    });
    await postJson(`/battles/${battle.battleId}/choice`, {
      playerId: "p2",
      type: "move",
      slot: 1,
    });

    const infoResponse = await fetch(
      `${baseUrl}/battles/${battle.battleId}/pokemon-info?viewerId=p1&ident=${encodeURIComponent("p1a: Rattata")}`
    );
    const infoBody = await infoResponse.json();

    expect(infoResponse.status).toBe(200);
    expect(infoBody.pokemon.confirmedMoves).toContainEqual({
      name: "Tail Whip",
      pp: 46,
      maxpp: 48,
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
