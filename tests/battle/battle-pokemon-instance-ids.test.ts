import { describe, expect, it } from "vitest";
import {
  applyPokemonInstanceIdsToRequests,
  buildPokemonInstanceIdMap,
} from "../../src/battle/battle-pokemon-instance-ids";

describe("battle pokemon instance ids", () => {
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
      "p1: Koraidon": ["pokemon_123"],
      "p2: Pidgey": ["pokemon_456"],
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
      "p1: Red Wing": ["pokemon_charizard"],
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
      "p1: Koraidon": ["pokemon_123"],
    }) as any;

    expect(snapshot.p1.side.pokemon[0]).toMatchObject({
      ident: "p1: Koraidon",
      instanceId: "pokemon_123",
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
      "p1: Koraidon": ["pokemon_123"],
    });

    expect(requests.p1.side.pokemon[0]).not.toHaveProperty("instanceId");
  });
});
