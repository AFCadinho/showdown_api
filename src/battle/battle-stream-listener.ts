import type {
  BattleData,
  PlayerId,
  PlayerStream,
  PlayerStreams,
} from "./types";
import { getFieldEffectDurationMetadata } from "./battle-field-effect-metadata";
import {
  updateKnownPokemonInfoFromLine,
  updateKnownPokemonInfoFromRequest,
} from "./battle-pokemon-knowledge";
import { updatePokemonStatStagesFromLine } from "./battle-pokemon-stat-stages";

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
      if (side === "p1") {
        updateKnownPokemonInfoFromLine(
          battleData.pokemonKnownInfoByViewer,
          line,
          battleData.formatid
        );
        updatePokemonStatStagesFromLine(battleData.statStagesByPokemon, line);
      }
      handleBattleStreamLine(line, side, battleData);
    }
  }
}

function handleBattleStreamLine(
  line: string,
  side: PlayerId,
  battleData: BattleData
) {
  updateFieldFromBattleLine(line, battleData);

  // Request-regels bevatten de actuele keuzes voor een specifieke speler.
  if (line.startsWith("|request|")) {
    const requestText = line.replace("|request|", "");

    try {
      const request = JSON.parse(requestText);
      battleData.requests[side] = request;
      updateKnownPokemonInfoFromRequest(
        battleData.pokemonKnownInfoByViewer,
        side,
        request,
        battleData.formatid
      );
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

  if (line.startsWith("|switch|")) {
    const [, , ident] = line.split("|");
    if (ident) {
      battleData.activeByPlayer[getPlayerIdFromIdent(ident)] = ident;
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

export function updateFieldFromBattleLine(
  line: string,
  battleData: Pick<BattleData, "field"> & Partial<Pick<BattleData, "state">>
) {
  const parts = line.split("|");
  const eventType = parts[1];

  if (eventType === "-fieldstart") {
    const effect = parts[2];
    if (!effect) return;
    const effectGroup = getFieldConditionGroup(effect);

    removeFieldEffect(battleData, "fieldCondition", effect);
    if (effectGroup) removeFieldEffectGroup(battleData, effectGroup);

    const fieldEffect = {
      scope: "field",
      effectType: "fieldCondition",
      effectGroup,
      effect,
      startedTurn: battleData.state?.turn,
    } as const;

    battleData.field.effects.push({
      ...fieldEffect,
      ...getFieldEffectDurationMetadata(fieldEffect),
    });
    return;
  }

  if (eventType === "-fieldend") {
    const effect = parts[2];
    if (!effect) return;

    removeFieldEffect(battleData, "fieldCondition", effect);
    return;
  }

  if (eventType === "-sidestart") {
    const side = getPlayerIdFromSideText(parts[2]);
    const effect = normalizeSideConditionEffect(parts[3]);
    if (!side || !effect) return;

    removeSideEffect(battleData, side, effect);
    const sideEffect = {
      scope: "side",
      side,
      effectType: "sideCondition",
      effect,
      startedTurn: battleData.state?.turn,
    } as const;

    battleData.field.effects.push({
      ...sideEffect,
      ...getFieldEffectDurationMetadata(sideEffect),
    });
    return;
  }

  if (eventType === "-sideend") {
    const side = getPlayerIdFromSideText(parts[2]);
    const effect = normalizeSideConditionEffect(parts[3]);
    if (!side || !effect) return;

    removeSideEffect(battleData, side, effect);
    return;
  }

  if (eventType !== "-weather") return;

  const weather = parts[2];
  const isUpkeep = parts.includes("[upkeep]");

  if (!weather) return;

  if (weather === "none") {
    battleData.field.effects = battleData.field.effects.filter(
      (effect) => effect.effectType !== "weather"
    );
    return;
  }

  const activeWeather = battleData.field.effects.find(
    (effect) => effect.effectType === "weather"
  );

  if (isUpkeep && activeWeather?.effect === weather) {
    activeWeather.upkeepTicks = (activeWeather.upkeepTicks ?? 0) + 1;
    return;
  }

  battleData.field.effects = battleData.field.effects.filter(
    (effect) => effect.effectType !== "weather"
  );

  const weatherEffect = {
    scope: "field",
    effectType: "weather",
    effect: weather,
    startedTurn: battleData.state?.turn,
  } as const;

  battleData.field.effects.push({
    ...weatherEffect,
    ...getFieldEffectDurationMetadata(weatherEffect),
  });
}

function removeFieldEffect(
  battleData: Pick<BattleData, "field">,
  effectType: "fieldCondition",
  effectName: string
) {
  battleData.field.effects = battleData.field.effects.filter(
    (effect) =>
      effect.effectType !== effectType || effect.effect !== effectName
  );
}

function removeSideEffect(
  battleData: Pick<BattleData, "field">,
  side: PlayerId,
  effectName: string
) {
  battleData.field.effects = battleData.field.effects.filter(
    (effect) =>
      effect.effectType !== "sideCondition" ||
      effect.side !== side ||
      effect.effect !== effectName
  );
}

function normalizeSideConditionEffect(effect: string | undefined) {
  if (!effect) return undefined;
  if (effect.includes(":")) return effect;

  return `move: ${effect}`;
}

function removeFieldEffectGroup(
  battleData: Pick<BattleData, "field">,
  effectGroup: "terrain"
) {
  battleData.field.effects = battleData.field.effects.filter(
    (effect) => effect.effectGroup !== effectGroup
  );
}

function getFieldConditionGroup(effect: string): "terrain" | undefined {
  if (
    effect === "move: Electric Terrain" ||
    effect === "move: Grassy Terrain" ||
    effect === "move: Misty Terrain" ||
    effect === "move: Psychic Terrain"
  ) {
    return "terrain";
  }

  return undefined;
}

function getPlayerIdFromSideText(sideText: string | undefined): PlayerId | null {
  if (!sideText) return null;
  if (sideText.startsWith("p2")) return "p2";
  if (sideText.startsWith("p1")) return "p1";

  return null;
}

type BattleRequest = {
  side?: {
    id?: string;
    pokemon?: Array<{
      ident?: string;
      condition?: string;
      active?: boolean;
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

    if (pokemon.active === true) {
      const playerId = request.side.id ?? getPlayerIdFromIdent(pokemon.ident);
      battleData.activeByPlayer[playerId] = activeIdent;
    }
  }
}

function toActiveIdent(ident: string) {
  return ident.replace(/^(p[12]): /, "$1a: ");
}

function getPlayerIdFromIdent(ident: string) {
  return ident.startsWith("p2") ? "p2" : "p1";
}

function isBattleRequest(request: unknown): request is BattleRequest {
  return typeof request === "object" && request !== null;
}
