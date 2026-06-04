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
    description: "Laatste request per speler als actuele response-snapshot, verrijkt met Dex-data. Hierin staan actuele HP, beschikbare moves, PP, disabled state, type-effectiveness, verplichte switches via forceSwitch[0] en switch-blokkades zoals active[0].trapped of active[0].maybeTrapped. Bij een final response wordt een fainted Pokemon als condition 0 fnt getoond.",
  },
  {
    name: "events",
    type: "BattleEvent[]",
    description: "Nieuwe game-vriendelijke events sinds de vorige API response, zoals turn, move, damage, heal, status, cant, fail, switch, fieldEffect, faint en win. Weather, field conditions en side conditions komen terug als fieldEffect events met state start, upkeep of end. Als Showdown metadata meestuurt, bevat het event ook source en sourceTarget.",
  },
  {
    name: "field",
    type: "object",
    description: "Actuele veldstatus voor UI-iconen en timers. field.effects bevat actieve weather, field conditions zoals Trick Room, terrain en side conditions zoals Tailwind of Stealth Rock. Terrain vervangt vorige terrain. Hazards blijven staan totdat Showdown removal meldt, bijvoorbeeld door Rapid Spin. Sommige effecten bevatten startedTurn, minDuration, maxDuration, minRemainingTurns en maxRemainingTurns in field.effects.",
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
              effectiveness: {
                multiplier: 0.5,
                label: "not_very_effective",
                immune: false,
              },
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
      previousCondition: "231/231",
      condition: "176/231",
      previousHp: 231,
      hp: 176,
      maxHp: 231,
      amount: 55,
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
      previousCondition: "176/231",
      condition: "231/231",
      previousHp: 176,
      hp: 231,
      maxHp: 231,
      amount: 55,
      source: "drain",
      sourceTarget: "p1a: Pikachu",
    },
    {
      type: "turn",
      turn: 2,
    },
  ],
  field: {
    effects: [],
  },
  log: [
    "p1\\n|move|p1a: Pikachu|Thunderbolt|p2a: Bulbasaur\\n|-damage|p2a: Bulbasaur|176/231\\n|turn|2",
  ],
  state: {
    turn: 2,
    ended: false,
    winner: null,
  },
};

const switchSuccessExample = {
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
              move: "Thunderbolt",
              pp: 23,
              maxpp: 24,
              disabled: false,
              type: "Electric",
              category: "Special",
              basePower: 90,
              accuracy: 100,
              effectiveness: {
                multiplier: 1,
                label: "normal",
                immune: false,
              },
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
            active: false,
          },
          {
            ident: "p1: Charizard",
            details: "Charizard, M",
            condition: "297/297",
            active: true,
          },
        ],
      },
    },
  },
  events: [
    {
      type: "switch",
      playerId: "p1",
      from: "Pikachu",
      fromIdent: "p1a: Pikachu",
      to: "Charizard",
      toIdent: "p1a: Charizard",
      pokemon: "p1a: Charizard",
      details: "Charizard, M",
      condition: "297/297",
    },
    {
      type: "turn",
      turn: 3,
    },
  ],
  field: {
    effects: [
      {
        scope: "field",
        effectType: "weather",
        effect: "RainDance",
      },
      {
        scope: "field",
        effectType: "fieldCondition",
        effectGroup: "terrain",
        effect: "move: Grassy Terrain",
      },
      {
        scope: "side",
        side: "p2",
        effectType: "sideCondition",
        effect: "move: Stealth Rock",
      },
    ],
  },
  log: [
    "p1\\n|switch|p1a: Charizard|Charizard, M|297/297\\n|turn|3",
  ],
  state: {
    turn: 3,
    ended: false,
    winner: null,
  },
};

const errorExample = {
  success: false,
  invalidChoice: true,
  error: "Cannot switch: active Pokemon is trapped",
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

const successExampleElement = document.getElementById("success-example");
if (successExampleElement) {
  const switchTitle = document.createElement("h3");
  switchTitle.className = "h5 mt-4 mb-3";
  switchTitle.textContent = "Switch Response Voorbeeld";

  const switchPre = document.createElement("pre");
  switchPre.className = "border rounded bg-body p-3 overflow-auto";

  const switchCode = document.createElement("code");
  switchCode.textContent = JSON.stringify(switchSuccessExample, null, 2);

  switchPre.append(switchCode);
  successExampleElement.parentElement?.append(switchTitle, switchPre);
}
document.getElementById("curl-example").textContent = `curl -X POST ${window.location.origin}/battles/${battleId}/choice \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(requestExample, null, 2)}'`;
