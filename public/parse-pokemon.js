const requestFields = [
  {
    name: "text",
    type: "string",
    required: true,
    description: "Pokemon Showdown/Pokepaste tekst voor een Pokemon. Als de tekst een heel team bevat, geeft de API de eerste Pokemon terug.",
  },
];

const responseFields = [
  {
    name: "success",
    type: "boolean",
    description: "Geeft aan of de tekst succesvol is omgezet naar een Pokemon object.",
  },
  {
    name: "pokemon",
    type: "object",
    description: "Het Pokemon Showdown set object met onder andere species, item, ability, nature, EVs, IVs, level, moves en teraType.",
  },
];

const requestExample = {
  text: [
    "Pika (Pikachu) @ Light Ball",
    "Ability: Static",
    "Level: 50",
    "Tera Type: Electric",
    "EVs: 252 Atk / 4 SpD / 252 Spe",
    "Jolly Nature",
    "- Volt Tackle",
    "- Quick Attack",
  ].join("\n"),
};

const successExample = {
  success: true,
  pokemon: {
    name: "Pika",
    species: "Pikachu",
    item: "Light Ball",
    ability: "Static",
    gender: "",
    nature: "Jolly",
    evs: {
      hp: 0,
      atk: 252,
      def: 0,
      spa: 0,
      spd: 4,
      spe: 252,
    },
    ivs: {
      hp: 31,
      atk: 31,
      def: 31,
      spa: 31,
      spd: 31,
      spe: 31,
    },
    level: 50,
    moves: ["Volt Tackle", "Quick Attack"],
    teraType: "Electric",
  },
};

const errorExample = {
  success: false,
  error: "text is required",
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
document.getElementById("curl-example").textContent = `curl -X POST ${window.location.origin}/parse_pokemon \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(requestExample, null, 2)}'`;
