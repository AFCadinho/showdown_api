# BattleStream documentatie

Deze documentatie beschrijft `pokemon-showdown/sim/battle-stream.ts`: de stream-laag bovenop de echte Pokemon Showdown battle engine.

`BattleStream` is niet de battle-engine zelf. De echte battle zit in `pokemon-showdown/sim/battle.ts` als `Battle`. `BattleStream` is een command-interface die tekstregels ontvangt, daar engine-acties van maakt, en battle output terugstuurt.

De belangrijkste exports uit `battle-stream.ts` zijn:

- `BattleStream`
- `getPlayerStreams`
- `BattlePlayer`
- `BattleTextStream`

## Wanneer Gebruik Je BattleStream?

Gebruik `BattleStream` wanneer je een eigen API, bot, test-runner of game-server wilt bouwen die de Pokemon Showdown engine aanstuurt zonder direct alle interne `Battle` methods te beheren.

De stream vertaalt input zoals:

```txt
>start {"formatid":"gen9customgame"}
>player p1 {"name":"Player 1","team":"..."}
>player p2 {"name":"Player 2","team":"..."}
>p1 move 1
>p2 move 1
```

naar calls op de engine, zoals:

```ts
new Battle(options)
battle.setPlayer("p1", options)
battle.choose("p1", "move 1")
```

## Basisgebruik

```ts
const { BattleStream, getPlayerStreams, Teams } = require("./pokemon-showdown/dist/sim");

const battleStream = new BattleStream();
const streams = getPlayerStreams(battleStream);

const spec = {
  formatid: "gen9customgame",
};

const p1spec = {
  name: "Player 1",
  team: Teams.pack([
    {
      species: "Pikachu",
      ability: "Static",
      item: "Light Ball",
      moves: ["Thunderbolt", "Quick Attack"],
    },
  ]),
};

const p2spec = {
  name: "Player 2",
  team: Teams.pack([
    {
      species: "Bulbasaur",
      ability: "Overgrow",
      moves: ["Tackle", "Vine Whip"],
    },
  ]),
};

void streams.omniscient.write(`>start ${JSON.stringify(spec)}
>player p1 ${JSON.stringify(p1spec)}
>player p2 ${JSON.stringify(p2spec)}`);
```

Lees output zo:

```ts
void (async () => {
  for await (const chunk of streams.omniscient) {
    console.log(chunk);
  }
})();
```

Geef keuzes door zo:

```ts
void streams.p1.write("move 1");
void streams.p2.write("move 1");
```

`streams.p1.write("move 1")` wordt automatisch omgezet naar:

```txt
>p1 move 1
```

## BattleStream

`BattleStream` staat in `pokemon-showdown/sim/battle-stream.ts`.

```ts
export class BattleStream extends Streams.ObjectReadWriteStream<string>
```

Een `BattleStream` is een read/write stream:

- Je schrijft commands naar de stream.
- De stream verwerkt die commands.
- De stream pusht battle-updates terug.

### Constructor

```ts
new BattleStream(options?)
```

Ondersteunde opties:

```ts
{
  debug?: boolean;
  noCatch?: boolean;
  keepAlive?: boolean;
  replay?: boolean | "spectator";
}
```

### `debug`

Als `debug` aan staat, wordt `debug: true` doorgegeven aan de `Battle` wanneer `>start` wordt verwerkt.

Dit is vooral nuttig voor tests en development. Sommige engine-controles en debug-output kunnen hierdoor actiever zijn.

### `noCatch`

Normaal vangt `BattleStream` errors tijdens command-verwerking op en pusht hij ze als stream error.

Met `noCatch: true` laat hij errors direct gooien. Dit is handig als je in tests wilt dat fouten hard falen.

### `keepAlive`

Normaal sluit de stream wanneer de battle eindigt en de engine een `end` message stuurt.

Met `keepAlive: true` blijft de stream open na het einde van de battle.

### `replay`

Met `replay` verandert de outputmodus.

```ts
new BattleStream({ replay: true })
new BattleStream({ replay: "spectator" })
```

Bij replay-output worden alleen `update` messages doorgegeven. Met `"spectator"` krijg je spectator-safe output. Met `true` krijg je de omniscient output.

## Interne Eigenschappen

### `battle`

```ts
battle: Battle | null
```

Bij het maken van een `BattleStream` is `battle` nog `null`.

De echte battle ontstaat pas bij:

```txt
>start {...}
```

Intern gebeurt dan:

```ts
this.battle = new Battle(options);
```

## Input Commands

Alle commands die `BattleStream` begrijpt beginnen met `>`.

Een input kan meerdere regels bevatten:

