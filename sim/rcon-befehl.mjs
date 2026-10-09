// Schickt Server-Befehle per RCON an den Testserver und zeigt die Antworten.
// Aufruf: node sim/rcon-befehl.mjs "time set day" "list"
import { readFileSync } from 'node:fs'
import { Rcon } from 'rcon-client'

const passwort = readFileSync('server/server.properties', 'utf8').match(/^rcon\.password=(.*)$/m)?.[1] ?? ''
const rcon = await Rcon.connect({ host: 'localhost', port: 25575, password: passwort })
for (const befehl of process.argv.slice(2)) console.log('>', befehl, '\n ', await rcon.send(befehl))
await rcon.end()
