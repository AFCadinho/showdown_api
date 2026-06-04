import { Router } from "express";
import { Teams } from "pokemon-showdown";
import { createBattle } from "@/battle/battle-service";
import { battleStore } from "@/battle/battle-store";
import { presentBattleRequests } from "@/battle/battle-request-presenter";
import {
  validateChoiceInput,
  validateLeadInput,
} from "@/battle/battle-route-validators";
import { buildChoiceCommand } from "@/battle/battle-choice-command";
import { consumeBattleEventsForResponse } from "@/battle/battle-event-presenter";
import type { BattleData } from "@/battle/types";
import { buildBattleRequestSnapshot } from "@/battle/battle-request-snapshot";
import {
  applyPokemonInstanceIdsToRequests,
  applyPokemonSaveStateToRequests,
} from "@/battle/battle-pokemon-instance-ids";
import { validateChoiceAvailability } from "@/battle/battle-choice-availability";
import { buildApplySavedHpEvalCommand } from "@/battle/battle-saved-hp";
import { presentBattleField } from "@/battle/battle-field-presenter";

export const battleRoutes = Router();

battleRoutes.post("/parse_pokemon", (req, res) => {
  const text = req.body?.text;

  if (typeof text !== "string" || text.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "text is required",
    });
  }

  try {
    const team = Teams.import(text);
    const pokemon = team?.[0];

    if (!pokemon) {
      return res.status(400).json({
        success: false,
        error: "Could not parse Pokemon text",
      });
    }

    return res.json({
      success: true,
      pokemon,
    });
  } catch {
    return res.status(400).json({
      success: false,
      error: "Could not parse Pokemon text",
    });
  }
});

battleRoutes.post("/create_battle", async (req, res) => {
  const result = await createBattle(req.body);

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.json(result);
});


battleRoutes.post("/create_wild_battle", async (req, res) => {
  const result = await createBattle(req.body);

  if (!result.success) {
    return res.status(400).json(result);
  }

  const battle = battleStore.getBattle(result.battleId);

  if (!battle) return res.status(500).json({
    success: false,
    error: "Battle was created but not found"
  })

  await battle.playerStreams.p1.write("team 1")
  await battle.playerStreams.p2.write("team 1")

  await new Promise((resolve) => setTimeout(resolve, 10));

  await battle.stream.write(
    buildApplySavedHpEvalCommand("p1", battle.pokemonSaveStateByIdent)
  );

  await new Promise((resolve) => setTimeout(resolve, 10));

  return res.json(
    buildBattleResponse(result.battleId, battle, {
      useSavedHpState: true,
    })
  )

})


// Battle Leads
battleRoutes.post("/battles/:battleId/lead", async (req, res) => {
  const { battleId } = req.params;

  const battle = battleStore.getBattle(battleId);

  if (!battle) {
    return res.status(404).json({
      success: false,
      error: "Battle not found",
    });
  }

  const validation = validateLeadInput(req.body);
  if (!validation.success) return res.status(400).json(validation);

  const { playerId, slot } = validation.data;

  await battle.playerStreams[playerId].write(`team ${slot}`);
  await new Promise((resolve) => setTimeout(resolve, 10));

  return res.json(buildBattleResponse(battleId, battle));
});

// Battle Choices
battleRoutes.post("/battles/:battleId/choice", async (req, res) => {
  const { battleId } = req.params;

  const battle = battleStore.getBattle(battleId);

  if (!battle) {
    return res.status(404).json({
      success: false,
      error: "Battle not found",
    });
  }

  const validation = validateChoiceInput(req.body);
  if (!validation.success) return res.status(400).json(validation);

  const { playerId } = validation.data;
  const availability = validateChoiceAvailability(
    validation.data,
    battle.requests[playerId]
  );

  if (!availability.success) {
    return res.status(400).json({
      ...buildBattleResponse(battleId, battle),
      ...availability,
    });
  }

  const choiceCommand = buildChoiceCommand(validation.data);

  await battle.playerStreams[playerId].write(choiceCommand);
  await new Promise((resolve) => setTimeout(resolve, 10));

  return res.json(buildBattleResponse(battleId, battle));
});


type BuildBattleResponseOptions = {
  useSavedHpState?: boolean;
};

function buildBattleResponse(
  battleId: string,
  battle: BattleData,
  options: BuildBattleResponseOptions = {}
) {
  const baseSnapshot = buildBattleRequestSnapshot(battle.requests, battle.log);
  const hpSnapshot = options.useSavedHpState
    ? applyPokemonSaveStateToRequests(
        baseSnapshot,
        battle.pokemonSaveStateByIdent
      )
    : baseSnapshot;
  const requestSnapshot = applyPokemonInstanceIdsToRequests(
    hpSnapshot,
    battle.instanceIdsByPokemonIdent
  );

  return {
    success: true,
    battleId,
    formatId: battle.formatid,
    players: battle.players,
    requests: presentBattleRequests(requestSnapshot, battle.formatid),
    events: consumeBattleEventsForResponse(battle),
    field: presentBattleField(battle.field, battle.state.turn),
    log: battle.log,
    state: battle.state
  }
}
