import { Dex } from "pokemon-showdown";
import type { BattleFieldEffect } from "./battle-field-presenter";

export type FieldEffectDurationMetadata = {
  minDuration?: number;
  maxDuration?: number;
};

export type FieldEffectRemainingTurnsInput = {
  currentTurn: number;
  startedTurn?: number;
  minDuration?: number;
  maxDuration?: number;
  upkeepTicks?: number;
};

export type FieldEffectRemainingTurnsMetadata = {
  minRemainingTurns?: number;
  maxRemainingTurns?: number;
};

/**
 * Geeft UI-metadata voor effecten die een bekende beurtduur hebben.
 *
 * Showdown blijft leidend voor wanneer een effect echt eindigt. Deze metadata
 * is alleen bedoeld om de game een bereik te kunnen tonen, bijvoorbeeld
 * "Rain duurt meestal 5 tot 8 beurten". Effecten zonder vaste duur, zoals
 * Stealth Rock, krijgen geen duration metadata.
 */
export function getFieldEffectDurationMetadata(
  effect: Pick<BattleFieldEffect, "effectType" | "effect">
): FieldEffectDurationMetadata {
  if (effect.effectType === "weather") {
    return { minDuration: 5, maxDuration: 8 };
  }

  const moveDuration = getMoveEffectDurationMetadata(effect.effect);
  if (moveDuration) return moveDuration;

  return {};
}

function getMoveEffectDurationMetadata(effect: string): FieldEffectDurationMetadata | null {
  const moveName = effect.startsWith("move: ") ? effect.slice("move: ".length) : effect;
  const move = Dex.moves.get(moveName);
  const duration = move.condition?.duration;

  if (!move.exists || typeof duration !== "number") {
    return null;
  }

  return {
    minDuration: duration,
    maxDuration: getPublicMaxDuration(move.id, duration),
  };
}

function getPublicMaxDuration(moveId: string, duration: number): number {
  if (
    moveId === "reflect" ||
    moveId === "lightscreen" ||
    moveId === "auroraveil"
  ) {
    return 8;
  }

  if (moveId === "safeguard") {
    return 7;
  }

  if (moveId === "tailwind") {
    return 6;
  }

  if (
    moveId === "electricterrain" ||
    moveId === "grassyterrain" ||
    moveId === "mistyterrain" ||
    moveId === "psychicterrain"
  ) {
    return 8;
  }

  return duration;
}

/**
 * Berekent hoeveel beurten een effect ongeveer nog kan duren.
 *
 * Dit gebruikt alleen de basisduur metadata en de beurt waarop wij het effect
 * zagen starten. Showdown blijft nog steeds leidend voor het echte einde.
 */
export function calculateFieldEffectRemainingTurns({
  currentTurn,
  startedTurn,
  minDuration,
  maxDuration,
  upkeepTicks = 0,
}: FieldEffectRemainingTurnsInput): FieldEffectRemainingTurnsMetadata {
  if (
    startedTurn === undefined ||
    minDuration === undefined ||
    maxDuration === undefined
  ) {
    return {};
  }

  const elapsedTurns = Math.max(0, currentTurn - startedTurn, upkeepTicks);

  return {
    minRemainingTurns: Math.max(0, minDuration - elapsedTurns),
    maxRemainingTurns: Math.max(0, maxDuration - elapsedTurns),
  };
}
