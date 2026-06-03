import type { PlayerId } from "./types";

type PokemonInput = {
  name?: string;
  species?: string;
  instanceId?: string;
};

type BattleRequestWithSide = {
  side?: {
    pokemon?: Array<{
      ident?: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type PokemonInstanceIdMap = Record<string, string[]>;

/**
 * Bouwt de vaste koppeling tussen een battle-Pokemon en de save-Pokemon.
 *
 * De client stuurt `instanceId` mee op de team-Pokemon uit de save. Showdown
 * gebruikt die waarde zelf niet, dus de API bewaart hem apart. De sleutel is de
 * ident die Showdown later in requests gebruikt, bijvoorbeeld `p1: Koraidon`.
 *
 * Als een Pokemon een nickname heeft, gebruikt Showdown die nickname als ident.
 * Daarom gebruiken we hier dezelfde regel: eerst `name`, daarna `species`.
 */
export function buildPokemonInstanceIdMap(
  p1Team: PokemonInput[],
  p2Team: PokemonInput[]
): PokemonInstanceIdMap {
  return {
    ...buildPlayerPokemonInstanceIdMap("p1", p1Team),
    ...buildPlayerPokemonInstanceIdMap("p2", p2Team),
  };
}

/**
 * Zet opgeslagen `instanceId`s terug op de request snapshot.
 *
 * Deze helper verandert de originele request niet. Hij maakt alleen een
 * response-versie waarin elke `side.pokemon[]` met een bekende Showdown ident
 * dezelfde `instanceId` terugkrijgt als bij battle creation is opgeslagen.
 */
export function applyPokemonInstanceIdsToRequests(
  requests: Record<string, unknown>,
  instanceIdsByIdent: PokemonInstanceIdMap
) {
  const requestsWithInstanceIds: Record<string, unknown> = {};

  for (const [playerId, request] of Object.entries(requests)) {
    if (!isBattleRequestWithSide(request) || !request.side?.pokemon) {
      requestsWithInstanceIds[playerId] = request;
      continue;
    }

    const seenByIdent: Record<string, number> = {};

    requestsWithInstanceIds[playerId] = {
      ...request,
      side: {
        ...request.side,
        pokemon: request.side.pokemon.map((pokemon) => {
          if (!pokemon.ident) return pokemon;

          const occurrence = seenByIdent[pokemon.ident] ?? 0;
          seenByIdent[pokemon.ident] = occurrence + 1;

          const instanceId = instanceIdsByIdent[pokemon.ident]?.[occurrence];

          if (!instanceId) return pokemon;

          return {
            ...pokemon,
            instanceId,
          };
        }),
      },
    };
  }

  return requestsWithInstanceIds;
}

function buildPlayerPokemonInstanceIdMap(
  playerId: PlayerId,
  team: PokemonInput[]
): PokemonInstanceIdMap {
  const instanceIdsByIdent: PokemonInstanceIdMap = {};

  for (const pokemon of team) {
    if (!pokemon.instanceId) continue;

    const identName = pokemon.name || pokemon.species;
    if (!identName) continue;

    const ident = `${playerId}: ${identName}`;
    instanceIdsByIdent[ident] ??= [];
    instanceIdsByIdent[ident].push(pokemon.instanceId);
  }

  return instanceIdsByIdent;
}

function isBattleRequestWithSide(
  request: unknown
): request is BattleRequestWithSide {
  return typeof request === "object" && request !== null;
}
