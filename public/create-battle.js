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
    description: "Team van speler 1. Elke Pokemon gebruikt het normale Pokemon Showdown set formaat.",
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
    description: "Team van speler 2. Elke Pokemon gebruikt het normale Pokemon Showdown set formaat.",
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
    description: "Laatste Showdown request per speler. Hierin staan de beschikbare keuzes, zoals moves.",
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
      active: [
        {
          moves: [
            {
              move: "Thunderbolt",
              id: "thunderbolt",
              pp: 24,
              maxpp: 24,
              target: "normal",
              disabled: false,
            },
          ],
        },
      ],
      side: {
        name: "Ash",
        id: "p1",
      },
      rqid: 2,
    },
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
      const item = document.createElement("div");
      item.className = "detail";

      const title = document.createElement("div");
      title.className = "detail-title";

      const name = document.createElement("code");
      name.textContent = field.name;

      const meta = document.createElement("span");
      meta.className = "muted";
      meta.textContent = `${field.type}${field.required === undefined ? "" : field.required ? " | verplicht" : " | optioneel"}`;

      const description = document.createElement("p");
      description.textContent = field.description;

      title.append(name, meta);
      item.append(title, description);
      return item;
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
