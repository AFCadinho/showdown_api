import type { ChoiceInput } from "./battle-route-validators";

type BattleRequest = {
  active?: Array<{
    trapped?: boolean;
    maybeTrapped?: boolean;
  }>;
};

export type ChoiceAvailabilityResult =
  | {
      success: true;
    }
  | {
      success: false;
      invalidChoice: true;
      error: string;
    };

/**
 * Controleert of een keuze volgens de laatst bekende Showdown request mag.
 *
 * Showdown zet `active[0].trapped` of `active[0].maybeTrapped` wanneer de
 * actieve Pokemon niet veilig mag switchen, bijvoorbeeld door Outrage-lock of
 * trapping mechanics. De API weigert zo'n switch meteen duidelijk, zodat de
 * game niet alleen een raw `|error|` regel hoeft te inspecteren.
 */
export function validateChoiceAvailability(
  choice: ChoiceInput,
  request: unknown
): ChoiceAvailabilityResult {
  if (choice.type !== "switch") {
    return { success: true };
  }

  if (!isBattleRequest(request)) {
    return { success: true };
  }

  const activePokemon = request.active?.[0];

  if (activePokemon?.trapped === true || activePokemon?.maybeTrapped === true) {
    return {
      success: false,
      invalidChoice: true,
      error: "Cannot switch: active Pokemon is trapped",
    };
  }

  return { success: true };
}

function isBattleRequest(request: unknown): request is BattleRequest {
  return typeof request === "object" && request !== null;
}
