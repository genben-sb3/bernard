import { describe, expect, it } from 'vitest'
import { sammelauftraege } from './besorgen'

describe('sammelauftraege', () => {
  it('macht aus fehlenden Stämmen jeder Sorte einen Auftrag „Holz“', () => {
    expect(sammelauftraege([['cherry_log', 2], ['oak_log', 1]])).toEqual({ auftraege: [{ material: 'holz', menge: 3 }], unsammelbar: [] })
  })

  it('kennt Bruchstein, Erde und Sand', () => {
    expect(sammelauftraege([['cobblestone', 3], ['dirt', 1], ['sand', 4]]).auftraege).toEqual([
      { material: 'stein', menge: 3 }, { material: 'erde', menge: 1 }, { material: 'sand', menge: 4 },
    ])
  })

  it('meldet, was Bernard nicht sammeln kann', () => {
    expect(sammelauftraege([['coal', 2], ['oak_log', 1]])).toEqual({
      auftraege: [{ material: 'holz', menge: 1 }], unsammelbar: [['coal', 2]],
    })
  })
})
