import type { BattleData, PlayerId } from "./types";

export function listenToBattleStream(playerStreams: any, battleData: BattleData) {
  listenToPlayerStream("p1", playerStreams.p1, battleData);
  listenToPlayerStream("p2", playerStreams.p2, battleData);
}

const DEBUG_BATTLE_STREAM = false;

async function listenToPlayerStream(
  side: PlayerId,
  battleStream: any,
  battleData: BattleData
) {
  for await (const chunk of battleStream) {
    if (DEBUG_BATTLE_STREAM) {
      console.log(`${side} battleStream output:`);
      console.log(chunk);
    }

    battleData.log.push(`${side}\n${chunk}`);

    const lines = chunk.split("\n");

    for (const line of lines) {
      if (!line.startsWith("|request|")) continue;

      const requestText = line.replace("|request|", "");

      try {
        battleData.requests[side] = JSON.parse(requestText);
      } catch (error) {
        console.log(`Could not parse ${side} request:`, error);
      }
    }
  }
}