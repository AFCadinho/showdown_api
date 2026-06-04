import { calculateFieldEffectRemainingTurns } from "./battle-field-effect-metadata";

export type BattleFieldEffect = {
  scope: "field" | "side";
  effect: string;
  effectType?: "weather" | "fieldCondition" | "sideCondition";
  effectGroup?: "terrain";
  side?: "p1" | "p2";
  startedTurn?: number;
  minDuration?: number;
  maxDuration?: number;
  minRemainingTurns?: number;
  maxRemainingTurns?: number;
};

export type BattleFieldSnapshot = {
  effects: BattleFieldEffect[];
};

export function presentBattleField(
  field: BattleFieldSnapshot = { effects: [] },
  currentTurn?: number
): BattleFieldSnapshot {
  return {
    effects: field.effects.map((effect) => ({
      ...effect,
      ...(currentTurn === undefined
        ? {}
        : calculateFieldEffectRemainingTurns({
            currentTurn,
            startedTurn: effect.startedTurn,
            minDuration: effect.minDuration,
            maxDuration: effect.maxDuration,
          })),
    })),
  };
}
