import type { BattleStream, getPlayerStreams } from "pokemon-showdown";
import type { BattleFieldSnapshot } from "./battle-field-presenter";
import type { PokemonInstanceIdMap } from "./battle-pokemon-instance-ids";

export type PlayerId = "p1" | "p2";

export type BattleData = {
  stream: BattleStream;
  playerStreams: PlayerStreams;
  formatid: string;
  log: string[];
  eventCursor: number;
  requests: Record<string, unknown>;
  conditionByPokemon: Record<string, string>;
  activeByPlayer: Record<string, string>;
  field: BattleFieldSnapshot;
  instanceIdsByPokemonIdent: PokemonInstanceIdMap;
  pokemonSaveStateByIdent: Record<
    string,
    Array<{
      instanceId: string;
      currentHp: number;
      maxHp: number;
    }>
  >;

  state: {
    turn: number;
    ended: boolean;
    winner: string | null;
  };

  players: {
    p1: {
      name: string;
    };
    p2: {
      name: string;
    };
  };
};

type ShowdownPlayerStreams = ReturnType<typeof getPlayerStreams>;

export type PlayerStream = ShowdownPlayerStreams[PlayerId];

export type PlayerStreams = {
  p1: PlayerStream;
  p2: PlayerStream;
};
