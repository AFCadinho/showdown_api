import type { BattleData } from "@/battle/types";

export type MoveEvent = {
  type: "move";
  actor: string;
  move: string;
  target?: string;
};

export type DamageEvent = {
  type: "damage";
  target: string;
  condition: string;
};

export type HealEvent = {
  type: "heal";
  target: string;
  condition: string;
  source?: string;
  sourceTarget?: string;
};

export type StatusEvent = {
  type: "status";
  target: string;
  status: string;
};

export type CantEvent = {
  type: "cant";
  target: string;
  reason: string;
  move?: string;
};

export type FailEvent = {
  type: "fail";
  target: string;
  action?: string;
};

export type FaintEvent = {
  type: "faint";
  target: string;
};

export type TurnEvent = {
  type: "turn";
  turn: number;
};

export type WinEvent = {
  type: "win";
  winner: string;
};

export type BattleEvent =
  | MoveEvent
  | DamageEvent
  | HealEvent
  | StatusEvent
  | CantEvent
  | FailEvent
  | FaintEvent
  | TurnEvent
  | WinEvent;

/**
 * Zet de raw Showdown log om naar game-vriendelijke battle events.
 *
 * De API bewaart log chunks zoals ze uit de player streams komen. Een chunk kan
 * bijvoorbeeld deze regels bevatten:
 *
 * ```txt
 * p1
 * |move|p1a: Pikachu|Thunderbolt|p2a: Bulbasaur
 * |-damage|p2a: Bulbasaur|176/231
 * |move|p2a: Bulbasaur|Giga Drain|p1a: Pikachu
 * |-damage|p1a: Pikachu|94/211
 * |-heal|p2a: Bulbasaur|231/231|[from] drain|[of] p1a: Pikachu
 * |-status|p2a: Bulbasaur|par
 * |turn|2
 * ```
 *
 * Deze presenter haalt alleen de regels eruit die Godot direct kan gebruiken
 * voor animaties, HP updates, status icons, turn transitions en win screens.
 */
function presentBattleEvents(log: string[]): BattleEvent[] {
  return log.flatMap((chunk) => {
    const lines = chunk.split("\n");

    return lines
      .map(parseBattleEventLine)
      .filter((event): event is BattleEvent => event !== null);
  });
}

export function presentBattleEventsForResponse(log: string[]): BattleEvent[] {
  const playerOneChunks = log.filter((chunk) => chunk.startsWith("p1\n"));

  return presentBattleEvents(playerOneChunks);
}

function parseBattleEventLine(line: string): BattleEvent | null {
  const parts = line.split("|");
  // Showdown protocolregels beginnen meestal met "|"; daardoor is parts[0] leeg
  // en staat het event type op parts[1].
  const eventType = parts[1];

  switch (eventType) {
    case "move":
      return parseMoveEvent(parts);
    case "-damage":
      return parseDamageEvent(parts);
    case "-heal":
      return parseHealEvent(parts);
    case "-status":
      return parseStatusEvent(parts);
    case "cant":
      return parseCantEvent(parts);
    case "-fail":
      return parseFailEvent(parts);
    case "faint":
      return parseFaintEvent(parts);
    case "turn":
      return parseTurnEvent(parts);
    case "win":
      return parseWinEvent(parts);

    default:
      return null;
  }
}

function parseMoveEvent(parts: string[]): MoveEvent {
  return {
    type: "move",
    actor: parts[2],
    move: parts[3],
    target: parts[4],
  };
}

function parseDamageEvent(parts: string[]): DamageEvent {
  return {
    type: "damage",
    target: parts[2],
    condition: parts[3],
  };
}

function parseHealEvent(parts: string[]): HealEvent {
  return {
    type: "heal",
    target: parts[2],
    condition: parts[3],
    // Extra metadata staat in Showdown als marker/value paren:
    // `|[from] drain|[of] p1a: Pikachu`.
    source: parseBracketValue(parts, "[from]"),
    sourceTarget: parseBracketValue(parts, "[of]"),
  };
}

function parseStatusEvent(parts: string[]): StatusEvent {
  return {
    type: "status",
    target: parts[2],
    status: parts[3],
  };
}

function parseCantEvent(parts: string[]): CantEvent {
  return {
    type: "cant",
    target: parts[2],
    reason: parts[3],
    move: parts[4],
  };
}

function parseFailEvent(parts: string[]): FailEvent {
  return {
    type: "fail",
    target: parts[2],
    action: parts[3],
  };
}

function parseFaintEvent(parts: string[]): FaintEvent {
  return {
    type: "faint",
    target: parts[2],
  };
}

function parseTurnEvent(parts: string[]): TurnEvent | null {
  const turn = Number(parts[2]);

  if (!Number.isInteger(turn)) return null;

  return {
    type: "turn",
    turn,
  };
}

function parseWinEvent(parts: string[]): WinEvent {
  return {
    type: "win",
    winner: parts[2],
  };
}

function parseBracketValue(
  parts: string[],
  marker: string
): string | undefined {
  // Zoek een metadata part zoals "[from] drain" en geef "drain" terug.
  const metadataPart = parts.find((part) => part.startsWith(`${marker} `));

  if (!metadataPart) {
    return undefined;
  }

  return metadataPart.slice(marker.length + 1);
}


/**
 * Geeft alleen de events terug die sinds de vorige response nieuw zijn.
 *
 * De API bewaart de volledige raw battle log in `battleData.log`.
 * `eventCursor` wijst naar de eerste logregel die nog niet naar de game
 * is vertaald. Na het parsen schuiven we de cursor door naar het einde
 * van de log, zodat dezelfde events niet opnieuw terugkomen.
 */
export function consumeBattleEventsForResponse(battleData: BattleData): BattleEvent[] {
  const newLogEntries = battleData.log.slice(battleData.eventCursor);
  const events = presentBattleEventsForResponse(newLogEntries)

  battleData.eventCursor = battleData.log.length;

  return events
}
