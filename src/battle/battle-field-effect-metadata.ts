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

  if (isTerrainEffect(effect.effect)) {
    return { minDuration: 5, maxDuration: 8 };
  }

  if (effect.effect === "move: Trick Room") {
    return { minDuration: 5, maxDuration: 5 };
  }

  if (effect.effect === "move: Tailwind") {
    return { minDuration: 4, maxDuration: 4 };
  }

  return {};
}

function isTerrainEffect(effect: string) {
  return (
    effect === "move: Electric Terrain" ||
    effect === "move: Grassy Terrain" ||
    effect === "move: Misty Terrain" ||
    effect === "move: Psychic Terrain"
  );
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
