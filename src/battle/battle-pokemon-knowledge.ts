import { Dex } from "pokemon-showdown";
import type {
  ConfirmedMove,
  PokemonKnownInfo,
  PokemonKnownInfoByViewer,
  PokemonStatStagesByIdent,
  PlayerId,
} from "./types";
import { getVisibleStatStages } from "./battle-pokemon-stat-stages";

type BattlePokemonMove = {
  move?: unknown;
  id?: unknown;
  name?: unknown;
  pp?: unknown;
  maxpp?: unknown;
};

type ResolvedMove = {
  name: string;
  pp: number;
  maxpp: number;
};

type BattlePokemon = {
  ident?: unknown;
  moves?: unknown[];
  item?: unknown;
  ability?: unknown;
  baseAbility?: unknown;
  active?: boolean;
};

type BattleRequest = {
  active?: Array<BattlePokemon & { moves?: unknown[] }>;
  side?: {
    id?: PlayerId | string;
    pokemon?: Array<BattlePokemon>;
  };
};

export function initializeKnownPokemonInfoByViewer(): PokemonKnownInfoByViewer {
  return {
    p1: {},
    p2: {},
  };
}

export function updateKnownPokemonInfoFromRequest(
  knownByViewer: PokemonKnownInfoByViewer,
  viewer: PlayerId,
  request: unknown,
  formatid = "gen9nationaldex"
): void {
  if (!isBattleRequest(request)) {
    return;
  }

  const sidePokemon = request.side?.pokemon ?? [];
  const activePokemon = request.active ?? [];
  const pokemonByIdent: Record<string, BattlePokemon> = {};
  const pokemonIdentOrder: string[] = [];
  const activeOrderByIndex: string[] = [];
  const dex = Dex.forFormat(formatid);

  for (const pokemon of sidePokemon) {
    if (typeof pokemon?.ident !== "string") continue;
    const ident = normalizePokemonIdent(pokemon.ident);
    if (ident === "") continue;
    pokemonByIdent[ident] = pokemonByIdent[ident]
      ? mergePokemon(pokemonByIdent[ident], pokemon)
      : pokemon;
    if (pokemon.active === true) {
      activeOrderByIndex.push(ident);
    }
    pokemonIdentOrder.push(ident);
  }

  for (let index = 0; index < activePokemon.length; index++) {
    const pokemon = activePokemon[index];
    const targetIdent =
      activeOrderByIndex[index] || pokemonIdentOrder[index];
    if (!targetIdent || typeof pokemon?.moves !== "object") {
      continue;
    }
    pokemonByIdent[targetIdent] = pokemonByIdent[targetIdent]
      ? mergePokemon(pokemonByIdent[targetIdent], pokemon)
      : pokemon;
  }

  for (const pokemon of Object.values(pokemonByIdent)) {
    if (typeof pokemon?.ident !== "string") continue;

    const ident = normalizePokemonIdent(pokemon.ident);
    if (ident === "") continue;

    const viewerMap = knownByViewer[viewer];

    const entry: PokemonKnownInfo = viewerMap[ident]
      ? { ...viewerMap[ident] }
      : {};

    const confirmedMoves = extractConfirmedMoves(pokemon.moves ?? [], dex);
    if (confirmedMoves.length > 0) {
      entry.confirmedMoves = confirmedMoves;
    }

    if (typeof pokemon.item === "string" && pokemon.item.trim() !== "") {
      entry.confirmedItem = normalizeItemName(pokemon.item, dex);
    }

    if (typeof pokemon.ability === "string" && pokemon.ability.trim() !== "") {
      entry.confirmedAbility = normalizeAbilityName(pokemon.ability);
    } else if (
      typeof pokemon.baseAbility === "string" &&
      pokemon.baseAbility.trim() !== ""
    ) {
      entry.confirmedAbility = normalizeAbilityName(pokemon.baseAbility);
    }

    if (
      entry.confirmedMoves ||
      entry.confirmedItem ||
      entry.confirmedAbility
    ) {
      viewerMap[ident] = entry;
    }
  }
}

function mergePokemon(existing: BattlePokemon, update: BattlePokemon): BattlePokemon {
  return {
    ...existing,
    ...update,
    moves: update.moves?.length ? update.moves : existing.moves,
  };
}