```txt
>start {"formatid":"gen9customgame"}
>player p1 {"name":"A","team":"..."}
>player p2 {"name":"B","team":"..."}
```

`BattleStream` splitst de input per regel. Alleen regels die met `>` beginnen worden verwerkt.

## `>start`

Start de engine door een nieuwe `Battle` aan te maken.

```txt
>start {"formatid":"gen9customgame"}
```

Voorbeeld met seed:

```txt
>start {"formatid":"gen9customgame","seed":[1,2,3,4]}
```

De JSON wordt geparsed en doorgegeven aan `new Battle(options)`.

Belangrijke opties voor `Battle`:

- `formatid`: welk format gespeeld wordt
- `seed`: optionele PRNG seed
- `rated`: rated label of boolean
- `debug`: debug mode
- `strictChoices`: of ongeldige keuzes moeten throwen

Je hoeft zelf geen `send` callback mee te geven via het command. `BattleStream` injecteert die callback zelf, zodat engine-output terug naar de stream gaat.

## `>player`

Voegt een speler toe of past spelergegevens aan.

```txt
>player p1 {"name":"Player 1","team":"..."}
>player p2 {"name":"Player 2","team":"..."}
```

Intern:

```ts
battle.setPlayer(slot, playerOptions)
```

Slot kan zijn:

- `p1`
- `p2`
- `p3`
- `p4`

Voor normale singles/doubles gebruik je meestal alleen `p1` en `p2`.

Player options bevatten meestal:

```ts
{
  name: string;
  team: string | PokemonSet[];
  avatar?: string;
  rating?: string | number;
}
```

Team mag een packed team string zijn of een array van sets. Als het geen string is, pakt de engine het met `Teams.pack`.

Zodra alle verwachte spelers aanwezig zijn, start `Battle` automatisch.

## `>p1`, `>p2`, `>p3`, `>p4`

Stuurt een keuze namens een speler.

```txt
>p1 move 1
>p2 move 2
```

Intern:

```ts
battle.choose("p1", "move 1")
```

Veelvoorkomende keuzes:

```txt
move 1
move 2
move 3
move 4
switch 2
team 123456
pass
default
```

De exacte geldige keuzes hangen af van de huidige request van de engine. Die request komt terug in de player stream als:

```txt
|request|{...}
```

Bij Team Preview zie je meestal een `teampreview` request. Bij een normale turn zie je een `move` request. Bij faint/switch situaties zie je een `switch` request.

## `undo`

Een speler kan een keuze ongedaan maken:

```txt
>p1 undo
```

Intern:

```ts
battle.undoChoice("p1")
```

## `>forcewin`

Forceert een winnaar.

```txt
>forcewin p1
```

Intern:

```ts
battle.win("p1")
```

Dit wordt ook aan de `inputLog` toegevoegd.

## `>forcetie`

Forceert gelijkspel.

```txt
>forcetie
```

Intern:

```ts
battle.win(null)
```

Dit wordt aan de `inputLog` toegevoegd als `>forcetie`.

## `>forcelose`

Forceert dat een speler verliest.

```txt
>forcelose p2
```

Intern:

```ts
battle.lose("p2")
```

Dit wordt aan de `inputLog` toegevoegd.

## `>reseed`

Reset de RNG seed.

```txt
>reseed 1,2,3,4
```

Intern:

```ts
battle.resetRNG(seed)
```

Daarna wordt de echte seed uit `battle.prng.getSeed()` aan de `inputLog` toegevoegd.

## `>tiebreak`

Start de tiebreak-logica.

```txt
>tiebreak
```

Intern:

```ts
battle.tiebreak()
```

## `>chat`

Voegt chat toe aan battle log en input log.

```txt
>chat Player 1|hello
```

Intern:

```ts
battle.inputLog.push(...)
battle.add("chat", message)
```

## `>chat-inputlogonly`

Voegt chat alleen toe aan de input log, niet aan de zichtbare battle log.

```txt
>chat-inputlogonly Player 1|hidden log note
```

## `>eval`

Voert JavaScript uit binnen de context van de battle.

```txt
>eval battle.turn
```

Beschikbare helpers binnen de eval-context:

- `battle`
- `p1`, `p2`, `p3`, `p4`
- `p1active`, `p2active`, `p3active`, `p4active`
- `toID`
- `player(input)`
- `pokemon(side, input)`

Gebruik dit niet in een publieke API. Dit is extreem gevaarlijk als gebruikers zelf input kunnen sturen. Het is bedoeld voor debug, tests en admin tooling.

## `>editbattle`

Past battle-state aan via debug-achtige commands.

Voorbeelden:

