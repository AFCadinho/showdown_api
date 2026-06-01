import { describe, expect, it } from "vitest";
import { buildBattleRequestSnapshot } from "../../src/battle/battle-request-snapshot";

describe("buildBattleRequestSnapshot", () => {
  it("updates a fainted Pokemon condition from battle events", () => {
    const requests = {
      p2: {
        side: {
          pokemon: [
            {
              ident: "p2: Pidgey",
              condition: "16/16",
              active: true,
            },
          ],
        },
      },
    };

    const log = [
      [
        "p1",
        "|move|p1a: Pikachu|Thunderbolt|p2a: Pidgey",
        "|-damage|p2a: Pidgey|0 fnt",
        "|faint|p2a: Pidgey",
        "|win|Player 1",
      ].join("\n"),
    ];

    const snapshot = buildBattleRequestSnapshot(requests, log) as any;

    expect(snapshot.p2.side.pokemon[0]).toMatchObject({
      ident: "p2: Pidgey",
      condition: "0 fnt",
      active: true,
    });
  });

  it("does not mutate the original requests", () => {
    const requests = {
      p2: {
        side: {
          pokemon: [
            {
              ident: "p2: Pidgey",
              condition: "16/16",
              active: true,
            },
          ],
        },
      },
    };

    const log = [["p1", "|-damage|p2a: Pidgey|0 fnt"].join("\n")];

    buildBattleRequestSnapshot(requests, log);

    expect(requests.p2.side.pokemon[0].condition).toBe("16/16");
  });

  it("sets condition to 0 fnt from a faint event", () => {
    const requests = {
      p2: {
        side: {
          pokemon: [
            {
              ident: "p2: Pidgey",
              condition: "16/16",
              active: true,
            },
          ],
        },
      },
    };

    const log = [["p1", "|faint|p2a: Pidgey"].join("\n")];

    const snapshot = buildBattleRequestSnapshot(requests, log) as any;

    expect(snapshot.p2.side.pokemon[0].condition).toBe("0 fnt");
  });
});
