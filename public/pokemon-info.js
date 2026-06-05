const battleId = decodeURIComponent(window.location.pathname.split("/")[3] || "example-battle-id");

const pathFields = [
  {
    name: "battleId",
    type: "string",
    required: true,
    description: "De unieke id van de battle die je eerder via /create_battle of /create_wild_battle hebt gekregen.",
  },
];

const queryFields = [
  {
    name: "viewerId",
    type: '"p1" | "p2"',
    required: true,
    description: "De speler vanuit wiens perspectief je de informatie opvraagt. De API geeft alleen informatie terug die deze speler mag weten.",
  },
  {
    name: "ident",
    type: "string",
    required: true,
    description: "De ident van de Pokemon in battle-formaat, bijvoorbeeld p1a: Pikachu, p1: Pikachu of p2a: Mewtwo.",
  },
];

const responseFields = [
  {
    name: "success",
    type: "boolean",
    description: "Geeft aan of de request technisch gelukt is.",
  },
  {
    name: "pokemon",
    type: "object | null",
    description: "Bevestigde Pokemon-info voor deze viewer. Null betekent dat deze viewer nog geen bekende info voor deze Pokemon heeft.",
  },
  {
    name: "pokemon.ident",
    type: "string",
    description: "Genormaliseerde ident. De API accepteert p1a: Pikachu en geeft p1: Pikachu terug.",
  },
  {
    name: "pokemon.confirmedMoves",
    type: "array",
    description: "Moves die in deze battle bevestigd zijn. Voor bekende PP geeft de API pp en maxpp mee. Als PP alleen uit de move zelf afgeleid kan worden, start deze op max PP en telt daarna af bij bevestigd gebruik.",
  },
  {
    name: "pokemon.confirmedItem",
    type: "string",
    description: "Item dat in deze battle bevestigd is, bijvoorbeeld door request-data of Showdown source metadata.",
  },
  {
    name: "pokemon.confirmedAbility",
    type: "string",
    description: "Ability die in deze battle bevestigd is, bijvoorbeeld door een ability event of effect.",
  },
  {
    name: "pokemon.statChanges",
    type: "object",
    description: "Actuele non-zero stat stages voor de actieve Pokemon, bijvoorbeeld spa: 1 of atk: -1. Deze stages zijn battle-local, publiek zichtbaar en resetten bij switch, faint of battle end.",
  },
];

const queryExample = {
  viewerId: "p1",
  ident: "p2a: Mewtwo",
};

const successExample = {
  success: true,
  pokemon: {
    ident: "p2: Mewtwo",
    confirmedMoves: [
      {
        name: "Aura Sphere",
        pp: 19,
        maxpp: 32,
      },
      {
        name: "Calm Mind",
        pp: 31,
        maxpp: 32,
      },
    ],
    confirmedItem: "leftovers",
    confirmedAbility: "pressure",
    statChanges: {
      spa: 1,
      spd: 1,
      atk: -1,
    },
  },
};

const unknownExample = {
  success: true,
  pokemon: null,
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

function buildQueryString(query) {
  return new URLSearchParams(query).toString();
}

const queryString = buildQueryString(queryExample);
const path = `/battles/${battleId}/pokemon-info?${queryString}`;

renderFieldList("path-fields", pathFields);
renderFieldList("query-fields", queryFields);
renderFieldList("response-fields", responseFields);
document.getElementById("request-example").textContent = `GET ${path}`;
renderJson("success-example", successExample);
renderJson("unknown-example", unknownExample);
renderJson("error-example", errorExample);
document.getElementById("curl-example").textContent = `curl -s "${window.location.origin}${path}"`;
