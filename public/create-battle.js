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
    description: "Team van speler 1. Elke Pokemon gebruikt het normale Pokemon Showdown set formaat en mag een instanceId bevatten voor save-sync.",
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
    description: "Team van speler 2. Elke Pokemon gebruikt het normale Pokemon Showdown set formaat en mag een instanceId bevatten voor save-sync.",
  },
];

const responseFields = [
  {
    name: "success",
    type: "boolean",
    description: "Geeft aan of de battle succesvol is aangemaakt.",
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
    description: "Laatste request per speler als response-snapshot, verrijkt met Dex-data. Als instanceId is meegestuurd, staat die terug op side.pokemon[].instanceId. Bij forms zoals Mega gebruikt de API team-slot volgorde als fallback als de Showdown ident verandert. Fainted Pokemon worden in de snapshot als condition 0 fnt getoond. Bij create_battle is dit meestal een teamPreview request met moves onder side.pokemon[].moves.",
  },
  {
    name: "events",
    type: "BattleEvent[]",
    description: "Nieuwe game-vriendelijke events sinds de vorige API response. Weather, field conditions en side conditions komen terug als fieldEffect events. Bij create_battle is dit meestal nog leeg.",
  },
  {
    name: "field",
    type: "object",
    description: "Actuele veldstatus voor UI-iconen en timers. field.effects bevat actieve weather, field conditions zoals Trick Room, terrain en side conditions zoals Tailwind of Stealth Rock. Terrain vervangt vorige terrain. Hazards blijven staan totdat Showdown removal meldt, bijvoorbeeld door Rapid Spin. Spikes en Toxic Spikes bevatten layers. Effecten met een bekende duur bevatten startedTurn, minDuration, maxDuration, minRemainingTurns en maxRemainingTurns in field.effects.",
  },
  {
    name: "log",
    type: "string[]",
    description: "Ruwe stream output die de API tot nu toe van Pokemon Showdown heeft ontvangen.",
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
};

const successExample = {
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
            stats: {
              atk: 146,
              def: 116,
              spa: 136,
              spd: 136,
              spe: 216,
            },
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
  field: {
    effects: [],
  },
  log: [
    "p1\\n|request|{...}",
    "p2\\n|request|{...}",
  ],
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
document.getElementById("curl-example").textContent = `curl -X POST ${window.location.origin}/create_battle \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(requestExample, null, 2)}'`;