```txt
>editbattle hp p1, Pikachu, 50
>editbattle status p1, Pikachu, par
>editbattle pp p1, Pikachu, Thunderbolt, 5
>editbattle boost p1, Pikachu, spa, 2
>editbattle volatile p1, Pikachu, confusion
>editbattle weather raindance
>editbattle terrain electricterrain
```

Ook dit moet je niet blootstellen aan normale spelers.

Ondersteunde subcommands:

- `hp` of `h`
- `status` of `s`
- `pp`
- `boost` of `b`
- `volatile` of `v`
- `sidecondition` of `sc`
- `fieldcondition`, `pseudoweather` of `fc`
- `weather` of `w`
- `terrain` of `t`
- `reseed`

## `>requestlog`

Vraagt de input log op.

```txt
>requestlog
```

Output:

```txt
requesteddata
>start ...
>player ...
...
```

Dit is nuttig voor replays of debugging.

## `>requestexport`

Vraagt seed plus input log op.

```txt
>requestexport
```

Output:

```txt
requesteddata
<prngSeed>
>start ...
>player ...
...
```

## `>requestteam`

Vraagt het packed team van een speler op.

```txt
>requestteam p1
```

Output:

```txt
requesteddata
<packed team>
```

## `>show-openteamsheets`

Laat open team sheets zien via de battle engine.

```txt
>show-openteamsheets
```

Intern:

```ts
battle.showOpenTeamSheets()
```

## `>version` en `>version-origin`

Deze commands worden geaccepteerd maar doen niets in `BattleStream`.

## Output Messages

`BattleStream` pusht messages in deze vorm:

```txt
type
data
```

Voorbeelden van types:

- `update`
- `sideupdate`
- `end`
- `requesteddata`

## `update`

Algemene battle output. Dit bevat battle protocol regels zoals:

```txt
|start
|turn|1
|move|p1a: Pikachu|Thunderbolt|p2a: Bulbasaur
```

`update` kan hidden/private informatie bevatten als je de omniscient stream leest.

## `sideupdate`

Player-specifieke output, vaak requests.

Voorbeeld:

```txt
sideupdate
p1
|request|{...}
```

`getPlayerStreams` routeert deze automatisch naar `streams.p1`.

## `end`

Wordt gebruikt wanneer de battle klaar is. Zonder `keepAlive` sluit de stream daarna.

## `requesteddata`

Output voor commands zoals:

- `>requestlog`
- `>requestexport`
- `>requestteam`

## getPlayerStreams

```ts
export function getPlayerStreams(stream: BattleStream)
```

Deze helper splitst een enkele `BattleStream` in meerdere handige streams:

```ts
const streams = getPlayerStreams(new BattleStream());
```

Je krijgt:

```ts
{
  omniscient,
  spectator,
  p1,
  p2,
  p3,
  p4
}
```

### `omniscient`

Read/write stream met volledige battle-informatie.

Gebruik dit voor je server, debugging, replay-opslag of interne state-tracking.

Schrijven naar `omniscient` gaat direct naar de onderliggende `BattleStream`.

```ts
void streams.omniscient.write(">start {...}");
```

### `spectator`

Read-only stream met spectator-safe output.

Gebruik dit als je clients laat meekijken zonder private player informatie.

### `p1`, `p2`, `p3`, `p4`

Read/write player streams.

Lezen geeft alleen informatie die die speler mag zien.

Schrijven prefix automatisch de juiste speler:

```ts
void streams.p1.write("move 1");
```

wordt:

```txt
>p1 move 1
```

## Channel Splitting

Pokemon Showdown battle logs kunnen private informatie bevatten met split messages. `getPlayerStreams` gebruikt `extractChannelMessages` uit `battle.ts` om die output te splitsen.

Kanalen:

- `-1`: omniscient
- `0`: spectator
- `1`: p1
- `2`: p2
- `3`: p3
- `4`: p4

Daarom is het veiliger om player clients niet de omniscient stream te geven.

## BattlePlayer

```ts
export abstract class BattlePlayer
```

`BattlePlayer` is een basisclass voor bots of AI-spelers.

Constructor:

```ts
new BattlePlayer(playerStream, debug?)
```

Belangrijke methods:

### `start()`

Luistert continu naar de player stream.

```ts
await player.start();
```

Voor elke ontvangen chunk roept hij `receive(chunk)` aan.

### `receive(chunk)`

Splitst een chunk in regels en roept per regel `receiveLine(line)` aan.

### `receiveLine(line)`

Verwerkt een battle protocol regel.

- Regels zonder `|` worden genegeerd.
- `|request|...` wordt geparsed als JSON en doorgegeven aan `receiveRequest`.
- `|error|...` wordt doorgegeven aan `receiveError`.
- Andere regels worden opgeslagen in `this.log`.

