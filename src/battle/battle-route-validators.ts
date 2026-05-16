import type { PlayerId } from "./types";

export type LeadInput = {
  playerId: PlayerId;
  slot: number;
};

export type ChoiceType = "move" | "switch";

export type ChoiceInput = {
  playerId: PlayerId;
  type: ChoiceType;
  slot: number;
};

export type ValidationSuccess<TData> = {
  success: true;
  data: TData;
};

export type ValidationFailure = {
  success: false;
  error: string;
};

export type ValidationResult<TData> =
  | ValidationSuccess<TData>
  | ValidationFailure;

export function validateChoiceInput(
  body: unknown
): ValidationResult<ChoiceInput> {
  if (!validateBody(body)) {
    return {
      success: false,
      error: "Invalid request body",
    };
  }

  const { playerId, type, slot } = body as {
    playerId?: unknown;
    type?: unknown;
    slot?: unknown;
  };

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

  if (
    typeof slot !== "number" ||
    !Number.isInteger(slot) ||
    slot < 1 ||
    slot > 6
  ) {
    return {
      success: false,
      error: "Invalid choice slot",
    };
  }

  return {
    success: true,
    data: {
      playerId,
      type,
      slot,
    },
  };
}

export function validateLeadInput(body: unknown): ValidationResult<LeadInput> {
  if (!validateBody(body)) {
    return {
      success: false,
      error: "Invalid request body",
    };
  }

  const { playerId, slot } = body as {
    playerId?: unknown;
    type?: unknown;
    slot?: unknown;
  };

  if (playerId !== "p1" && playerId !== "p2") {
    return {
      success: false,
      error: "Invalid player",
    };
  }

  if (
    typeof slot !== "number" ||
    !Number.isInteger(slot) ||
    slot < 1 ||
    slot > 6
  ) {
    return {
      success: false,
      error: "Invalid lead slot",
    };
  }

  return {
    success: true,
    data: {
      playerId,
      slot,
    },
  };
}

function validateBody(body: unknown): boolean {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  return true;
}
