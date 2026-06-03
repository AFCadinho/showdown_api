import { describe, expect, it } from "vitest";
import { validateChoiceAvailability } from "../../src/battle/battle-choice-availability";

describe("validateChoiceAvailability", () => {
  it("allows move choices", () => {
    const result = validateChoiceAvailability(
      {
        playerId: "p1",
        type: "move",
        slot: 1,
      },
      {
        active: [
          {
            trapped: true,
          },
        ],
      }
    );

    expect(result).toEqual({
      success: true,
    });
  });

  it("allows switch choices when the active Pokemon is not trapped", () => {
    const result = validateChoiceAvailability(
      {
        playerId: "p1",
        type: "switch",
        slot: 2,
      },
      {
        active: [
          {
            trapped: false,
          },
        ],
      }
    );

    expect(result).toEqual({
      success: true,
    });
  });

  it("rejects switch choices when the active Pokemon is trapped", () => {
    const result = validateChoiceAvailability(
      {
        playerId: "p1",
        type: "switch",
        slot: 2,
      },
      {
        active: [
          {
            trapped: true,
          },
        ],
      }
    );

    expect(result).toEqual({
      success: false,
      invalidChoice: true,
      error: "Cannot switch: active Pokemon is trapped",
    });
  });

  it("rejects switch choices when the active Pokemon is maybe trapped", () => {
    const result = validateChoiceAvailability(
      {
        playerId: "p1",
        type: "switch",
        slot: 2,
      },
      {
        active: [
          {
            maybeTrapped: true,
          },
        ],
      }
    );

    expect(result).toEqual({
      success: false,
      invalidChoice: true,
      error: "Cannot switch: active Pokemon is trapped",
    });
  });
});
