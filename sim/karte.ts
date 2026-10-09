// Zeichnet eine Draufsicht der Welt mit den Wegen und Positionen der Spieler als PNG.
import { createCanvas } from 'canvas'
import { writeFileSync } from 'node:fs'
import type { Bot } from 'mineflayer'
import { Vec3 } from 'vec3'
import type { Abbau, Probe } from './protokoll'

const FARBEN: Record<string, string> = {
  grass_block: '#6a9f3e',
  dirt: '#8a6142',
  stone: '#8c8c8c',
  stone_bricks: '#6f6f6f',
  cobblestone: '#7a7a7a',
  water: '#3a6fd1',
  lava: '#e5631c',
  sand: '#dccf98',
  oak_log: '#6b5131',
  oak_leaves: '#3c7a2a',
  oak_planks: '#a88754',
  birch_log: '#d8d3c4',
  birch_leaves: '#6c9a3e',
  spruce_log: '#4a3721',
  spruce_leaves: '#3d5e3d',
  short_grass: '#6a9f3e',
  bedrock: '#333333',
}
const UNBEKANNT = '#c76bc7'

export const SPIELERFARBEN: Record<string, string> = {
  Bernard: '#2f6fe4',
  Ben: '#1fa34a',
  Fremder: '#d6332f',
}

const PIXEL_PRO_BLOCK = 14

type Bereich = { minX: number; maxX: number; minZ: number; maxZ: number }

