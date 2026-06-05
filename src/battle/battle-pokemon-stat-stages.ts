import type { PokemonStatStagesByIdent } from "./types";

const ordinaryStats = new Set(["atk", "def", "spa", "spd", "spe", "accuracy", "evasion"]);

export function updatePokemonStatStagesFromLine(
  statStagesByPokemon: PokemonStatStagesByIdent,
  line: string
): void {
  const parts = line.split("|");
  const eventType = parts[1];

  if (eventType === "-boost") {
    applyStatStageChange(statStagesByPokemon, parts, 1);
    return;
  }

  if (eventType === "-unboost") {
    applyStatStageChange(statStagesByPokemon, parts, -1);
    return;
  }

  if (eventType === "switch" || eventType === "faint") {
    const ident = parts[2];
    if (isPokemonIdent(ident)) {
      statStagesByPokemon[normalizePokemonIdent(ident)] = {};
    }
    return;
  }

  if (eventType === "win") {
    for (const ident of Object.keys(statStagesByPokemon)) {
      statStagesByPokemon[ident] = {};
    }
  }
}

export function getVisibleStatStages(
  statStagesByPokemon: PokemonStatStagesByIdent,
  ident: string
): Record<string, number> | undefined {
  const stages = statStagesByPokemon[normalizePokemonIdent(ident)];
  if (!stages) return undefined;

  const visibleStages = Object.fromEntries(
    Object.entries(stages).filter(([, amount]) => amount !== 0)
  );

  return Object.keys(visibleStages).length > 0 ? visibleStages : undefined;
}

function applyStatStageChange(
  statStagesByPokemon: PokemonStatStagesByIdent,
  parts: string[],
  direction: 1 | -1
): void {
  const ident = parts[2];
  const stat = parts[3];
  const amount = Number(parts[4]);

  if (!isPokemonIdent(ident) || !ordinaryStats.has(stat) || !Number.isFinite(amount)) {
    return;
  }

  const key = normalizePokemonIdent(ident);
  const stages = statStagesByPokemon[key] ?? {};
  const nextValue = clampStatStage((stages[stat] ?? 0) + amount * direction);

  if (nextValue === 0) {
    delete stages[stat];
  } else {
    stages[stat] = nextValue;
  }

  statStagesByPokemon[key] = stages;
}

function clampStatStage(value: number): number {
  return Math.max(-6, Math.min(6, value));
}

function isPokemonIdent(ident?: string): ident is string {
  return /^p[12]a?:\s/.test(ident ?? "");
}

function normalizePokemonIdent(ident: string) {
  return ident.replace(/^(p[12])a:/, "$1:").replace(/\s+/g, " ").trim();
}
