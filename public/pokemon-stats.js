const queryFields = [
  {
    name: "species",
    type: "string",
    required: true,
    description: "Pokemon species, bijvoorbeeld Mewtwo, Rillaboom of Pidgey.",
  },
  {
    name: "level",
    type: "number",
    required: false,
    description: "Level van de Pokemon. Default is 100. Toegestaan bereik is 1 tot en met 100.",
  },
];

const speedFields = [
  {
    name: "min",
    type: "number",
    description: "0 Speed IV, 0 Speed EV en negatieve Speed nature.",
  },
  {
    name: "minNeutral31Iv",
    type: "number",
    description: "31 Speed IV, 0 Speed EV en neutrale nature.",
  },
  {
    name: "maxNeutral31Iv",
    type: "number",
    description: "31 Speed IV, 252 Speed EV en neutrale nature.",
  },
  {
    name: "max",
    type: "number",
    description: "31 Speed IV, 252 Speed EV en positieve Speed nature.",
  },
];

const successExample = {
  success: true,
  pokemon: {
    species: "Mewtwo",
    level: 50,
    baseStats: {
      hp: 106,
      atk: 110,
      def: 90,
      spa: 154,
      spd: 90,
      spe: 130,
    },
    speed: {
      min: 121,
      minNeutral31Iv: 150,
      maxNeutral31Iv: 182,
      max: 200,
    },
  },
};

const errorExample = {
  success: false,
  error: "Unknown species",
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

const path = "/pokemon-stats?species=Mewtwo&level=50";

renderFieldList("query-fields", queryFields);
renderFieldList("speed-fields", speedFields);
document.getElementById("request-example").textContent = `GET ${path}`;
renderJson("success-example", successExample);
renderJson("error-example", errorExample);
document.getElementById("curl-example").textContent = `curl -s "${window.location.origin}${path}"`;
