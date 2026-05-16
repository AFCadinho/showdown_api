import type { ChoiceInput } from "./battle-route-validators";

export function buildChoiceCommand(choice: ChoiceInput): string {
    return `${choice.type} ${choice.slot}`;
}