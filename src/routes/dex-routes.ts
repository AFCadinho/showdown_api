import { Router } from "express";
import {
  getPokemonStats,
  validatePokemonStatsQuery,
} from "@/dex/pokemon-stats";

export const dexRoutes = Router();

dexRoutes.get("/pokemon-stats", (req, res) => {
  const validation = validatePokemonStatsQuery(req.query);

  if (!validation.success) {
    return res.status(400).json(validation);
  }

  const pokemon = getPokemonStats(
    validation.data.species,
    validation.data.level
  );

  if (!pokemon) {
    return res.status(400).json({
      success: false,
      error: "Unknown species",
    });
  }

  return res.json({
    success: true,
    pokemon,
  });
});
