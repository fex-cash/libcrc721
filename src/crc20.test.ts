import { getTokensBySymbol, getTokenByCategory } from "./index";
import { describe, it, expect } from 'vitest'

const TEST123 = {
    symbol: 'TEST123',
    category: '548327f45d8ea815c32e3b60cc3ea8ad2120132ddf407420865502e1dd9ab161',
    name: 'test123',
    decimals: 8,
    mintAmt: 2000,
    revealTxid: '67dae50a85e445e95e44e2641b601b0888238ab2b5786d1838a6c73247873e29',
    totalSupply: 21000000,
    type: 'CRC20',
    isCanonical: true
}

const bchsArr = [
    {
        symbol: 'bchs',
        category: '8fdec1eff9170a360767d394ded01ff4b06c33ab19e680981ba6f68f1a0ef38d',
        name: 'bchs',
        decimals: 8,
        mintAmt: 2100000000000000,
        revealHeight: 818788,
        revealTxid: '6ee8b944756d6d474ba25c2e5fe6e11f776f5fe9be63934c63c2758aafe786b4',
        totalSupply: 100000000000,
        type: 'CRC20',
        isCanonical: true
    },
    {
        symbol: 'bchs',
        category: '9585d6d656c0b05c880c2cfa37b7e7a9cd98d21f79eb9bacf3cfe329acf86a0d',
        name: 'bchs',
        decimals: 8,
        mintAmt: 2100000000000000,
        revealHeight: 818790,
        revealTxid: '2f4d7b5ee1c441cb39c312cf85b7a56b4d5324364d64fe97fc97d09793229349',
        totalSupply: 100000000000,
        type: 'CRC20',
        isCanonical: false
    }
]

const mitsuki = {
    symbol: 'mitsuki',
    category: 'b45cb528260e38c364a31ff2cd31b1254767dc4167b16ed6b859992466147058',
    name: 'mitsuki',
    decimals: 0,
    mintAmt: undefined,
    revealHeight: 808661,
    revealTxid: '53f26a673a8ed7bda9fb651baa17e278950bccd65e5014181d6ebc9e4c559384',
    totalSupply: 201,
    type: 'CRC721',
    baseTokenURI: 'ipfs://bafybeiff4pbozkssomme5ahbsa5bgd6kobhfup4jejlriieknhphsoq3ym/',
    feeCategory: '',
    authorAddress: 'bitcoincash:qphgnw7v233nh543y5eafkyez4pqxflzwqvylem809',
    mintPrice: 510000,
    isCanonical: true
}

it('getTokensBySymbol', async () => {
    expect(getTokensBySymbol("TEST123 ")).rejects.toThrow("Symbol should not contain spaces at the beginning and end")
    {
        const data = await getTokensBySymbol("TEST123")
        expect(data[0]).to.be.deep.contains(TEST123)
    }
    {
        const data = await getTokensBySymbol("bchs")
        expect(data[0]).to.be.deep.contains(bchsArr[0])
        expect(data[1]).to.be.deep.contains(bchsArr[1])
    }
    {
        const data = await getTokensBySymbol("mitsuki")
        expect(data[0]).to.be.deep.contains(mitsuki)
    }
}, 20 * 1000);

it('getTokenByCategory', async () => {
    {
        const data = await getTokenByCategory("548327f45d8ea815c32e3b60cc3ea8ad2120132ddf407420865502e1dd9ab161")
        expect(data).to.be.deep.contains(TEST123)
    }
    {
        for (const bchs of bchsArr) {
            const data = await getTokenByCategory(bchs.category)
            expect(data).to.be.deep.contains(bchs)
        }
    }
    {
        const data = await getTokenByCategory("b45cb528260e38c364a31ff2cd31b1254767dc4167b16ed6b859992466147058")
        expect(data).to.be.deep.contains(mitsuki)
    }
}, 20 * 1000);