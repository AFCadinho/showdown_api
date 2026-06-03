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
  playerId?: string;
  from?: string;
  fromIdent?: string;
  to?: string;
  toIdent?: string;
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

export type FieldEffectEvent = {
  type: "fieldEffect";
  scope: "field" | "side";
  side?: "p1" | "p2";
  effectType: "weather" | "fieldCondition" | "sideCondition";
  effect: string;
  effectGroup?: "terrain";
  state: "start" | "upkeep" | "end";
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
  | WinEvent
  | FieldEffectEvent;


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
  conditionByPokemon: Record<string, string>,
  requests: Record<string, unknown>,
  activeByPlayer: Record<string, string>
): BattleEvent[] {
  return log.flatMap((chunk) => {
    const lines = chunk.split("\n");

    return lines
      .map((line) =>
        parseBattleEventLine(line, conditionByPokemon, requests, activeByPlayer)
      )
      .filter((event): event is BattleEvent => event !== null);
  });
}

export function presentBattleEventsForResponse(
  log: string[],
  conditionByPokemon: Record<string, string> = {},
  requests: Record<string, unknown> = {},
  activeByPlayer: Record<string, string> = {}
): BattleEvent[] {
  const playerOneChunks = log.filter((chunk) => chunk.startsWith("p1\n"));

  return presentBattleEvents(
    playerOneChunks,
    conditionByPokemon,
    requests,
    activeByPlayer
  );
}

