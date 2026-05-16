import { Dex } from "pokemon-showdown";

/**
 * Builds the public, UI-facing representation of a move.
 *
 * The game/client can send a simple move name or ID, while the API uses
 * Pokemon Showdown's Dex as the source of truth for the full move data.
 *
 * Note: Showdown uses `accuracy: true` for moves that always hit.
 */
export function presentMove(moveNameOrId: string, formatid: string) {
  // Use the format-specific Dex so move data matches the battle ruleset.
  const move = Dex.forFormat(formatid).moves.get(moveNameOrId);

  return {
    id: move.id,
    name: move.name,
    exists: move.exists,
    type: move.type,
    category: move.category,
    basePower: move.basePower,
    accuracy: move.accuracy,
    pp: move.pp,
    priority: move.priority,
    target: move.target,
    shortDesc: move.shortDesc,
    desc: move.desc,
  };
}
