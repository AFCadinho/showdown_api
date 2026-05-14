# Pokemon Showdown Modules

This is a practical API reference for the modules you are most likely to use from this workspace.

The focus is:
- what a module is for
- which methods matter most
- how the simulator pieces fit together

It is not a full per-file encyclopedia of all 979 files in `pokemon-showdown`.

## Main API Surface

These are the most useful entry points for this project:
- `pokemon-showdown/dist/sim/index.js`
- `pokemon-showdown/dist/sim/teams.js`
- `pokemon-showdown/dist/sim/dex.js`
- `pokemon-showdown/dist/sim/team-validator.js`
- `pokemon-showdown/dist/sim/battle-stream.js`

## `sim/index.js`

This is the simulator public entry point.

Exports:
- `Battle`
- `BattleStream`
- `getPlayerStreams`
- `Pokemon`
- `PRNG`
- `Side`
- `Dex`
- `toID`
- `Teams`
- `TeamValidator`
- the shared `lib` helpers

Use this when you want a single import that exposes the simulator API.

## `sim/teams.js`

Purpose:
- convert between team formats
- generate random teams
- export teams in human-readable form

Key methods:
- `Teams.pack(team)` - turns a team array into Pokemon Showdown packed format
- `Teams.unpack(buf)` - turns packed format back into a team array
- `Teams.import(buffer, aggressive?)` - accepts JSON, packed format, or exported team text
- `Teams.export(team, options?)` - exports a team in readable PS format
- `Teams.exportSet(set, options?)` - exports one set
- `Teams.parseExportedTeamLine(...)` - internal line parser for export format
- `Teams.getGenerator(format, seed?)` - returns the format-specific team generator
- `Teams.getTeam(format, options?)` - generates a team

What to remember:
- `import()` is the safest “accept almost anything” method
- `pack()` and `unpack()` are for compact storage/transmission
- `export()` is for user-facing text

## `sim/dex.js`

Purpose:
- access battle data like species, moves, items, abilities, types, formats
- normalize names and IDs
- provide shared rules and lookups for the simulator and validator

Key methods:
- `Dex.mod(mod)` - get a modded Dex
- `Dex.forGen(gen)` - get the Dex for a generation
- `Dex.forFormat(format)` - get the Dex for a specific format
- `Dex.getName(name)` - sanitize a nickname or username
- `Dex.getImmunity(source, target)` - check type/status immunity
- `Dex.getEffectiveness(source, target)` - calculate type matchup
- `Dex.getActiveMove(move)` - clone a move into an active battle move
- `Dex.getHiddenPower(ivs)` - compute Hidden Power type/power
- `Dex.includeMods()` - preload available mods
- `Dex.includeData()` - preload base data
- `Dex.loadAliases()` - load name aliases
- `Dex.loadData()` - load core data tables
- `Dex.loadTextData()` - load description text tables

Useful mental model:
- `Dex` is the data backbone
- `Dex.formats`, `Dex.moves`, `Dex.items`, `Dex.species`, and `Dex.abilities` are the lookup facades

## `sim/team-validator.js`

Purpose:
- validate teams against a format
- enforce legality, team size, item rules, move rules, and source rules

Key methods:
- `validateTeam(team, options?)` - main team validation entry point
- `baseValidateTeam(team, options?)` - default validation flow when a format does not override it
- `validateSet(set, teamHas)` - validate one Pokemon set
- `getValidationSpecies(set)` - resolve the species used for validation

Typical usage:
- create a validator with `new TeamValidator(format, dex)`
- call `validateTeam(team)` before accepting a user team

## `sim/battle-stream.js`

Purpose:
- stream-based battle control
- send battle commands and receive battle updates
- useful for bot integrations and programmatic battle handling

Key methods:
- `constructor(options)` - create a stream with debug, replay, and keep-alive options
- `_write(chunk)` - handle incoming stream data
- `_writeLines(chunk)` - split incoming text into protocol lines
- `_writeLine(type, message)` - process one battle command
- `pushMessage(type, data)` - send a message back out
- `editbattle(target)` - edit battle state through the stream interface

Common commands it handles:
- `start`
- `player`
- `p1`, `p2`, `p3`, `p4`
- `forcewin`, `forcetie`, `forcelose`
- `reseed`
- `chat`
- `eval`
- `requestteam`

## Other Simulator Modules

These matter if you go deeper into battle mechanics:
- `battle.js` - battle engine core
- `battle-actions.js` - action resolution
- `battle-queue.js` - turn order and priority queue
- `field.js` - battlefield state, weather, terrain
- `pokemon.js` - in-battle Pokemon state
- `side.js` - one side of a battle
- `state.js` - battle state handling
- `prng.js` - random number generation
- `dex-abilities.js` - ability lookup
- `dex-conditions.js` - condition lookup
- `dex-formats.js` - format lookup
- `dex-items.js` - item lookup
- `dex-moves.js` - move lookup
- `dex-species.js` - species lookup
- `dex-data.js` - shared Dex data access

## Data Modules

The `data` layer contains the raw battle data that `Dex` reads.

Core files:
- `abilities.js`
- `aliases.js`
- `conditions.js`
- `formats-data.js`
- `items.js`
- `learnsets.js`
- `moves.js`
- `natures.js`
- `pokedex.js`
- `pokemongo.js`
- `rulesets.js`
- `scripts.js`
- `tags.js`
- `typechart.js`

These are important because:
- `pokedex`, `moves`, `items`, `abilities`, and `typechart` feed battle mechanics
- `learnsets` and `rulesets` feed validation
- `scripts` and `conditions` drive special battle behavior

## Lib Modules

Shared infrastructure used by the server and simulator:
- `crashlogger.js` - crash reporting
- `dashycode.js` - encoding helpers
- `database.js` - database access
- `fs.js` - file utilities
- `net.js` - network helpers
- `process-manager.js` - process utilities
- `repl.js` - REPL support
- `sql.js` - SQL helper layer
- `static-server.js` - static serving
- `streams.js` - stream abstractions
- `utils.js` - general utility helpers

## Server Modules

The `server` folder is the full Pokemon Showdown server implementation.

Key files:
- `index.js` - main server bootstrap
- `chat.js` - chat system
- `rooms.js` - room management
- `users.js` - user state
- `sockets.js` - socket handling
- `ladders.js` - ladder integration
- `punishments.js` - moderation and punishments
- `replays.js` - replay storage
- `room-battle.js` - battle room logic
- `team-validator-async.js` - async validation

Subfolders:
- `chat-commands/`
- `chat-plugins/`
- `modlog/`
- `private-messages/`
- `tournaments/`
- `artemis/`

## Practical Path For Your API

If your goal is just to build on top of Pokemon Showdown from this repo:

1. `Teams.import()` to accept teams
2. `TeamValidator.validateTeam()` to check legality
3. `Teams.export()` or `Teams.pack()` to return data
4. `Dex.forFormat()` and `Dex.forGen()` when format-specific lookup matters
5. `BattleStream` only if you want to simulate battles through the stream protocol

## Notes

- `pokemon-showdown/dist` is compiled runtime code
- `pokemon-showdown/sim`, `pokemon-showdown/server`, and `pokemon-showdown/data` are the source side of the same system
- If you want, I can turn this into a deeper folder-by-folder reference next, starting with `sim/`
