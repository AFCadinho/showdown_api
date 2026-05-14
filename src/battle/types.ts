export type PlayerId = "p1" | "p2";

export type BattleData = {
  stream: unknown;
  playerStreams: unknown;
  log: string[];
  requests: Record<string, unknown>;

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