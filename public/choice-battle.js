const battleId = decodeURIComponent(window.location.pathname.split("/")[2] || "example-battle-id");

const pathFields = [
  {
    name: "battleId",
    type: "string",
    required: true,
    description: "De unieke id van de battle die je eerder via /create_battle hebt gekregen.",
  },
];

const requestFields = [
  {
    name: "playerId",
    type: '"p1" | "p2"',
    required: true,
    description: "De speler waarvoor je een battle keuze doorstuurt.",
  },
  {
    name: "type",
    type: '"move" | "switch"',
    required: true,
    description: "Het soort keuze. move gebruikt een move slot; switch gebruikt een team slot.",
  },
  {
    name: "slot",
    type: "number",
    required: true,
    description: "Slot van de move of switch. Dit moet een heel getal van 1 tot en met 6 zijn.",
  },
];

const responseFields = [
  {
    name: "success",
    type: "boolean",
    description: "Geeft aan of de choice succesvol is verwerkt.",
  },
  {
    name: "battleId",
    type: "string",
    description: "De id van de battle waarin de keuze is verwerkt.",
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
    description: "Laatste request per speler, verrijkt met Dex-data. Hierin staan actuele HP, beschikbare moves, PP en disabled state.",
  },
  {
    name: "events",
    type: "BattleEvent[]",
    description: "Game-vriendelijke events uit de canonieke battle log, bedoeld voor animaties en UI updates.",
  },
  {
    name: "log",
    type: "string[]",
    description: "Ruwe stream output die de API tot nu toe van Pokemon Showdown heeft ontvangen.",
  },
  {
    name: "state",
    type: "object",
    description: "Samenvatting van de battle state, zoals turn, ended en winner.",
  },
];

const requestExample = {
  playerId: "p1",
  type: "move",
  slot: 1,
};

const successExample = {
  success: true,
  battleId,
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
              id: "thunderbolt",
              name: "Thunderbolt",
              exists: true,
              type: "Electric",
              category: "Special",
              basePower: 90,
              accuracy: 100,
              pp: 23,
              priority: 0,
              target: "normal",
              shortDesc: "10% chance to paralyze the target.",
              desc: "Has a 10% chance to paralyze the target.",
              move: "Thunderbolt",
              maxpp: 24,
              disabled: false,
            },
          ],
        },
      ],
      side: {
        name: "Ash",
        id: "p1",
        pokemon: [
          {
            ident: "p1: Pikachu",
            details: "Pikachu, M",
            condition: "94/211",
            active: true,
          },
        ],
      },
    },
  },
  events: [
    {
      type: "move",
      actor: "p1a: Pikachu",
      move: "Thunderbolt",
      target: "p2a: Bulbasaur",
    },
    {
      type: "damage",
      target: "p2a: Bulbasaur",
      condition: "176/231",
    },
    {
      type: "move",
      actor: "p2a: Bulbasaur",
      move: "Giga Drain",
      target: "p1a: Pikachu",
    },
    {
      type: "heal",
      target: "p2a: Bulbasaur",
      condition: "231/231",
      source: "drain",
      sourceTarget: "p1a: Pikachu",
    },
    {
      type: "turn",
      turn: 2,
    },
  ],
  log: [
    "p1\\n|move|p1a: Pikachu|Thunderbolt|p2a: Bulbasaur\\n|-damage|p2a: Bulbasaur|176/231\\n|turn|2",
  ],
  state: {
    turn: 2,
    ended: false,
    winner: null,
  },
};

const errorExample = {
  success: false,
  error: "Invalid choice type",
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

renderFieldList("path-fields", pathFields);
renderFieldList("request-fields", requestFields);
renderFieldList("response-fields", responseFields);
renderJson("request-example", requestExample);
renderJson("success-example", successExample);
renderJson("error-example", errorExample);
document.getElementById("curl-example").textContent = `curl -X POST ${window.location.origin}/battles/${battleId}/choice \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(requestExample, null, 2)}'`;
