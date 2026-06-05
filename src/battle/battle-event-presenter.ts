import type { BattleData } from "@/battle/types";
import { getFieldEffectDurationMetadata } from "./battle-field-effect-metadata";

export type MoveEvent = {
  type: "move";
  actor: string;
  move: string;
  target?: string;
  source?: string;
  sourceTarget?: string;
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
  source?: string;
  sourceTarget?: string;
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

export type MissEvent = {
  type: "miss";
  actor: string;
  target?: string;
  source?: string;
  sourceTarget?: string;
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

export type AbilityEvent = {
  type: "ability";
  target: string;
  ability: string;
  modifier?: string;
  effect?: string;
  stat?: string;
  source?: string;
  sourceTarget?: string;
};

export type StatChangeEvent = {
  type: "statChange";
  target: string;
  stat: string;
  amount: number;
  source?: string;
  sourceTarget?: string;
};

export type PokemonEffectEvent = {
  type: "pokemonEffect";
  target: string;
  effect: string;
  state: "start" | "activate" | "end";
  source?: string;
  sourceTarget?: string;
};

export type FieldEffectEvent = {
  type: "fieldEffect";
  scope: "field" | "side";
  side?: "p1" | "p2";
  effectType: "weather" | "fieldCondition" | "sideCondition";
  effect: string;
  effectGroup?: "terrain";
  state: "start" | "upkeep" | "end";
  minDuration?: number;
  maxDuration?: number;
  source?: string;
  sourceTarget?: string;
};

export type BattleEvent =
  | MoveEvent
  | DamageEvent
  | HealEvent
  | StatusEvent
  | CantEvent
  | FailEvent
  | MissEvent
  | SwitchEvent
  | FaintEvent
  | TurnEvent
  | WinEvent
  | AbilityEvent
  | StatChangeEvent
  | PokemonEffectEvent
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
  activeByPlayer: Record<string, string>,
  exactConditionQueues: Record<string, string[]> = buildExactConditionQueues(log)
): BattleEvent[] {
  return log.flatMap((chunk) => {
    const lines = chunk.split("\n");

    return lines
      .map((line) =>
        parseBattleEventLine(
          line,
          conditionByPokemon,
          requests,
          activeByPlayer,
          exactConditionQueues
        )
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
  const exactConditionQueues = buildExactConditionQueues(log);

  return presentBattleEvents(
    playerOneChunks,
    conditionByPokemon,
    requests,
    activeByPlayer,
    exactConditionQueues
  );
}

function parseBattleEventLine(
  line: string,
  conditionByPokemon: Record<string, string>,
  requests: Record<string, unknown>,
  activeByPlayer: Record<string, string>,
  exactConditionQueues: Record<string, string[]>
): BattleEvent | null {
  const parts = line.split("|");
  // Showdown protocolregels beginnen meestal met "|"; daardoor is parts[0] leeg
  // en staat het event type op parts[1].
  const eventType = parts[1];

  switch (eventType) {
    case "move":
      return parseMoveEvent(parts);
    case "-damage":
      return parseDamageEvent(parts, conditionByPokemon, requests, exactConditionQueues);
    case "-heal":
      return parseHealEvent(parts, conditionByPokemon, requests, exactConditionQueues);
    case "-status":
      return parseStatusEvent(parts);
    case "cant":
      return parseCantEvent(parts);
    case "-fail":
      return parseFailEvent(parts);
    case "-miss":
      return parseMissEvent(parts);
    case "-ability":
      return parseAbilityEvent(parts);
    case "-boost":
      return parseStatChangeEvent(parts, 1);
    case "-unboost":
      return parseStatChangeEvent(parts, -1);
    case "-start":
      return parsePokemonEffectEvent(parts, "start");
    case "-activate":
      return parsePokemonEffectEvent(parts, "activate");
    case "-end":
      return parsePokemonEffectEvent(parts, "end");
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
  const source = parseBracketValue(parts, "[from]");
  const sourceTarget = parseBracketValue(parts, "[of]");

  return {
    type: "move",
    actor: parts[2],
    move: parts[3],
    target: parts[4],
    ...(source ? { source } : {}),
    ...(sourceTarget ? { sourceTarget } : {}),
  };
}

function parseMissEvent(parts: string[]): MissEvent {
  const source = parseBracketValue(parts, "[from]");
  const sourceTarget = parseBracketValue(parts, "[of]");

  return {
    type: "miss",
    actor: parts[2],
    target: parts[3],
    ...(source ? { source } : {}),
    ...(sourceTarget ? { sourceTarget } : {}),
  };
}

function parseDamageEvent(
  parts: string[],
  conditionByPokemon: Record<string, string>,
  requests: Record<string, unknown>,
  exactConditionQueues: Record<string, string[]>
): DamageEvent | null {
  const target = parts[2];
  const previousCondition = conditionByPokemon[target] ?? null;
  const condition = resolveEventCondition(
    parts,
    requests,
    target,
    previousCondition,
    exactConditionQueues
  );
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
      type: "damage",
      target,
      condition,
      ...(source ? { source } : {}),
      ...(sourceTarget ? { sourceTarget } : {}),
    }
  }
  
  const amount = Math.abs(previous.hp - current.hp);

  if (amount === 0) return null;

  return {
    type: "damage",
    target,
    previousCondition,
    condition,
    previousHp: previous.hp,
    hp: current.hp,
    maxHp: current.maxHp,
    amount,
    ...(source ? { source } : {}),
    ...(sourceTarget ? { sourceTarget } : {}),
  };
}

function parseHealEvent(
  parts: string[],
  conditionByPokemon: Record<string, string>,
  requests: Record<string, unknown>,
  exactConditionQueues: Record<string, string[]>
): HealEvent {
  const target = parts[2];
  const previousCondition = conditionByPokemon[target] ?? null;
  const condition = resolveEventCondition(
    parts,
    requests,
    target,
    previousCondition,
    exactConditionQueues
  );
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

function parseAbilityEvent(parts: string[]): AbilityEvent {
  return {
    type: "ability",
    target: parts[2],
    ability: parts[3],
    modifier: parts[4],
  };
}

function parseStatChangeEvent(
  parts: string[],
  direction: 1 | -1
): StatChangeEvent | null {
  const amount = Number(parts[4]);

  if (!Number.isFinite(amount)) return null;

  const source = parseBracketValue(parts, "[from]");
  const sourceTarget = parseBracketValue(parts, "[of]");

  return {
    type: "statChange",
    target: parts[2],
    stat: parts[3],
    amount: amount * direction,
    ...(source ? { source } : {}),
    ...(sourceTarget ? { sourceTarget } : {}),
  };
}

function parsePokemonEffectEvent(
  parts: string[],
  state: "start" | "activate" | "end"
): PokemonEffectEvent | AbilityEvent {
  const source = parseBracketValue(parts, "[from]");
  const sourceTarget = parseBracketValue(parts, "[of]");
  const abilityStatBoost = parseAbilityStatBoostEffect(parts[3]);

  if (state === "activate" && abilityStatBoost) {
    return {
      type: "ability",
      target: parts[2],
      ability: abilityStatBoost.ability,
      effect: "boost",
      stat: abilityStatBoost.stat,
      ...(source ? { source } : {}),
      ...(sourceTarget ? { sourceTarget } : {}),
    };
  }

  return {
    type: "pokemonEffect",
    target: parts[2],
    effect: parts[3],
    state,
    ...(source ? { source } : {}),
    ...(sourceTarget ? { sourceTarget } : {}),
  };
}

function parseAbilityStatBoostEffect(
  effect: string
): { ability: string; stat: string } | null {
  const match = /^(Protosynthesis|QuarkDrive)(hp|atk|def|spa|spd|spe)$/.exec(effect);

  if (!match) return null;

  return {
    ability: match[1] === "QuarkDrive" ? "Quark Drive" : match[1],
    stat: match[2],
  };
}

function parseWeatherEvent(parts: string[]): FieldEffectEvent {
  const effect = parts[2];
  const isUpkeep = parts.includes("[upkeep]");
  const source = parseBracketValue(parts, "[from]");
  const sourceTarget = parseBracketValue(parts, "[of]");
  const weatherEvent = {
    type: "fieldEffect",
    scope: "field",
    effectType: "weather",
    effect,
    state: effect === "none" ? "end" : isUpkeep ? "upkeep" : "start",
  } as const;

  return {
    ...weatherEvent,
    ...(source ? { source } : {}),
    ...(sourceTarget ? { sourceTarget } : {}),
    ...(effect === "none" ? {} : getFieldEffectDurationMetadata(weatherEvent)),
  };
}

function parseFieldConditionEvent(
  parts: string[],
  state: "start" | "end"
): FieldEffectEvent {
  const effect = parts[2];
  const source = parseBracketValue(parts, "[from]");
  const sourceTarget = parseBracketValue(parts, "[of]");
  const fieldEvent = {
    type: "fieldEffect",
    scope: "field",
    effectType: "fieldCondition",
    effectGroup: getFieldConditionGroup(effect),
    effect,
    state,
  } as const;

  return {
    ...fieldEvent,
    ...(source ? { source } : {}),
    ...(sourceTarget ? { sourceTarget } : {}),
    ...getFieldEffectDurationMetadata(fieldEvent),
  };
}

function parseSideConditionEvent(
  parts: string[],
  state: "start" | "end"
): FieldEffectEvent | null {
  const side = getPlayerIdFromSideText(parts[2]);
  const effect = normalizeSideConditionEffect(parts[3]);
  const source = parseBracketValue(parts, "[from]");
  const sourceTarget = parseBracketValue(parts, "[of]");

  if (!side || !effect) return null;
  const sideEvent = {
    type: "fieldEffect",
    scope: "side",
    side,
    effectType: "sideCondition",
    effect,
    state,
  } as const;

  return {
    ...sideEvent,
    ...(source ? { source } : {}),
    ...(sourceTarget ? { sourceTarget } : {}),
    ...getFieldEffectDurationMetadata(sideEvent),
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
  const maxHp = Number(maxHpText?.split(" ")[0]);

  if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0) {
    return null
  }

  return {
    hp,
    maxHp
  }
}

function resolveEventCondition(
  parts: string[],
  requests: Record<string, unknown>,
  target: string,
  previousCondition: string | null,
  exactConditionQueues: Record<string, string[]>
) {
  const logCondition = parts[3];
  const exactCondition = takeExactConditionOverride(
    parts,
    previousCondition,
    exactConditionQueues
  );

  if (exactCondition) {
    return exactCondition;
  }

  const requestCondition = findRequestCondition(requests, target);

  if (!requestCondition) {
    return logCondition;
  }

  if (
    requestCondition !== previousCondition ||
    shouldPreferRequestCondition(logCondition, previousCondition)
  ) {
    return requestCondition;
  }

  return logCondition;
}

function buildExactConditionQueues(log: string[]): Record<string, string[]> {
  const queues: Record<string, string[]> = {};

  for (const chunk of log) {
    for (const line of chunk.split("\n")) {
      const parts = line.split("|");
      const eventType = parts[1];

      if (eventType !== "-damage" && eventType !== "-heal") continue;

      const condition = parts[3];
      const parsed = parseHpCondition(condition);

      if (!parsed || parsed.maxHp === 100) continue;

      const key = getConditionEventKey(parts);
      queues[key] ??= [];
      queues[key].push(condition);
    }
  }

  return queues;
}

function takeExactConditionOverride(
  parts: string[],
  previousCondition: string | null,
  exactConditionQueues: Record<string, string[]>
) {
  if (!shouldPreferExactCondition(parts[3], previousCondition)) {
    return null;
  }

  const queue = exactConditionQueues[getConditionEventKey(parts)];

  return queue?.shift() ?? null;
}

function getConditionEventKey(parts: string[]) {
  const source = parseBracketValue(parts, "[from]") ?? "";
  const sourceTarget = parseBracketValue(parts, "[of]") ?? "";

  return [parts[1], parts[2], source, sourceTarget].join("|");
}

function shouldPreferRequestCondition(
  logCondition: string,
  previousCondition: string | null
) {
  const previous = previousCondition ? parseHpCondition(previousCondition) : null;
  const logged = parseHpCondition(logCondition, previousCondition ?? undefined);

  if (!previous || !logged) return false;

  return previous.maxHp !== 100 && logged.maxHp === 100;
}

function shouldPreferExactCondition(
  logCondition: string,
  previousCondition: string | null
) {
  return shouldPreferRequestCondition(logCondition, previousCondition);
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
