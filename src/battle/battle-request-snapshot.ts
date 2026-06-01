/**
 * Maakt een actuele response-snapshot van de laatst bekende Showdown requests.
 *
 * Showdown stuurt niet altijd nog een nieuwe `|request|` nadat een battle
 * direct eindigt. Daardoor kan `battle.requests` nog oude HP bevatten, terwijl
 * de battle log al laat zien dat een Pokemon fainted is. Deze helper gebruikt
 * daarom de laatste relevante logregels om de `condition` in de response bij te
 * werken voordat de API de request-data teruggeeft aan de UI.
 *
 * Belangrijk: dit wijzigt de originele `request` niet. De store blijft dus de
 * raw Showdown request bewaren; alleen de response krijgt een actuele snapshot.
 */
export function buildBattleRequestSnapshot(request: Record<string, unknown>, log: string[]) {
    let latestUpdate = null;

    // De log bestaat uit chunks per player stream. Elke chunk bevat meerdere
    // Showdown protocolregels, gescheiden door newlines.
    for (const chunk of log) {
        const lines = chunk.split("\n")

        for (const line of lines) {
            const update = parsedConditionUpdate(line);

            if (update) {
                latestUpdate = update
            }
        }
    }

    // Als de log geen condition-update bevat, geven we de request ongewijzigd
    // terug. Er is dan niets te corrigeren voor de response.
    if (!latestUpdate) {
        return request
    } 

    const playerId = latestUpdate.ident.startsWith("p1:") ? "p1" : "p2";
    const playerRequest = request[playerId] as any

    return {
        ...request,
        [playerId]: {
            ...playerRequest,
            side: {
                ...playerRequest.side,
                pokemon: playerRequest.side.pokemon.map((pokemon: any) => {
                    // Showdown gebruikt in events `p2a: Pidgey`, maar in
                    // request.side.pokemon staat `p2: Pidgey`. De parser zet
                    // events daarom eerst om naar dezelfde ident-vorm.
                    if (pokemon.ident !== latestUpdate.ident) return pokemon

                    return {
                        ...pokemon,
                        condition: latestUpdate.condition,
                    }
                })
            }
        }
    }
}

/**
 * Probeert uit een enkele Showdown logregel een condition-update te halen.
 *
 * Voor deze fix ondersteunen we bewust alleen faint-gerelateerde updates:
 * `|-damage|...|0 fnt` en `|faint|...`. Andere updates zoals heal of switch
 * zijn buiten scope voor dit probleem.
 */
function parsedConditionUpdate(line: string) {
    const parts = line.split("|");

    const eventType = parts[1]

    if (eventType === "-damage") {
        const pokemon = parts[2]; // p2a: Pidgey
        const condition = parts[3]; // 0 faint
    
        return {
            ident: pokemon.replace("p2a:", "p2:").replace("p1a:", "p1:"),
            condition
        };
    }

    if (eventType === "faint") {
        const pokemon = parts[2];

        return {
            ident: pokemon.replace("p2a:", "p2:").replace("p1a:", "p1:"),
            // Een `|faint|` regel bevat zelf geen condition, maar voor de UI
            // moet de request snapshot dezelfde Showdown-notatie gebruiken als
            // een damage-regel die naar faint gaat.
            condition: "0 fnt",
        };
    }

    return null
}