### `receiveRequest(request)`

Abstract method. Je moet deze implementeren in een subclass.

Voorbeeld:

```ts
class MyPlayer extends BattlePlayer {
  receiveRequest(request) {
    if (request.wait) return;
    this.choose("move 1");
  }
}
```

### `receiveError(error)`

Standaard gooit deze de error.

### `choose(choice)`

Schrijft een keuze naar de player stream.

```ts
this.choose("move 1");
```

## BattleTextStream

```ts
export class BattleTextStream extends Streams.ReadWriteStream
```

`BattleTextStream` is een tekst-stream wrapper rond `BattleStream`.

Gebruik dit als je met gewone tekststream input/output wilt werken in plaats van object chunks.

Constructor:

```ts
new BattleTextStream({ debug?: boolean })
```

Intern maakt hij:

```ts
this.battleStream = new BattleStream(options);
```

### `_write(message)`

Verzamelt tekst tot er een newline is. Daarna stuurt hij complete regels naar `battleStream.write`.

Dit is handig voor CLI-achtige input.

### `_listen()`

Luistert naar de interne `BattleStream` en pusht output als tekst.

### `_writeEnd()`

Sluit de interne `BattleStream`.

## Stream Lifecycle

1. Maak `BattleStream`.
2. Maak eventueel player streams met `getPlayerStreams`.
3. Schrijf `>start`.
4. Schrijf `>player p1`.
5. Schrijf `>player p2`.
6. Lees `|request|...` uit player streams.
7. Schrijf keuzes zoals `move 1` of `switch 2`.
8. Herhaal tot de battle eindigt.
9. Bewaar eventueel `requestlog` of `requestexport`.

## API-Architectuur Voor Je Eigen Game

Een praktische aanpak:

```ts
const battles = new Map();

function createBattle({ formatid, p1Team, p2Team }) {
  const battleStream = new BattleStream();
  const streams = getPlayerStreams(battleStream);
  const battleId = crypto.randomUUID();

  battles.set(battleId, {
    battleStream,
    streams,
    log: [],
    ended: false,
  });

  void (async () => {
    for await (const chunk of streams.omniscient) {
      battles.get(battleId)?.log.push(chunk);
    }
  })();

  void streams.omniscient.write(`>start ${JSON.stringify({ formatid })}
>player p1 ${JSON.stringify({ name: "Player 1", team: p1Team })}
>player p2 ${JSON.stringify({ name: "Player 2", team: p2Team })}`);

  return battleId;
}
```

Voor keuzes:

```ts
function choose(battleId, player, choice) {
  const battle = battles.get(battleId);
  if (!battle) throw new Error("Battle not found");

  return battle.streams[player].write(choice);
}
```

Voorbeeld:

```ts
await choose(battleId, "p1", "move 1");
await choose(battleId, "p2", "move 1");
```

## Belangrijke Veiligheidsregels

Geef normale spelers nooit toegang tot:

- `streams.omniscient`
- `>eval`
- `>editbattle`
- `>forcewin`
- `>forcelose`
- `>forcetie`
- `>requestteam`
- `>requestexport`

Gebruik voor clients:

- `streams.p1` voor player 1
- `streams.p2` voor player 2
- `streams.spectator` voor toeschouwers

Laat je API zelf bepalen welke speler welke stream mag gebruiken.

## Direct Battle Versus BattleStream

Je kunt ook direct `new Battle(options)` gebruiken uit `battle.ts`, maar dan moet je zelf meer interne engine-logica beheren.

`BattleStream` is meestal beter voor een API omdat:

- het het bestaande Showdown command protocol gebruikt
- player-specific output al gesplitst kan worden
- choices via tekstcommands werken
- replay/input logs makkelijker zijn
- bots en voorbeelden in Showdown hetzelfde patroon gebruiken

Gebruik direct `Battle` alleen als je bewust een eigen engine-wrapper bouwt en geen Showdown stream protocol wilt.

## Korte Samenvatting

Voor jouw eigen game-server is dit de kern:

```ts
const battleStream = new BattleStream();
const streams = getPlayerStreams(battleStream);

void streams.omniscient.write(`>start ${JSON.stringify({ formatid: "gen9customgame" })}
>player p1 ${JSON.stringify({ name: "Player 1", team: p1Team })}
>player p2 ${JSON.stringify({ name: "Player 2", team: p2Team })}`);

void streams.p1.write("move 1");
void streams.p2.write("move 1");
```

Alles draait om:

- `>start` maakt intern de echte `Battle`
- `>player` voegt sides/spelers toe
- `>p1`, `>p2` sturen keuzes
- player streams geven veilige, speler-specifieke output
- omniscient stream is alleen voor je server
