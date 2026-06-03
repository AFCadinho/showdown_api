import { battleStore } from "./battle-store";
import { listenToBattleStream } from "./battle-stream-listener";
import { BattleStream, getPlayerStreams, Teams } from "pokemon-showdown";
import type { BattleData } from "@/battle/types";
import { presentBattleRequests } from "@/battle/battle-request-presenter";
import { consumeBattleEventsForResponse } from "./battle-event-presenter";
import { buildBattleRequestSnapshot } from "./battle-request-snapshot";
import {
  applyPokemonInstanceIdsToRequests,
  buildPokemonInstanceIdMap,
  buildPokemonSaveStateMap,
} from "./battle-pokemon-instance-ids";

type ShowdownPokemonTeam = NonNullable<Parameters<typeof Teams.pack>[0]>;
type PokemonTeam = Array<
  ShowdownPokemonTeam[number] & {
    instanceId?: string;
    currentHp?: number;
    maxHp?: number;
  }
>;

type CreateBattleBody = {
  p1?: {
    name?: string;
    team?: PokemonTeam;
  };
  p2?: {
    name?: string;
    team?: PokemonTeam;
  };
  formatId?: string;
};

type CreateBattleSuccess = {
  success: true;
  battleId: string;
  formatId: string;
  players: BattleData["players"];
  requests: Record<string, unknown>;
  events: ReturnType<typeof consumeBattleEventsForResponse>;
  log: string[];
};

type CreateBattleFailure = {
  success: false;
  error: string;
};

type CreateBattleResult = CreateBattleSuccess | CreateBattleFailure;

export async function createBattle(body: CreateBattleBody): Promise<CreateBattleResult> {
  // Ontvang JSON
  const { p1, p2, formatId } = body;

  // Validate teams
  if (!p1?.team || !p2?.team) {
    return {
      success: false,
      error: "Missing teams",
    };
  }

  const formatid = typeof formatId === "string" ? formatId : "gen9nationaldex";
  const p1PackedTeam = Teams.pack(p1.team);
  const p2PackedTeam = Teams.pack(p2.team);
  const instanceIdsByPokemonIdent = buildPokemonInstanceIdMap(p1.team, p2.team);
  const pokemonSaveStateByIdent = buildPokemonSaveStateMap(p1.team, p2.team);

  // Maak BattleStream
  const battleStream = new BattleStream();
  const playerStreams = getPlayerStreams(battleStream);
  const battleId = crypto.randomUUID();

  // Sla alles op:
  const battleData: BattleData = {
    stream: battleStream,
    playerStreams,
    formatid,
    log: [] as string[],
    eventCursor: 0,
    requests: {} as Record<string, unknown>,
    conditionByPokemon: {},
    activeByPlayer: {},
    instanceIdsByPokemonIdent,
    pokemonSaveStateByIdent,
    state: {
      turn: 1,
      ended: false,
      winner: null,
    },
    players: {
      p1: { name: p1.name ?? "Player 1" },
      p2: { name: p2.name ?? "Player 2" },
    },
  };

  listenToBattleStream(playerStreams, battleData);

  // Stuur naar stream:
  await battleStream.write(`>start ${JSON.stringify({ formatid })}`);

  // Register Player 1
  await battleStream.write(
    `>player p1 ${JSON.stringify({
      name: p1.name ?? "Player 1",
      team: p1PackedTeam,
    })}`
  );

  // Register Player 2
  await battleStream.write(
    `>player p2 ${JSON.stringify({
      name: p2.name ?? "Player 2",
      team: p2PackedTeam,
    })}`
  );

  // Geef de event loop kort ruimte voordat we doorgaan
  await new Promise((resolve) => setTimeout(resolve, 10));
  battleStore.saveBattle(battleId, battleData);

  const requestSnapshot = applyPokemonInstanceIdsToRequests(
    buildBattleRequestSnapshot(battleData.requests, battleData.log),
    battleData.instanceIdsByPokemonIdent
  );

  return {
    success: true,
    battleId,
    formatId: battleData.formatid,
    players: battleData.players,
    requests: presentBattleRequests(requestSnapshot, battleData.formatid),
    events: consumeBattleEventsForResponse(battleData),
    log: battleData.log,
  };
}