export function updateKnownPokemonInfoFromLine(
  knownByViewer: PokemonKnownInfoByViewer,
  line: string,
  formatid = "gen9nationaldex"
): void {
  const parts = line.split("|");
  const eventType = parts[1];
  const dex = Dex.forFormat(formatid);

  if (!eventType) return;

  if (eventType === "move") {
    const actor = parts[2];
    const move = parts[3];
    if (typeof actor !== "string" || typeof move !== "string") return;

    updateKnownMoveByActor(knownByViewer, actor, move, true, dex);
    return;
  }

  if (eventType === "-ability") {
    const target = parts[2];
    const ability = parts[3];
    if (typeof target !== "string" || typeof ability !== "string") return;

    updateKnownAbility(knownByViewer, target, ability);
    return;
  }

  if (eventType === "-start" || eventType === "-activate" || eventType === "-end") {
    const target = parts[2];
    const effect = parts[3];

    if (typeof effect === "string" && effect.startsWith("ability: ")) {
      updateKnownAbility(knownByViewer, target, effect.replace("ability: ", ""));
      return;
    }
  }

  const source = parseBracketValue(parts, "[from]");
  if (!source || !source.startsWith("item: ")) return;

  const item = normalizeItemName(source.replace("item:", ""));
  if (!item || !isPokemonIdent(parts[2])) return;

  const target = parts[2];
  const targetEventTypes = new Set([
    "-damage",
    "-heal",
    "-status",
    "-fieldstart",
    "-fieldend",
    "-sidestart",
    "-sideend",
  ]);

  if (eventType === "status" && typeof target === "string") {
    for (const viewer of viewerIds) {
      const entry = ensureInfoForPokemon(knownByViewer[viewer], target);
      entry.confirmedItem = item;
    }
    return;
  }

  if (targetEventTypes.has(eventType)) {
    for (const viewer of viewerIds) {
      const entry = ensureInfoForPokemon(knownByViewer[viewer], target);
      entry.confirmedItem = item;
    }
  }
}

export function getViewerKnownPokemonInfo(
  knownByViewer: PokemonKnownInfoByViewer,
  viewerId: PlayerId,
  ident: string,
  activeByPlayer: Record<string, string> = {},
  statStagesByPokemon: PokemonStatStagesByIdent = {}
) {
  const normalizedIdent = normalizePokemonIdent(ident);
  const info = knownByViewer[viewerId][normalizedIdent] ?? {};
  const playerId = getPlayerIdFromIdent(normalizedIdent);
  const isActive =
    playerId !== undefined &&
    normalizePokemonIdent(activeByPlayer[playerId] ?? "") === normalizedIdent;
  const statChanges = isActive
    ? getVisibleStatStages(statStagesByPokemon, normalizedIdent)
    : undefined;

  const hasAny =
    (info.confirmedMoves && info.confirmedMoves.length > 0) ||
    Boolean(info.confirmedItem) ||
    Boolean(info.confirmedAbility) ||
    Boolean(statChanges);

  if (!hasAny) return null;

  return {
    ident: normalizedIdent,
    ...info,
    ...(statChanges ? { statChanges } : {}),
  };
}

function updateKnownAbility(
  knownByViewer: PokemonKnownInfoByViewer,
  target: string,
  ability: string
) {
  if (!isPokemonIdent(target)) return;
  const abilityName = normalizeAbilityName(ability);
  if (!abilityName) return;

  for (const viewer of viewerIds) {
    const entry = ensureInfoForPokemon(knownByViewer[viewer], target);
    entry.confirmedAbility = abilityName;
  }
}

function updateKnownMoveByActor(
  knownByViewer: PokemonKnownInfoByViewer,
  actor: string,
  moveName: string,
  consumePp: boolean,
  dex: ReturnType<typeof Dex.forFormat>
) {
  if (!isPokemonIdent(actor)) return;

  const normalizedMove = normalizeMoveName(moveName);
  if (!normalizedMove) return;
  const actorPlayerId = getPlayerIdFromIdent(actor);

  for (const viewer of viewerIds) {
    if (consumePp && viewer === actorPlayerId) continue;

    const entry = ensureInfoForPokemon(knownByViewer[viewer], actor);
    const normalizedMoves = entry.confirmedMoves ?? [];
    const existing = normalizedMoves.find((move) => move.name === normalizedMove);

    if (existing) {
      if (consumePp && typeof existing.pp === "number") {
        existing.pp = Math.max(0, existing.pp - 1);
      }

      entry.confirmedMoves = normalizedMoves;
      continue;
    }

    const fallback: ConfirmedMove = {
      name: normalizedMove,
    };
    const moveTemplate = resolvePokemonShowdownMove(normalizedMove, undefined, dex);
    if (moveTemplate?.pp) {
      fallback.maxpp = calculateMaxPp(moveTemplate.pp);
      fallback.pp = fallback.maxpp;
    }

    if (consumePp) {
      const requestMatch = knownMoveFromActiveSide(
        actor,
        normalizedMove,
        knownByViewer[viewer]
      );

      if (requestMatch) {
        const [pp, maxpp] = requestMatch;
        fallback.pp = pp;
        fallback.maxpp = maxpp;
      }

      if (typeof fallback.pp === "number") {
        fallback.pp = Math.max(0, fallback.pp - 1);
      }
    }

    normalizedMoves.push(fallback);
    entry.confirmedMoves = normalizedMoves;
  }
}

