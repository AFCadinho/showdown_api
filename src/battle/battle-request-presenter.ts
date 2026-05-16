import { presentMove } from "../dex/dex-presenter";

type BattleRequest = {
  active?: Array<{
    moves?: Array<{
      move?: string;
      id?: string;
      pp?: number;
      maxpp?: number;
      target?: string;
      disabled?: boolean;
    }>;
  }>;
  side?: {
    pokemon?: Array<{
      moves?: unknown[];
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Maakt een UI-vriendelijke versie van een enkele Showdown battle request.
 *
 * Showdown requests bevatten de huidige geldige keuzes voor een speler. Deze
 * presenter laat die live battle-data intact en verrijkt elke zichtbare move
 * met vaste Dex-data zoals type, categorie, base power en accuracy.
 */
export function presentBattleRequest(request: unknown, formatid: string) {
  if (!isBattleRequest(request)) return request;

  const presentedRequest = { ...request };

  if (presentedRequest.active) {
    presentedRequest.active = [];

    for (const pokemon of request.active ?? []) {
      const presentedPokemon = { ...pokemon };

      if (pokemon.moves) {
        presentedPokemon.moves = [];

        for (const move of pokemon.moves) {
          const moveName = move.id ?? move.move ?? "";
          const moveDetails = presentMove(moveName, formatid);

          // Dex-data vult de algemene move-details aan; de live request wint
          // bij overlap omdat daar battle-specifieke state in zit, zoals PP.
          const presentedMove = {
            ...moveDetails,
            ...move,
          };

          presentedPokemon.moves.push(presentedMove);
        }
      }

      presentedRequest.active.push(presentedPokemon);
    }
  }

  if (presentedRequest.side?.pokemon) {
    const presentedPokemonList: Array<{
      moves?: unknown[];
      [key: string]: unknown;
    }> = [];

    presentedRequest.side = {
      ...presentedRequest.side,
      pokemon: presentedPokemonList,
    };

    for (const pokemon of request.side?.pokemon ?? []) {
      const presentedPokemon = { ...pokemon };

      if (pokemon.moves) {
        // Tijdens team preview geeft Showdown moves als IDs/strings terug.
        // Voor de UI maken we daar dezelfde Dex-presentatie van als bij active moves.
        presentedPokemon.moves = pokemon.moves.map((move) =>
          typeof move === "string" ? presentMove(move, formatid) : move
        );
      }

      presentedPokemonList.push(presentedPokemon);
    }
  }

  return presentedRequest;
}

/**
 * Maakt UI-vriendelijke requests voor alle spelers in de battle.
 *
 * De input is een map zoals `{ p1: request, p2: request }`. De output behoudt
 * dezelfde player IDs, maar vervangt elke raw request door de presented versie.
 */
export function presentBattleRequests(
  requests: Record<string, unknown>,
  formatid: string
) {
  // Object.entries maakt van `{ p1: req }` een lijst: `[["p1", req]]`.
  // Object.fromEntries maakt van die aangepaste lijst weer een object.
  return Object.fromEntries(
    Object.entries(requests).map(([playerId, request]) => [
      playerId,
      presentBattleRequest(request, formatid),
    ])
  );
}

function isBattleRequest(request: unknown): request is BattleRequest {
  return typeof request === "object" && request !== null;
}
