import { Router } from "express";
import { createBattle } from "@/battle/battle-service";
import { battleStore } from "@/battle/battle-store";
import { PlayerId } from "@/battle/types";
import { presentBattleRequests } from "@/battle/battle-request-presenter";
import { validateChoiceInput } from "@/battle/choice-validator";

export const battleRoutes = Router();

battleRoutes.post("/create_battle", async (req, res) => {
  const result = await createBattle(req.body);

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

battleRoutes.post("/battles/:battleId/lead", async (req, res) => {
  const { battleId } = req.params;
  const { playerId, slot } = req.body;

  const battle = battleStore.getBattle(battleId);

  if (!battle) {
    return res.status(404).json({
      success: false,
      error: "Battle not found",
    });
  }

  if (playerId !== "p1" && playerId !== "p2") {
    return res.status(400).json({
      success: false,
      error: "Invalid player"
    })
  }

  const player = playerId as PlayerId

  if (!Number.isInteger(slot) || slot < 1 || slot > 6) {
    return res.status(400).json({
      success: false,
      error: "Invalid lead slot"
    });
  }

  await battle.playerStreams[player].write(`team ${slot}`);
  await new Promise((resolve) => setTimeout(resolve, 10));

  return res.json({
    success: true,
    battleId,
    formatId: battle.formatid,
    players: battle.players,
    requests: presentBattleRequests(battle.requests, battle.formatid),
    log: battle.log,
    state: battle.state,
  })

})

battleRoutes.post("/battles/:battleId/choice", async (req, res) => {
  const { battleId } = req.params;

  const battle = battleStore.getBattle(battleId)

  if (!battle) {
    return res.status(404).json({
      success: false,
      error: "Battle not found",
    });
  }

  const validation = validateChoiceInput(req.body);

  if (!validation.success) return res.status(400).json(validation)

  return res.json({
    success: true,
    battleId,
    formatId: battle.formatid,
    players: battle.players,
    requests: presentBattleRequests(battle.requests, battle.formatid),
    log: battle.log,
    state: battle.state
  })
})
