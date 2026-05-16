import type { PlayerId } from "./types"

export type ChoiceType = "move" | "switch"

export type ChoiceInput = {
    playerId: PlayerId;
    type: ChoiceType;
    slot: number;
};

export type ChoiceValidationResult = 
    {
        success: true;
        choice: ChoiceInput;
    }
    | {
        success: false;
        error: string;
    };

export function validateChoiceInput(body: unknown): ChoiceValidationResult {
    if (typeof body !== "object" || body === null) {
        return {
            success: false,
            error: "Invalid request body"
        };
    }

    const { playerId, type, slot } = body as {
        playerId?: unknown,
        type?: unknown,
        slot?: unknown
    }

    if (playerId !== "p1" && playerId !== "p2") {
        return {
          success: false,
          error: "Invalid player",
        };
      }
    
      if (type !== "move" && type !== "switch") {
        return {
          success: false,
          error: "Invalid choice type",
        };
      }
    
      if (typeof slot !== "number" || !Number.isInteger(slot) || slot < 1 || slot > 6) {
        return {
          success: false,
          error: "Invalid choice slot",
        };
      }

    return {
        success: true,
        choice: {
            playerId,
            type,
            slot,
        }
    };
}