import { describe, it, expect } from 'vitest'
import { getBadge, getBadgeName, getBadgesByAddress, splitBadgeName } from './index';

import 'dotenv/config'
const { Badge_Owner, Badge_Name } = process.env

it('getBadgeName', async () => {
    expect(() => getBadgeName("xx-0", 0)).to.throw("Incorrect symbol")
    expect(getBadgeName("xx-", 0)).to.be.equal("xx-")
    expect(getBadgeName("xx-", 1)).to.be.equal("xx--1")
    expect(getBadgeName("xx", 0)).to.be.equal("xx")
    expect(getBadgeName("xx", 1)).to.be.equal("xx-1")
})

it('splitBadgeName', async () => {
    expect(() => splitBadgeName("xx-0-0")).to.throw("Incorrect symbol")
    expect(() => splitBadgeName("xx--0")).to.throw("Incorrect badgeName")
    expect(splitBadgeName("xx-")).to.be.deep.equal({ symbol: "xx-", index: 0 })
    expect(splitBadgeName("xx--1")).to.be.deep.equal({ symbol: "xx-", index: 1 })
    expect(splitBadgeName("xx-1")).to.be.deep.equal({ symbol: "xx", index: 1 })
})

it('getBadgesByAddress', async () => {
    const data = await getBadgesByAddress(Badge_Owner)
    console.log(data)
})

it('getBadge', async () => {
    const data = await getBadge(Badge_Name)
    console.log(data)
})