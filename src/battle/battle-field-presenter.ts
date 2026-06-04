export type BattleFieldEffect = {
  scope: "field" | "side";
  effect: string;
  effectType?: "weather" | "fieldCondition" | "sideCondition";
  effectGroup?: "terrain";
  side?: "p1" | "p2";
  minDuration?: number;
  maxDuration?: number;
};

export type BattleFieldSnapshot = {
  effects: BattleFieldEffect[];
};

export function presentBattleField(
  field: BattleFieldSnapshot = { effects: [] }
): BattleFieldSnapshot {
  return {
    effects: field.effects,
  };
}