function knownMoveFromActiveSide(
  actor: string,
  move: string,
  knownByViewer: Record<string, PokemonKnownInfo>
): [number, number] | undefined {
  const actorEntry = knownByViewer[normalizePokemonIdent(actor)];
  if (!actorEntry?.confirmedMoves) return undefined;

  const known = actorEntry.confirmedMoves.find(
    (knownMove) =>
      isSameMoveName(knownMove.name, move) &&
      typeof knownMove.pp === "number" &&
      typeof knownMove.maxpp === "number"
  );

  if (!known) return undefined;

  const pp = known.pp;
  const maxpp = known.maxpp;

  if (typeof pp !== "number" || typeof maxpp !== "number") {
    return undefined;
  }

  return [pp, maxpp];
}

function isSameMoveName(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

function ensureInfoForPokemon(
  infoByIdent: Record<string, PokemonKnownInfo>,
  ident: string
) {
  const key = normalizePokemonIdent(ident);
  infoByIdent[key] = infoByIdent[key] ?? {};
  return infoByIdent[key];
}

function extractConfirmedMoves(
  moves: unknown[],
  dex: ReturnType<typeof Dex.forFormat>
): ConfirmedMove[] {
  const confirmedMoves: ConfirmedMove[] = [];

  for (const move of moves) {
    if (typeof move === "string") {
      const resolved = resolveMoveFromRawInput(move, move, dex);
      if (resolved) {
        confirmedMoves.push(resolved);
      }
      continue;
    }

    if (!isPokemonMove(move)) continue;

    const pp = move.pp;
    const maxpp = move.maxpp;
    const rawName = move.move ?? move.name ?? move.id;
    const rawId = move.id;

    if (typeof rawName !== "string") continue;
    const resolvedBase = resolveMoveFromRawInput(rawName, rawId, dex);

    if (!resolvedBase) continue;

    const name = resolvedBase.name;
    const maxedMaxpp = resolvedBase.maxpp;
    const usedPp =
      typeof pp === "number" && typeof maxpp === "number"
        ? Math.max(0, maxpp - pp)
        : 0;
    const resolvedCurrent = Math.max(0, maxedMaxpp - usedPp);

    if (typeof resolvedCurrent !== "number") {
      continue;
    }

    confirmedMoves.push({
      name,
      pp: resolvedCurrent,
      maxpp: maxedMaxpp,
    });
  }

  return confirmedMoves;
}

function resolveMoveFromRawInput(
  rawName: string,
  rawId: unknown,
  dex: ReturnType<typeof Dex.forFormat>
): ResolvedMove | undefined {
  const move = resolvePokemonShowdownMove(rawName, rawId, dex);
  if (!move?.name || typeof move.pp !== "number") return undefined;

  const name = move.name;
  const maxpp = calculateMaxPp(move.pp);
  return {
    name,
    pp: maxpp,
    maxpp,
  };
}

function calculateMaxPp(basePp: number) {
  return Math.floor(basePp * 1.6);
}

function resolvePokemonShowdownMove(
  rawName: string,
  rawId: unknown,
  dex: ReturnType<typeof Dex.forFormat>
) {
  const moveFromId =
    typeof rawId === "string" ? dex.moves.get(rawId) : undefined;
  return moveFromId ?? dex.moves.get(rawName);
}

function isPokemonMove(move: unknown): move is BattlePokemonMove {
  return typeof move === "object" && move !== null;
}

function isPokemonIdent(ident?: string | undefined) {
  return /^p[12]a?:\s/.test(ident ?? "");
}

function getPlayerIdFromIdent(ident: string): PlayerId | undefined {
  if (ident.startsWith("p1")) return "p1";
  if (ident.startsWith("p2")) return "p2";
  return undefined;
}

function normalizePokemonIdent(ident: string) {
  return ident.replace(/^(p[12])a:/, "$1:").replace(/\s+/g, " ").trim();
}

function normalizeAbilityName(ability: string) {
  const trimmed = ability.trim();
  return trimmed === "" ? undefined : trimmed.toLowerCase();
}

function normalizeMoveName(name: string) {
  if (!name) return "";
  if (name.includes(" ")) return name;

  if (name.includes("-")) {
    return name
      .split("-")
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ");
  }

  return name[0]?.toUpperCase() + name.slice(1);
}

function normalizeItemName(
  rawItem: string,
  dex: ReturnType<typeof Dex.forFormat> = Dex.forFormat("gen9nationaldex")
) {
  const trimmed = rawItem.trim();
  if (trimmed === "") return undefined;

  const item = dex.items.get(trimmed) ?? dex.items.get(trimmed.toLowerCase());
  if (item?.name) {
    return item.name.toLowerCase();
  }

  return trimmed
    .replace(/-/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
}

function parseBracketValue(parts: string[], marker: string): string | undefined {
  const metadataPart = parts.find((part) => part.startsWith(`${marker} `));

  if (!metadataPart) {
    return undefined;
  }

  return metadataPart.slice(marker.length + 1);
}

function isBattleRequest(request: unknown): request is BattleRequest {
  return typeof request === "object" && request !== null;
}

const viewerIds: PlayerId[] = ["p1", "p2"];
