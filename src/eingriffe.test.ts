import { describe, expect, it } from 'vitest'
import type { Bot } from 'mineflayer'
import { Vec3 } from 'vec3'
import { erlaubeAbbauenNur, erlaubePlatzierenNur, warumNichtAbbauen, warumNichtPlatzieren } from './eingriffe'

const neuerBot = () => ({ blockAt: () => null }) as unknown as Bot

describe('Eingriffsregeln', () => {
  it('erlaubt ohne Regeln alles', () => {
    const bot = neuerBot()
    expect(warumNichtAbbauen(bot, new Vec3(0, 0, 0))).toBeNull()
    expect(warumNichtPlatzieren(bot, new Vec3(0, 0, 0))).toBeNull()
  })

  it('nennt den Grund der ersten Regel, die verbietet', () => {
    const bot = neuerBot()
    erlaubeAbbauenNur(bot, p => (p.x < 10 ? 'Basis ist geschützt' : null))
    erlaubeAbbauenNur(bot, () => 'zweite Regel')
    expect(warumNichtAbbauen(bot, new Vec3(5, 0, 0))).toBe('Basis ist geschützt')
    expect(warumNichtAbbauen(bot, new Vec3(20, 0, 0))).toBe('zweite Regel')
  })

  it('trennt Abbauen und Platzieren und hält Regeln je Bot auseinander', () => {
    const a = neuerBot()
    const b = neuerBot()
    erlaubePlatzierenNur(a, () => 'nicht hier')
    expect(warumNichtPlatzieren(a, new Vec3(0, 0, 0))).toBe('nicht hier')
    expect(warumNichtAbbauen(a, new Vec3(0, 0, 0))).toBeNull()
    expect(warumNichtPlatzieren(b, new Vec3(0, 0, 0))).toBeNull()
  })
})
