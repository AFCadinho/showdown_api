import { Dex } from "pokemon-showdown";

export type PokemonStatsQuery = {
  species: string;
  level: number;
};

export type PokemonSpeedRange = {
  min: number;
  minNeutral31Iv: number;
  maxNeutral31Iv: number;
  max: number;
};

export function validatePokemonStatsQuery(query: unknown):
  | { success: true; data: PokemonStatsQuery }
  | { success: false; error: string } {
  if (typeof query !== "object" || query === null) {
    return {
      success: false,
      error: "Invalid query parameters",
    };
  }

  const { species, level } = query as {
    species?: unknown;
    level?: unknown;
  };

  if (typeof species !== "string" || species.trim() === "") {
    return {
      success: false,
      error: "species is required",
    };
  }

  const parsedLevel = level === undefined ? 100 : Number(level);

  if (
    !Number.isInteger(parsedLevel) ||
    parsedLevel < 1 ||
    parsedLevel > 100
  ) {
    return {
      success: false,
      error: "level must be an integer from 1 to 100",
    };
  }

  return {
    success: true,
    data: {
      species: species.trim(),
      level: parsedLevel,
    },
  };
}

export function getPokemonStats(speciesName: string, level: number) {
  const species = Dex.species.get(speciesName);

  if (!species.exists) {
    return null;
  }

  return {
    species: species.name,
    level,
    baseStats: species.baseStats,
    speed: calculateSpeedRange(species.baseStats.spe, level),
  };
}

export function calculateSpeedRange(baseSpeed: number, level: number): PokemonSpeedRange {
  return {
    min: calculateStat(baseSpeed, level, 0, 0, 0.9),
    minNeutral31Iv: calculateStat(baseSpeed, level, 31, 0, 1),
    maxNeutral31Iv: calculateStat(baseSpeed, level, 31, 252, 1),
    max: calculateStat(baseSpeed, level, 31, 252, 1.1),
  };
}

function calculateStat(
  baseStat: number,
  level: number,
  iv: number,
  ev: number,
  natureMultiplier: 0.9 | 1 | 1.1
) {
  return Math.floor(
    Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100 + 5) *
      natureMultiplier
  );
}
