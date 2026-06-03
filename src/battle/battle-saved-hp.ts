import type { PokemonSaveStateMap } from "./battle-pokemon-instance-ids";
import type { PlayerId } from "./types";

export function buildApplySavedHpEvalCommand(
  playerId: PlayerId,
  saveStateByIdent: PokemonSaveStateMap
) {
  const sideIndex = playerId === "p1" ? 0 : 1;
  const entries = Object.entries(saveStateByIdent)
    .filter(([ident]) => ident.startsWith(`${playerId}: `))
    .flatMap(([ident, saveStates]) =>
      saveStates.map((saveState, occurrence) => ({
        name: ident.replace(`${playerId}: `, ""),
        occurrence,
        currentHp: saveState.currentHp,
      }))
    );

  const payload = JSON.stringify(entries);

  return [
    ">eval",
    `const savedHp = ${payload};`,
    `const side = battle.sides[${sideIndex}];`,
    `const seen = {};`,
    `for (const pokemon of side.pokemon) {`,
    `const occurrence = seen[pokemon.name] || 0;`,
    `seen[pokemon.name] = occurrence + 1;`,
    `const saved = savedHp.find((entry) => entry.name === pokemon.name && entry.occurrence === occurrence);`,
    `if (saved) pokemon.sethp(saved.currentHp);`,
    `}`,
    `battle.makeRequest();`,
  ].join(" ");
}
