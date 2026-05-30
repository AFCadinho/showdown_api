import { Dex } from "pokemon-showdown";

export type MoveEffectivenessLabel = 
    | "immune"
    | "not_very_effective"
    | "normal"
    | "super_effective";

export type MoveEffectiveness = {
    multiplier: number;
    label: MoveEffectivenessLabel;
    immune: boolean;
};

export function getMoveEffectiveness(moveNameOrId: string, targetSpeciesName: string, formatid: string): MoveEffectiveness | null {
    const dex = Dex.forFormat(formatid);
    const move = dex.moves.get(moveNameOrId);
    const species = dex.species.get(targetSpeciesName);

    if (!move.exists || !species.exists || move.category === "Status") return null

    const isImmune = !dex.getImmunity(move.type, species);
    if (isImmune) {
        return {
            multiplier: 0,
            label: "immune",
            immune: true
        };
    }

    const effectiveness = dex.getEffectiveness(move.type, species);
    const multiplier = 2 ** effectiveness;

    return {
        multiplier,
        label: getEffectivenessLabel(multiplier),
        immune: false
    }
}

export function getEffectivenessLabel(multiplier: number): MoveEffectivenessLabel {
    if (multiplier > 1) return "super_effective";
    if (multiplier < 1) return "not_very_effective";
    return "normal"
}