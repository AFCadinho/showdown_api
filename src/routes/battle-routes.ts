import { Router } from "express";
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
import { applyPokemonInstanceIdsToRequests } from "@/battle/battle-pokemon-instance-ids";
import { validateChoiceAvailability } from "@/battle/battle-choice-availability";

export const battleRoutes = Router();

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

  return res.json(buildBattleResponse(result.battleId, battle))

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


function buildBattleResponse(battleId: string, battle: BattleData) {
  const requestSnapshot = applyPokemonInstanceIdsToRequests(
    buildBattleRequestSnapshot(battle.requests, battle.log),
    battle.instanceIdsByPokemonIdent
  );

  return {
    success: true,
    battleId,
    formatId: battle.formatid,
    players: battle.players,
    requests: presentBattleRequests(requestSnapshot, battle.formatid),
    events: consumeBattleEventsForResponse(battle),
    log: battle.log,
    state: battle.state
  }
}
