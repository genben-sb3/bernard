// Datentypen für das, was der Beobachter während eines Testlaufs sammelt.

export type Position = { x: number; y: number; z: number }

/** Momentaufnahme aller beobachteten Spielerpositionen. t = Millisekunden seit Laufbeginn. */
export type Probe = { t: number; phase: string; positionen: Record<string, Position> }

export type ChatZeile = { t: number; von: string; an?: string; text: string }

export type Ereignis = { t: number; text: string }

export type Pruefung = {
  phase: string
  name: string
  bestanden: boolean
  details: string
}

export type Bild = { datei: string; titel: string }

export type Bericht = {
  szenario: string
  beschreibung: string
  gestartet: string
  dauerSekunden: number
  bestanden: boolean
  pruefungen: Pruefung[]
  chat: ChatZeile[]
  ereignisse: Ereignis[]
  bilder: Bild[]
  proben: Probe[]
  abbruch?: string
}
