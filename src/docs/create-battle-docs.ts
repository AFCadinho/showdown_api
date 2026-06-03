export const createBattleDocs = {
  method: "POST",
  path: "/create_battle",
  contentType: "application/json",
  description: "Maakt een Pokemon Showdown battle aan met twee teams.",
  requestBody: {
    formatId: "gen9nationaldex",
    p1: {
      name: "Ash",
      team: [
        {
          species: "Pikachu",
          instanceId: "pokemon_123",
          ability: "Static",
          item: "Light Ball",
          moves: ["Thunderbolt", "Quick Attack", "Iron Tail", "Volt Switch"],
          nature: "Timid",
          evs: {
            hp: 4,
            spa: 252,
            spe: 252,
          },
        },
      ],
    },
    p2: {
      name: "Gary",
      team: [
        {
          species: "Bulbasaur",
          ability: "Overgrow",
          item: "Eviolite",
          moves: ["Giga Drain", "Sludge Bomb", "Sleep Powder", "Protect"],
          nature: "Bold",
          evs: {
            hp: 252,
            def: 252,
            spa: 4,
          },
        },
      ],
    },
  },
  fields: {
    formatId: {
      type: "string",
      required: false,
      description: "Pokemon Showdown format. Default: gen9nationaldex.",
    },
    "p1.name": {
      type: "string",
      required: false,
      description: "Naam van speler 1. Default: Player 1.",
    },
    "p1.team": {
      type: "PokemonSet[]",
      required: true,
      description:
        "Team van speler 1 in Pokemon Showdown set formaat. Elke Pokemon mag een instanceId bevatten voor save-sync.",
    },
    "p2.name": {
      type: "string",
      required: false,
      description: "Naam van speler 2. Default: Player 2.",
    },
    "p2.team": {
      type: "PokemonSet[]",
      required: true,
      description:
        "Team van speler 2 in Pokemon Showdown set formaat. Elke Pokemon mag een instanceId bevatten voor save-sync.",
    },
  },
  notes: [
    "Requests worden als response-snapshot teruggegeven. Als een Pokemon fainted is, wordt side.pokemon[].condition in die snapshot bijgewerkt naar 0 fnt.",
    "Als de client instanceId meestuurt op een team-Pokemon, geeft de API dezelfde instanceId terug in requests[p1|p2].side.pokemon[].instanceId.",
    "Als requests[p1|p2].forceSwitch[0] true is, moet de game de verplichte switch UI openen. Dit gebeurt alleen wanneer de battle nog doorloopt na een faint.",
    "Tijdens actieve battle requests moet de game switchen blokkeren als requests[p1|p2].active[0].trapped of requests[p1|p2].active[0].maybeTrapped true is.",
  ],
  successResponse: {
    success: true,
    battleId: "b7c68e40-2e60-4c11-8f92-87b4f6856c2d",
    formatId: "gen9nationaldex",
    players: {
      p1: { name: "Ash" },
      p2: { name: "Gary" },
    },
    requests: {
      p1: {
        teamPreview: true,
        side: {
          name: "Ash",
          id: "p1",
          pokemon: [
            {
              ident: "p1: Pikachu",
              details: "Pikachu, M",
              condition: "211/211",
              active: true,
              instanceId: "pokemon_123",
              moves: [
                {
                  id: "thunderbolt",
                  name: "Thunderbolt",
                  exists: true,
                  type: "Electric",
                  category: "Special",
                  basePower: 90,
                  accuracy: 100,
                  pp: 15,
                  priority: 0,
                  target: "normal",
                  shortDesc: "10% chance to paralyze the target.",
                  desc: "Has a 10% chance to paralyze the target.",
                },
              ],
              baseAbility: "static",
              item: "lightball",
              ability: "static",
              teraType: "Electric",
            },
          ],
        },
      },
    },
    events: [],
    log: [],
  },
  errorResponse: {
    success: false,
    error: "Missing teams",
  },
};

export const createWildBattleDocs = {
  ...createBattleDocs,
  path: "/create_wild_battle",
  description:
    "Maakt een Pokemon Showdown wild battle aan en kiest automatisch slot 1 als lead voor beide spelers.",
  notes: [
    "Request body is gelijk aan /create_battle.",
    "De route voert intern direct team 1 uit voor p1 en p2.",
    "De response bevat daardoor normaal direct requests[p1|p2].active[].moves met actuele pp, maxpp, disabled state, type-effectiveness tegen de actieve tegenstander, verplichte switches via forceSwitch en eventuele switch-blokkades zoals trapped of maybeTrapped.",
    "Requests worden als response-snapshot teruggegeven. Als een Pokemon fainted is, wordt side.pokemon[].condition in die snapshot bijgewerkt naar 0 fnt.",
    "Tijdens actieve battle requests moet de game switchen blokkeren als requests[p1|p2].active[0].trapped of requests[p1|p2].active[0].maybeTrapped true is.",
    "Gebruik deze route voor wild battles waarin geen handmatige team preview stap nodig is.",
  ],
  successResponse: {
    success: true,
    battleId: "b7c68e40-2e60-4c11-8f92-87b4f6856c2d",
    formatId: "gen9nationaldex",
    players: {
      p1: { name: "Ash" },
      p2: { name: "Gary" },
    },
    requests: {
      p1: {
        active: [
          {
            moves: [
              {
                move: "Thunderbolt",
                id: "thunderbolt",
                name: "Thunderbolt",
                exists: true,
                type: "Electric",
                category: "Special",
                basePower: 90,
                accuracy: 100,
                pp: 24,
                maxpp: 24,
                priority: 0,
                target: "normal",
                disabled: false,
                effectiveness: {
                  multiplier: 0.5,
                  label: "not_very_effective",
                  immune: false,
                },
                shortDesc: "10% chance to paralyze the target.",
                desc: "Has a 10% chance to paralyze the target.",
              },
            ],
          },
        ],
      },
      p2: {
        active: [
          {
            moves: [
              {
                move: "Giga Drain",
                id: "gigadrain",
                name: "Giga Drain",
                exists: true,
                type: "Grass",
                category: "Special",
                basePower: 75,
                accuracy: 100,
                pp: 16,
                maxpp: 16,
                priority: 0,
                target: "normal",
                disabled: false,
                effectiveness: {
                  multiplier: 1,
                  label: "normal",
                  immune: false,
                },
                shortDesc: "User recovers 50% of the damage dealt.",
                desc: "The user recovers 1/2 the HP lost by the target, rounded half up.",
              },
            ],
          },
        ],
      },
    },
    events: [],
    log: [],
    state: {
      turn: 1,
      ended: false,
      winner: null,
    },
  },
};
