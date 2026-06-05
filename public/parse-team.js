const requestFields = [
  {
    name: "text",
    type: "string",
    required: true,
    description: "Pokemon Showdown/Pokepaste teamtekst. De API accepteert 1 tot en met 6 Pokemon.",
  },
];

const responseFields = [
  {
    name: "success",
    type: "boolean",
    description: "Geeft aan of de teamtekst succesvol is omgezet.",
  },
  {
    name: "team",
    type: "PokemonSet[]",
    description: "Array met Pokemon Showdown set objecten. Deze array kun je gebruiken als battle team input.",
  },
];

const requestExample = {
  text: [
    "Rillaboom @ Assault Vest",
    "Ability: Grassy Surge",
    "Level: 50",
    "Tera Type: Grass",
    "EVs: 204 HP / 252 Atk / 52 Spe",
    "Adamant Nature",
    "- Grassy Glide",
    "- Knock Off",
    "- U-turn",
    "- Low Kick",
    "",
    "Mewtwo @ Leftovers",
    "Ability: Pressure",
    "Level: 100",
    "Tera Type: Psychic",
    "Timid Nature",
    "- Psystrike",
    "- Aura Sphere",
  ].join("\n"),
};

const successExample = {
  success: true,
  team: [
    {
      species: "Rillaboom",
      item: "Assault Vest",
      ability: "Grassy Surge",
      nature: "Adamant",
      evs: {
        hp: 204,
        atk: 252,
        def: 0,
        spa: 0,
        spd: 0,
        spe: 52,
      },
      level: 50,
      moves: ["Grassy Glide", "Knock Off", "U-turn", "Low Kick"],
      teraType: "Grass",
    },
    {
      species: "Mewtwo",
      item: "Leftovers",
      ability: "Pressure",
      nature: "Timid",
      level: 100,
      moves: ["Psystrike", "Aura Sphere"],
      teraType: "Psychic",
    },
  ],
};

const errorExample = {
  success: false,
  error: "Team must contain 1 to 6 Pokemon",
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
document.getElementById("curl-example").textContent = `curl -X POST ${window.location.origin}/parse_team \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(requestExample, null, 2)}'`;
