import { Badge } from './badge';
import { describe, it, expect } from 'vitest'
import { config, getBadge, getBadgeName, getBadgesByAddress, splitBadgeName } from './index';

const Badge_Owner = "bchtest:qrfe6qx0js6k6v7nrrrt7prsezmk79s3mygrjdd5xk"
const Badge_Name = "CRC721-1"
config.network = "testnet"

config.badgeTxQuerier = new class {
    async getTxId(category: string, commitment: string,) {
        return "d5b3db6509a51b1be4e31155c3d8c8c31f85763f377152c204896a284fb4f4a8" // just test
    }
}

it('getBadgeName', async () => {
    expect(() => getBadgeName("xx-0", 0)).to.throw("BadgeSymbol cannot match -[0-9]+$")
    expect(() => getBadgeName(" xx ", 0)).to.throw("Symbol should not contain spaces at the beginning and end")
    expect(getBadgeName("xx-", 0)).to.be.equal("xx-")
    expect(getBadgeName("xx-", 1)).to.be.equal("xx--1")
    expect(getBadgeName("xx", 0)).to.be.equal("xx")
    expect(getBadgeName("xx", 1)).to.be.equal("xx-1")
})

it('splitBadgeName', async () => {
    expect(() => splitBadgeName("xx-0-0")).to.throw("BadgeSymbol cannot match -[0-9]+$")
    expect(() => splitBadgeName("xx--0")).to.throw("Incorrect badgeName")
    expect(() => splitBadgeName("xx -0")).to.throw("Symbol should not contain spaces at the beginning and end")
    expect(splitBadgeName("xx-")).to.be.deep.equal({ symbol: "xx-", index: 0 })
    expect(splitBadgeName("xx--1")).to.be.deep.equal({ symbol: "xx-", index: 1 })
    expect(splitBadgeName("xx-1")).to.be.deep.equal({ symbol: "xx", index: 1 })
})


const badge = {
    tokenId: 'aa7626f9a3d47a15ebde9bfc180a830501bb778be064f519e6b671ca2fe0ae36',
    index: 1,
    info: {
        evmaddr: '0x1234',
        ipaddr: '0.0.0.0',
        social: 'test@test.com',
        email: 'test@test.com',
        remark: 'test'
    },
    badgeName: 'CRC721-1',
    owner: 'bchtest:qrfe6qx0js6k6v7nrrrt7prsezmk79s3mygrjdd5xk'
}

it('getBadgesByAddress', async () => {
    expect(await getBadgesByAddress("bchtest:pracl7c4cspgv2fuu4wjmf3n3l97nuytm5aga035zw")).to.be.deep.equal([])

    const data = await getBadgesByAddress(Badge_Owner)
    expect(data).to.be.deep.equal([badge])
}, 10000)

it('getBadge', async () => {
    expect(await getBadge("xxxxxfffassa")).to.be.deep.equal(null)

    const data = await getBadge(Badge_Name)
    expect(data).to.be.deep.equal(badge)
}, 10000)