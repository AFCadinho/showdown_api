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
    description: "De speler waarvoor je de lead Pokemon kiest.",
  },
  {
    name: "slot",
    type: "number",
    required: true,
    description: "Team slot van de Pokemon die je wilt kiezen. Dit moet een heel getal van 1 tot en met 6 zijn.",
  },
];

const responseFields = [
  {
    name: "success",
    type: "boolean",
    description: "Geeft aan of de lead succesvol is gekozen.",
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
    description: "Laatste request per speler na de lead keuze, verrijkt met Dex-data. Na team preview staan de beschikbare acties meestal onder active[].moves.",
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
              pp: 24,
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
            condition: "211/211",
            active: true,
            moves: [
              {
                id: "thunderbolt",
                name: "Thunderbolt",
                type: "Electric",
                category: "Special",
                basePower: 90,
                accuracy: 100,
                pp: 15,
              },
            ],
          },
        ],
      },
      rqid: 2,
    },
  },
  log: [
    "p1\\n|request|{...}",
    "p2\\n|request|{...}",
  ],
  state: {
    turn: 0,
    ended: false,
    winner: null,
  },
};

const errorExample = {
  success: false,
  error: "Battle not found",
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
document.getElementById("curl-example").textContent = `curl -X POST ${window.location.origin}/battles/${battleId}/lead \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(requestExample, null, 2)}'`;