function parseBattleEventLine(
  line: string,
  conditionByPokemon: Record<string, string>,
  requests: Record<string, unknown>,
  activeByPlayer: Record<string, string>
): BattleEvent | null {
  const parts = line.split("|");
  // Showdown protocolregels beginnen meestal met "|"; daardoor is parts[0] leeg
  // en staat het event type op parts[1].
  const eventType = parts[1];

  switch (eventType) {
    case "move":
      return parseMoveEvent(parts);
    case "-damage":
      return parseDamageEvent(parts, conditionByPokemon, requests);
    case "-heal":
      return parseHealEvent(parts, conditionByPokemon, requests);
    case "-status":
      return parseStatusEvent(parts);
    case "cant":
      return parseCantEvent(parts);
    case "-fail":
      return parseFailEvent(parts);
    case "-weather":
      return parseWeatherEvent(parts);
    case "-fieldstart":
      return parseFieldConditionEvent(parts, "start");
    case "-fieldend":
      return parseFieldConditionEvent(parts, "end");
    case "-sidestart":
      return parseSideConditionEvent(parts, "start");
    case "-sideend":
      return parseSideConditionEvent(parts, "end");
    case "switch":
      return parseSwitchEvent(parts, activeByPlayer);
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
  conditionByPokemon: Record<string, string>,
  requests: Record<string, unknown>
): DamageEvent {
  const target = parts[2];
  const previousCondition = conditionByPokemon[target] ?? null;
  const condition = resolveEventCondition(parts[3], requests, target, previousCondition);
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
  conditionByPokemon: Record<string, string>,
  requests: Record<string, unknown>
): HealEvent {
  const target = parts[2];
  const previousCondition = conditionByPokemon[target] ?? null;
  const condition = resolveEventCondition(parts[3], requests, target, previousCondition);
  const source = parseBracketValue(parts, "[from]");
  const sourceTarget = parseBracketValue(parts, "[of]");

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

function parseSwitchEvent(
  parts: string[],
  activeByPlayer: Record<string, string>
): SwitchEvent {
  const pokemon = parts[2];
  const playerId = getPlayerIdFromActiveIdent(pokemon);
  const fromIdent = activeByPlayer[playerId];
  const toIdent = pokemon;

  activeByPlayer[playerId] = toIdent;

  return {
    type: "switch",
    playerId,
    from: fromIdent ? getSpeciesFromIdent(fromIdent) : undefined,
    fromIdent,
    to: getSpeciesFromIdent(toIdent),
    toIdent,
    pokemon,
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

function parseWeatherEvent(parts: string[]): FieldEffectEvent {
  const effect = parts[2];
  const isUpkeep = parts.includes("[upkeep]");

  return {
    type: "fieldEffect",
    scope: "field",
    effectType: "weather",
    effect,
    state: effect === "none" ? "end" : isUpkeep ? "upkeep" : "start",
  };
}

function parseFieldConditionEvent(
  parts: string[],
  state: "start" | "end"
): FieldEffectEvent {
  const effect = parts[2];

  return {
    type: "fieldEffect",
    scope: "field",
    effectType: "fieldCondition",
    effectGroup: getFieldConditionGroup(effect),
    effect,
    state,
  };
}

function parseSideConditionEvent(
  parts: string[],
  state: "start" | "end"
): FieldEffectEvent | null {
  const side = getPlayerIdFromSideText(parts[2]);
  const effect = normalizeSideConditionEffect(parts[3]);

  if (!side || !effect) return null;

  return {
    type: "fieldEffect",
    scope: "side",
    side,
    effectType: "sideCondition",
    effect,
    state,
  };
}

function getFieldConditionGroup(effect: string): "terrain" | undefined {
  if (
    effect === "move: Electric Terrain" ||
    effect === "move: Grassy Terrain" ||
    effect === "move: Misty Terrain" ||
    effect === "move: Psychic Terrain"
  ) {
    return "terrain";
  }

  return undefined;
}

function getPlayerIdFromSideText(sideText: string | undefined): "p1" | "p2" | null {
  if (!sideText) return null;
  if (sideText.startsWith("p2")) return "p2";
  if (sideText.startsWith("p1")) return "p1";

  return null;
}

function normalizeSideConditionEffect(effect: string | undefined) {
  if (!effect) return undefined;
  if (effect.includes(":")) return effect;

  return `move: ${effect}`;
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
    battleData.conditionByPokemon,
    battleData.requests,
    battleData.activeByPlayer
  )

  battleData.eventCursor = battleData.log.length;

  return events
}

/**
 * Parseert een Showdown HP-condition naar echte HP-waarden.
 *
 * Normale conditions hebben de vorm `huidigeHP/maxHP`, bijvoorbeeld `16/16`
 * of `176/231`. Damage/heal events gebruiken dezelfde schaal als de request
 * snapshot, zodat HUD en event-animaties dezelfde eindstate zien.
 *
 * Bij faint gebruikt Showdown vaak `0 fnt`; daarin staat geen max HP meer.
 * Daarom gebruikt deze helper de vorige condition om de max HP te behouden.
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

  if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0) {
    return null
  }

  return {
    hp,
    maxHp
  }
}

function resolveEventCondition(
  logCondition: string,
  requests: Record<string, unknown>,
  target: string,
  previousCondition: string | null
) {
  const requestCondition = findRequestCondition(requests, target);

  if (requestCondition && requestCondition !== previousCondition) {
    return requestCondition;
  }

  return logCondition;
}

function findRequestCondition(
  requests: Record<string, unknown>,
  target: string
): string | null {
  const ident = target.replace(/^(p[12])[a-z]?: /, "$1: ");

  for (const request of Object.values(requests)) {
    const battleRequest = request as {
      side?: {
        pokemon?: Array<{
          ident?: string;
          condition?: string;
        }>;
      };
    };
    const pokemonList = battleRequest.side?.pokemon;

    if (!Array.isArray(pokemonList)) continue;

    const pokemon = pokemonList.find((pokemon) => pokemon.ident === ident);

    if (typeof pokemon?.condition === "string") {
      return pokemon.condition;
    }
  }

  return null;
}

function getPlayerIdFromActiveIdent(ident: string) {
  return ident.startsWith("p2") ? "p2" : "p1";
}

function getSpeciesFromIdent(ident: string) {
  return ident.split(": ")[1] ?? ident;
}