export function zeichneKarte(optionen: {
  welt: Bot
  proben: Probe[]
  titel: string
  datei: string
  bereich?: Bereich
  abgebaut?: Abbau[]
}) {
  const bereich = optionen.bereich ?? bereichAus(optionen.proben)
  const breite = (bereich.maxX - bereich.minX + 1) * PIXEL_PRO_BLOCK
  const hoehe = (bereich.maxZ - bereich.minZ + 1) * PIXEL_PRO_BLOCK
  const kopf = 34
  const canvas = createCanvas(breite, hoehe + kopf)
  const g = canvas.getContext('2d')

  // Blöcke: jeweils der oberste nicht-leere Block der Säule; höhere Blöcke heller
  for (let x = bereich.minX; x <= bereich.maxX; x++) {
    for (let z = bereich.minZ; z <= bereich.maxZ; z++) {
      const oben = obersterBlock(optionen.welt, x, z)
      const px = (x - bereich.minX) * PIXEL_PRO_BLOCK
      const pz = (z - bereich.minZ) * PIXEL_PRO_BLOCK + kopf
      g.fillStyle = oben ? (FARBEN[oben.name] ?? UNBEKANNT) : '#000000'
      g.fillRect(px, pz, PIXEL_PRO_BLOCK, PIXEL_PRO_BLOCK)
      if (oben && oben.y > -61) {
        g.fillStyle = `rgba(255,255,255,${Math.min(0.15 * (oben.y + 61), 0.45)})`
        g.fillRect(px, pz, PIXEL_PRO_BLOCK, PIXEL_PRO_BLOCK)
        g.strokeStyle = 'rgba(0,0,0,0.35)'
        g.strokeRect(px + 0.5, pz + 0.5, PIXEL_PRO_BLOCK - 1, PIXEL_PRO_BLOCK - 1)
      }
    }
  }

  // Gitter alle 5 Blöcke mit Koordinaten
  g.strokeStyle = 'rgba(0,0,0,0.15)'
  g.fillStyle = 'rgba(0,0,0,0.55)'
  g.font = '10px sans-serif'
  for (let x = Math.ceil(bereich.minX / 5) * 5; x <= bereich.maxX; x += 5) {
    const px = (x - bereich.minX) * PIXEL_PRO_BLOCK
    g.beginPath(); g.moveTo(px, kopf); g.lineTo(px, hoehe + kopf); g.stroke()
    g.fillText(`x${x}`, px + 2, kopf + 10)
  }
  for (let z = Math.ceil(bereich.minZ / 5) * 5; z <= bereich.maxZ; z += 5) {
    const pz = (z - bereich.minZ) * PIXEL_PRO_BLOCK + kopf
    g.beginPath(); g.moveTo(0, pz); g.lineTo(breite, pz); g.stroke()
    g.fillText(`z${z}`, 2, pz - 2)
  }

  const zuPixel = (x: number, z: number) => [
    (x - bereich.minX) * PIXEL_PRO_BLOCK,
    (z - bereich.minZ) * PIXEL_PRO_BLOCK + kopf,
  ] as const

  // Abgebaute Blöcke als Kreuz
  g.strokeStyle = '#111111'
  g.lineWidth = 2
  for (const a of optionen.abgebaut ?? []) {
    const [px, pz] = zuPixel(a.position.x, a.position.z)
    const r = PIXEL_PRO_BLOCK / 2 - 2
    g.beginPath()
    g.moveTo(px + 2, pz + 2); g.lineTo(px + 2 + 2 * r, pz + 2 + 2 * r)
    g.moveTo(px + 2 + 2 * r, pz + 2); g.lineTo(px + 2, pz + 2 + 2 * r)
    g.stroke()
  }

  // Wege
  for (const [name, farbe] of Object.entries(SPIELERFARBEN)) {
    const weg = optionen.proben.flatMap(p => (p.positionen[name] ? [p.positionen[name]] : []))
    if (weg.length < 2) continue
    g.strokeStyle = farbe
    g.globalAlpha = 0.8
    g.lineWidth = 3
    g.beginPath()
    weg.forEach((pos, i) => {
      const [px, pz] = zuPixel(pos.x, pos.z)
      if (i === 0) g.moveTo(px, pz)
      else g.lineTo(px, pz)
    })
    g.stroke()
    g.globalAlpha = 1
  }

  // Letzte Positionen als Punkte mit Namen
  const letzte = optionen.proben.at(-1)
  for (const [name, pos] of Object.entries(letzte?.positionen ?? {})) {
    const [px, pz] = zuPixel(pos.x, pos.z)
    g.fillStyle = SPIELERFARBEN[name] ?? '#ffffff'
    g.strokeStyle = '#ffffff'
    g.lineWidth = 2
    g.beginPath(); g.arc(px, pz, 7, 0, Math.PI * 2); g.fill(); g.stroke()
    g.font = 'bold 13px sans-serif'
    g.lineWidth = 3
    g.strokeStyle = 'rgba(0,0,0,0.8)'
    g.strokeText(name, px + 10, pz + 4)
    g.fillStyle = '#ffffff'
    g.fillText(name, px + 10, pz + 4)
  }

  // Kopfzeile
  g.fillStyle = '#1d1f24'
  g.fillRect(0, 0, breite, kopf)
  g.fillStyle = '#ffffff'
  g.font = 'bold 15px sans-serif'
  g.fillText(optionen.titel, 10, 22)
  g.font = '12px sans-serif'
  let lx = breite - 10
  for (const [name, farbe] of Object.entries(SPIELERFARBEN).reverse()) {
    const w = g.measureText(name).width
    lx -= w
    g.fillStyle = '#ffffff'
    g.fillText(name, lx, 21)
    lx -= 16
    g.fillStyle = farbe
    g.fillRect(lx, 11, 11, 11)
    lx -= 14
  }

  writeFileSync(optionen.datei, canvas.toBuffer('image/png'))
}

function obersterBlock(welt: Bot, x: number, z: number) {
  for (let y = -50; y >= -64; y--) {
    const block = welt.blockAt(new Vec3(x, y, z))
    if (block && block.name !== 'air' && block.name !== 'cave_air' && block.name !== 'void_air') {
      return { name: block.name, y }
    }
  }
  return null
}

function bereichAus(proben: Probe[]): Bereich {
  const alle = proben.flatMap(p => Object.values(p.positionen))
  const xs = alle.map(p => p.x)
  const zs = alle.map(p => p.z)
  const rand = 5
  return {
    minX: Math.floor(Math.min(...xs)) - rand,
    maxX: Math.ceil(Math.max(...xs)) + rand,
    minZ: Math.floor(Math.min(...zs)) - rand,
    maxZ: Math.ceil(Math.max(...zs)) + rand,
  }
}
