const routes = [
  {
    method: "GET",
    path: "/health",
    description: "Simpele statuscheck voor hosting en monitoring.",
    href: "/health",
  },
  {
    method: "GET",
    path: "/info",
    description: "JSON metadata over deze API en de Pokemon Showdown engine.",
    href: "/info",
  },
  {
    method: "POST",
    path: "/create_battle",
    description: "Maakt een battle aan met twee Pokemon Showdown teams. Open de docs om te zien wat je meegeeft en terugkrijgt.",
    href: "/create_battle",
    linkText: "docs",
  },
];

function renderRoutes() {
  const container = document.getElementById("routes");

  container.replaceChildren(
    ...routes.map((route) => {
      const column = document.createElement("div");
      column.className = "col-12 col-md-6 col-xl-4";

      const item = document.createElement("div");
      item.className = "card h-100";

      const body = document.createElement("div");
      body.className = "card-body";

      const routeHeader = document.createElement("div");
      routeHeader.className = "d-flex justify-content-between align-items-start gap-3";

      const code = document.createElement("code");
      const method = document.createElement("span");
      method.className = "text-success";
      method.textContent = route.method;
      code.append(method, ` ${route.path}`);

      routeHeader.append(code);

      if (route.href) {
        const link = document.createElement("a");
        link.href = route.href;
        link.className = "link-primary text-decoration-none";
        link.textContent = route.linkText ?? "open";
        routeHeader.append(link);
      }

      const description = document.createElement("p");
      description.className = "card-text text-secondary mt-2 mb-0";
      description.textContent = route.description;

      body.append(routeHeader, description);
      item.append(body);
      column.append(item);
      return column;
    })
  );
}

async function loadInfo() {
  try {
    const response = await fetch("/info");
    const info = await response.json();
    document.getElementById("api-version").textContent = info.version;
    document.getElementById("engine-name").textContent = info.engine;
    document.getElementById("engine-version").textContent = info.engineVersion;
    document.getElementById("base-url").textContent = window.location.origin;
  } catch {
    document.getElementById("api-version").textContent = "onbekend";
  }
}

renderRoutes();
loadInfo();
