import type { BattleFieldEffect } from "./battle-field-presenter";

export type FieldEffectDurationMetadata = {
  minDuration?: number;
  maxDuration?: number;
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

  if (effect.effect === "move: Trick Room") {
    return { minDuration: 5, maxDuration: 5 };
  }

  if (effect.effect === "move: Tailwind") {
    return { minDuration: 4, maxDuration: 4 };
  }

  return {};
}
