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
      description: "Team van speler 1 in Pokemon Showdown set formaat.",
    },
    "p2.name": {
      type: "string",
      required: false,
      description: "Naam van speler 2. Default: Player 2.",
    },
    "p2.team": {
      type: "PokemonSet[]",
      required: true,
      description: "Team van speler 2 in Pokemon Showdown set formaat.",
    },
  },
  successResponse: {
    success: true,
    battleId: "b7c68e40-2e60-4c11-8f92-87b4f6856c2d",
    formatId: "gen9nationaldex",
    players: {
      p1: { name: "Ash" },
      p2: { name: "Gary" },
    },
    requests: {},
    log: [],
  },
  errorResponse: {
    success: false,
    error: "Missing teams",
  },
};
