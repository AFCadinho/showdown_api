import { describe, expect, it } from "vitest";
import {
  applyPokemonInstanceIdsToRequests,
  applyPokemonSaveStateToRequests,
  buildPokemonInstanceIdMap,
  buildPokemonSaveStateMap,
} from "../../src/battle/battle-pokemon-instance-ids";

describe("battle pokemon instance ids", () => {
  it("stores saved HP state by the Showdown request ident", () => {
    const saveState = buildPokemonSaveStateMap(
      [
        {
          species: "Pikachu",
          instanceId: "pokemon_123",
          currentHp: 12,
          maxHp: 35,
        },
      ],
      []
    );

    expect(saveState).toEqual({
      "p1: Pikachu": [
        {
          instanceId: "pokemon_123",
          currentHp: 12,
          maxHp: 35,
        },
      ],
    });
  });

  it("stores instance ids by the Showdown request ident", () => {
    const instanceIds = buildPokemonInstanceIdMap(
      [
        {
          species: "Koraidon",
          instanceId: "pokemon_123",
        },
      ],
      [
        {
          species: "Pidgey",
          instanceId: "pokemon_456",
        },
      ]
    );

    expect(instanceIds).toEqual({
      byIdent: {
        "p1: Koraidon": ["pokemon_123"],
        "p2: Pidgey": ["pokemon_456"],
      },
      byPlayerSlot: {
        p1: ["pokemon_123"],
        p2: ["pokemon_456"],
      },
    });
  });

  it("uses nicknames when Showdown uses a nickname in the ident", () => {
    const instanceIds = buildPokemonInstanceIdMap(
      [
        {
          name: "Red Wing",
          species: "Charizard",
          instanceId: "pokemon_charizard",
        },
      ],
      []
    );

    expect(instanceIds).toEqual({
      byIdent: {
        "p1: Red Wing": ["pokemon_charizard"],
      },
      byPlayerSlot: {
        p1: ["pokemon_charizard"],
        p2: [],
      },
    });
  });

  it("keeps multiple instance ids for repeated request idents", () => {
    const instanceIds = buildPokemonInstanceIdMap(
      [
        {
          species: "Pikachu",
          instanceId: "pokemon_1",
        },
        {
          species: "Pikachu",
          instanceId: "pokemon_2",
        },
      ],
      []
    );

    const snapshot = applyPokemonInstanceIdsToRequests(
      {
        p1: {
          side: {
            pokemon: [
              {
                ident: "p1: Pikachu",
                condition: "35/35",
              },
              {
                ident: "p1: Pikachu",
                condition: "28/28",
              },
            ],
          },
        },
      },
      instanceIds
    ) as any;

    expect(snapshot.p1.side.pokemon[0].instanceId).toBe("pokemon_1");
    expect(snapshot.p1.side.pokemon[1].instanceId).toBe("pokemon_2");
  });

  it("adds instance ids to request side pokemon", () => {
    const requests = {
      p1: {
        side: {
          pokemon: [
            {
              ident: "p1: Koraidon",
              details: "Koraidon, L100",
              condition: "120/297",
              active: true,
            },
          ],
        },
      },
    };

    const snapshot = applyPokemonInstanceIdsToRequests(requests, {
      byIdent: {
        "p1: Koraidon": ["pokemon_123"],
      },
      byPlayerSlot: {
        p1: ["pokemon_123"],
      },
    }) as any;

    expect(snapshot.p1.side.pokemon[0]).toMatchObject({
      ident: "p1: Koraidon",
      instanceId: "pokemon_123",
    });
  });

  it("falls back to request side order when a form changes the request ident", () => {
    const instanceIds = buildPokemonInstanceIdMap(
      [
        {
          species: "Charizard-Mega-Y",
          instanceId: "pokemon_charizard_mega_y",
        },
      ],
      []
    );

    const snapshot = applyPokemonInstanceIdsToRequests(
      {
        p1: {
          side: {
            id: "p1",
            pokemon: [
              {
                ident: "p1: Charizard",
                details: "Charizard-Mega-Y, L50, M",
                condition: "153/153",
              },
            ],
          },
        },
      },
      instanceIds
    ) as any;

    expect(snapshot.p1.side.pokemon[0]).toMatchObject({
      ident: "p1: Charizard",
      details: "Charizard-Mega-Y, L50, M",
      instanceId: "pokemon_charizard_mega_y",
    });
  });

  it("does not mutate the original request", () => {
    const requests = {
      p1: {
        side: {
          pokemon: [
            {
              ident: "p1: Koraidon",
              condition: "120/297",
            },
          ],
        },
      },
    };

    applyPokemonInstanceIdsToRequests(requests, {
      byIdent: {
        "p1: Koraidon": ["pokemon_123"],
      },
      byPlayerSlot: {
        p1: ["pokemon_123"],
      },
    });

    expect(requests.p1.side.pokemon[0]).not.toHaveProperty("instanceId");
  });

  it("updates request conditions from saved HP state", () => {
    const requests = {
      p1: {
        side: {
          pokemon: [
            {
              ident: "p1: Pikachu",
              condition: "20/20",
            },
          ],
        },
      },
    };

    const snapshot = applyPokemonSaveStateToRequests(requests, {
      "p1: Pikachu": [
        {
          instanceId: "pokemon_123",
          currentHp: 12,
          maxHp: 35,
        },
      ],
    }) as any;

    expect(snapshot.p1.side.pokemon[0]).toMatchObject({
      ident: "p1: Pikachu",
      condition: "12/20",
    });
  });

  it("uses 0 fnt condition for saved fainted Pokemon", () => {
    const requests = {
      p1: {
        side: {
          pokemon: [
            {
              ident: "p1: Pikachu",
              condition: "35/35",
            },
          ],
        },
      },
    };

    const snapshot = applyPokemonSaveStateToRequests(requests, {
      "p1: Pikachu": [
        {
          instanceId: "pokemon_123",
          currentHp: 0,
          maxHp: 35,
        },
      ],
    }) as any;

    expect(snapshot.p1.side.pokemon[0]).toMatchObject({
      ident: "p1: Pikachu",
      condition: "0 fnt",
    });
  });
});
