import type {
  BattleData,
  PlayerId,
  PlayerStream,
  PlayerStreams,
} from "./types";

/**
 * Start listeners voor beide spelerstreams van een Showdown battle.
 *
 * Deze functie wordt maar een keer aangeroepen wanneer de battle wordt
 * aangemaakt. De onderliggende player stream listeners blijven daarna actief
 * zolang de Showdown streams open zijn.
 *
 * Elke spelerstream krijgt eigen request-data terug. Door beide streams te
 * volgen kan de API per speler de laatste request en de gedeelde battle state
 * bijhouden.
 */
export function listenToBattleStream(
  playerStreams: PlayerStreams,
  battleData: BattleData
) {
  listenToPlayerStream("p1", playerStreams.p1, battleData);
  listenToPlayerStream("p2", playerStreams.p2, battleData);
}

const DEBUG_BATTLE_STREAM = false;

async function listenToPlayerStream(
  side: PlayerId,
  battleStream: PlayerStream,
  battleData: BattleData
) {
  // Deze async loop blijft wachten op nieuwe chunks uit dezelfde player stream.
  // Latere route calls zoals /lead en /choice schrijven naar deze stream, waarna
  // Showdown hier weer nieuwe output teruggeeft.
  for await (const chunk of battleStream) {
    if (DEBUG_BATTLE_STREAM) {
      console.log(`${side} battleStream output:`);
      console.log(chunk);
    }

    battleData.log.push(`${side}\n${chunk}`);

    const lines = chunk.split("\n");

    for (const line of lines) {
      handleBattleStreamLine(line, side, battleData);
    }
  }
}

function handleBattleStreamLine(
  line: string,
  side: PlayerId,
  battleData: BattleData
) {
  // Request-regels bevatten de actuele keuzes voor een specifieke speler.
  if (line.startsWith("|request|")) {
    const requestText = line.replace("|request|", "");

    try {
      const request = JSON.parse(requestText);
      battleData.requests[side] = request;
      updateKnownConditionsFromRequest(request, battleData);
    } catch (error) {
      console.log(`Could not parse ${side} request:`, error);
    }

    return;
  }

  // Turn-regels geven aan dat Showdown een nieuwe turn is gestart.
  if (line.startsWith("|turn|")) {
    const turnText = line.replace("|turn|", "");
    const turn = Number(turnText);

    if (Number.isInteger(turn)) {
      battleData.state.turn = turn;
    }

    return;
  }

  // Win-regels betekenen dat de battle is afgelopen en wie gewonnen heeft.
  if (line.startsWith("|win|")) {
    const winner = line.replace("|win|", "");

    battleData.state.ended = true;
    battleData.state.winner = winner;

    return;
  }
}

type BattleRequest = {
  side?: {
    pokemon?: Array<{
      ident?: string;
      condition?: string;
    }>;
  };
};

function updateKnownConditionsFromRequest(
  request: unknown,
  battleData: BattleData
) {
  if (!isBattleRequest(request) || !request.side?.pokemon) return;

  for (const pokemon of request.side.pokemon) {
    if (!pokemon.ident || !pokemon.condition) continue;

    const activeIdent = toActiveIdent(pokemon.ident);

    // Requests zijn alleen de startbron voor condition state. Latere damage/heal
    // events werken deze state bij nadat het enriched event is gebouwd, zodat
    // previousCondition niet per ongeluk door een final request wordt overschreven.
    battleData.conditionByPokemon[activeIdent] ??= pokemon.condition;
  }
}

function toActiveIdent(ident: string) {
  return ident.replace(/^(p[12]): /, "$1a: ");
}

function isBattleRequest(request: unknown): request is BattleRequest {
  return typeof request === "object" && request !== null;
}
