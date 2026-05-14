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
      const item = document.createElement("div");
      item.className = "item";

      const routeHeader = document.createElement("div");
      routeHeader.className = "route";

      const code = document.createElement("code");
      const method = document.createElement("span");
      method.className = "method";
      method.textContent = route.method;
      code.append(method, ` ${route.path}`);

      routeHeader.append(code);

      if (route.href) {
        const link = document.createElement("a");
        link.href = route.href;
        link.textContent = route.linkText ?? "open";
        routeHeader.append(link);
      }

      const description = document.createElement("p");
      description.textContent = route.description;

      item.append(routeHeader, description);
      return item;
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
