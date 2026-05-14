export type PlayerId = "p1" | "p2";

export type BattleData = {
  stream: unknown;
  playerStreams: PlayerStreams;
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

export type PlayerStream = {
  write: (message: string) => Promise<void>;
};

export type PlayerStreams = {
  p1: PlayerStream;
  p2: PlayerStream;
};