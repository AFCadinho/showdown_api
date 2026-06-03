const requestFields = [
  {
    name: "formatId",
    type: "string",
    required: false,
    description: "Pokemon Showdown format. Als je dit weglaat, gebruikt de API gen9nationaldex.",
  },
  {
    name: "p1.name",
    type: "string",
    required: false,
    description: "Naam van speler 1. Als je dit weglaat, gebruikt de API Player 1.",
  },
  {
    name: "p1.team",
    type: "PokemonSet[]",
    required: true,
    description: "Team van speler 1. Slot 1 wordt automatisch als lead gekozen. Elke Pokemon mag een instanceId bevatten voor save-sync.",
  },
  {
    name: "p2.name",
    type: "string",
    required: false,
    description: "Naam van speler 2. Als je dit weglaat, gebruikt de API Player 2.",
  },
  {
    name: "p2.team",
    type: "PokemonSet[]",
    required: true,
    description: "Team van speler 2. Slot 1 wordt automatisch als lead gekozen. Elke Pokemon mag een instanceId bevatten voor save-sync.",
  },
];

const responseFields = [
  {
    name: "success",
    type: "boolean",
    description: "Geeft aan of de wild battle succesvol is aangemaakt.",
  },
  {
    name: "battleId",
    type: "string",
    description: "Unieke id waarmee je deze battle later kunt terugvinden of uitbreiden.",
  },
  {
    name: "formatId",
    type: "string",
    description: "Het Pokemon Showdown format dat voor deze battle is gebruikt.",
  },
  {
    name: "players",
    type: "object",
    description: "De namen van p1 en p2 zoals de battle ze gebruikt.",
  },
  {
    name: "requests",
    type: "object",
    description: "Laatste request per speler als response-snapshot. Als instanceId is meegestuurd, staat die terug op side.pokemon[].instanceId. Bij create_wild_battle staan moves direct onder active[].moves met live PP, max PP, disabled state, type-effectiveness, verplichte switches via forceSwitch[0] en switch-blokkades zoals active[0].trapped of active[0].maybeTrapped. Als een Pokemon fainted is, toont side.pokemon[].condition 0 fnt.",
  },
  {
    name: "events",
    type: "BattleEvent[]",
    description: "Nieuwe game-vriendelijke events sinds de vorige API response.",
  },
  {
    name: "log",
    type: "string[]",
    description: "Ruwe stream output die de API tot nu toe van Pokemon Showdown heeft ontvangen.",
  },
  {
    name: "state",
    type: "object",
    description: "Battle state zoals turn, ended en winner.",
  },
];

const requestExample = {
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
    name: "Wild Bulbasaur",
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
};

const successExample = {
  success: true,
  battleId: "b7c68e40-2e60-4c11-8f92-87b4f6856c2d",
  formatId: "gen9nationaldex",
  players: {
    p1: { name: "Ash" },
    p2: { name: "Wild Bulbasaur" },
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
  log: [
    "p1\\n|request|{...}",
    "p2\\n|request|{...}",
  ],
  state: {
    turn: 1,
    ended: false,
    winner: null,
  },
};

const errorExample = {
  success: false,
  error: "Missing teams",
};

function renderFieldList(containerId, fields) {
  const container = document.getElementById(containerId);

  container.replaceChildren(
    ...fields.map((field) => {
      const column = document.createElement("div");
      column.className = "col-12 col-md-6";

      const item = document.createElement("div");
      item.className = "card h-100";

      const body = document.createElement("div");
      body.className = "card-body";

      const title = document.createElement("div");
      title.className = "d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-2";

      const name = document.createElement("code");
      name.textContent = field.name;

      const meta = document.createElement("span");
      meta.className = "text-secondary";
      meta.textContent = `${field.type}${field.required === undefined ? "" : field.required ? " | verplicht" : " | optioneel"}`;

      const description = document.createElement("p");
      description.className = "card-text text-secondary mt-2 mb-0";
      description.textContent = field.description;

      title.append(name, meta);
      body.append(title, description);
      item.append(body);
      column.append(item);
      return column;
    })
  );
}

function renderJson(id, value) {
  document.getElementById(id).textContent = JSON.stringify(value, null, 2);
}

renderFieldList("request-fields", requestFields);
renderFieldList("response-fields", responseFields);
renderJson("request-example", requestExample);
renderJson("success-example", successExample);
renderJson("error-example", errorExample);
document.getElementById("curl-example").textContent = `curl -X POST ${window.location.origin}/create_wild_battle \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(requestExample, null, 2)}'`;
