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
  previousCondition?: string;
  previousHp?: number;
  hp?: number;
  maxHp?: number;
  amount?: number;
};

export type HealEvent = {
  type: "heal";
  target: string;
  condition: string;
  previousCondition?: string;
  previousHp?: number;
  hp?: number;
  maxHp?: number;
  amount?: number;
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

export type SwitchEvent = {
  type: "switch";
  pokemon: string;
  details: string;
  condition: string;
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
  | SwitchEvent
  | FaintEvent
  | TurnEvent
  | WinEvent;


type ParsedHpCondition = {
  hp: number;
  maxHp: number;
};


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
function presentBattleEvents(
  log: string[],
  conditionByPokemon: Record<string, string>
): BattleEvent[] {
  return log.flatMap((chunk) => {
    const lines = chunk.split("\n");

    return lines
      .map((line) => parseBattleEventLine(line, conditionByPokemon))
      .filter((event): event is BattleEvent => event !== null);
  });
}

export function presentBattleEventsForResponse(
  log: string[],
  conditionByPokemon: Record<string, string> = {}
): BattleEvent[] {
  const playerOneChunks = log.filter((chunk) => chunk.startsWith("p1\n"));

  return presentBattleEvents(playerOneChunks, conditionByPokemon);
}

function parseBattleEventLine(
  line: string,
  conditionByPokemon: Record<string, string>
): BattleEvent | null {
  const parts = line.split("|");
  // Showdown protocolregels beginnen meestal met "|"; daardoor is parts[0] leeg
  // en staat het event type op parts[1].
  const eventType = parts[1];

  switch (eventType) {
    case "move":
      return parseMoveEvent(parts);
    case "-damage":
      return parseDamageEvent(parts, conditionByPokemon);
    case "-heal":
      return parseHealEvent(parts, conditionByPokemon);
    case "-status":
      return parseStatusEvent(parts);
    case "cant":
      return parseCantEvent(parts);
    case "-fail":
      return parseFailEvent(parts);
    case "switch":
      return parseSwitchEvent(parts);
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

function parseDamageEvent(
  parts: string[],
  conditionByPokemon: Record<string, string>
): DamageEvent {
  const target = parts[2];
  const condition = parts[3];

  const previousCondition = conditionByPokemon[target] ?? null;
  const previous = previousCondition
    ? parseHpCondition(previousCondition)
    : null;
  const current = previousCondition
    ? parseHpCondition(condition, previousCondition)
    : null;

  conditionByPokemon[target] = condition;

  if (!previousCondition || !previous || !current) {
    return {
      type: "damage",
      target,
      condition
    }
  }
  
  return {
    type: "damage",
    target,
    previousCondition,
    condition,
    previousHp: previous.hp,
    hp: current.hp,
    maxHp: current.maxHp,
    amount: Math.abs(previous.hp - current.hp)
  };
}

function parseHealEvent(
  parts: string[],
  conditionByPokemon: Record<string, string>
): HealEvent {
  const target = parts[2];
  const condition = parts[3];
  const source = parseBracketValue(parts, "[from]");
  const sourceTarget = parseBracketValue(parts, "[of]");

  const previousCondition = conditionByPokemon[target] ?? null;
  const previous = previousCondition
    ? parseHpCondition(previousCondition)
    : null;
  const current = previousCondition
    ? parseHpCondition(condition, previousCondition)
    : null;

  conditionByPokemon[target] = condition;

  if (!previousCondition || !previous || !current) {
    return {
      type: "heal",
      target,
      condition,
      source,
      sourceTarget,
    }
  }
  
  return {
    type: "heal",
    target,
    previousCondition,
    condition,
    previousHp: previous.hp,
    hp: current.hp,
    maxHp: current.maxHp,
    amount: Math.abs(previous.hp - current.hp),
    source,
    sourceTarget,
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

function parseSwitchEvent(parts: string[]): SwitchEvent {
  return {
    type: "switch",
    pokemon: parts[2],
    details: parts[3],
    condition: parts[4]
  }
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
  const events = presentBattleEventsForResponse(
    newLogEntries,
    battleData.conditionByPokemon
  )

  battleData.eventCursor = battleData.log.length;

  return events
}

/**
 * Parseert een Showdown HP-condition naar losse HP-waarden.
 *
 * Normale conditions hebben de vorm `huidigeHP/maxHP`, bijvoorbeeld `16/16`
 * of `176/231`. Bij faint gebruikt Showdown vaak `0 fnt`; daarin staat geen
 * max HP meer. Daarom kan deze helper optioneel de vorige condition gebruiken
 * om bij `0 fnt` alsnog de juiste `maxHp` terug te geven.
 *
 * Geeft `null` terug als de condition niet veilig naar getallen te vertalen is.
 */
function parseHpCondition(condition: string, previousCondition?: string): ParsedHpCondition | null {
  if (condition.endsWith(" fnt")) {
    const previous = previousCondition
      ? parseHpCondition(previousCondition)
      : null

    if (!previous) return null

    return {
      hp: 0,
      maxHp: previous.maxHp
    };
  }

  const [hpText, maxHpText] = condition.split("/");
  const hp = Number(hpText);
  const maxHp = Number(maxHpText);

  if (!Number.isFinite(hp) || !Number.isFinite(maxHp)) {
    return null
  }

  return {
    hp,
    maxHp
  }
}
