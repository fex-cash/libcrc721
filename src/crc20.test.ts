import { getTokensBySymbol, getTokenByCategory } from "./index";
import { describe, it, expect } from 'vitest'

const TEST123 = {
    symbol: 'TEST123',
    category: '548327f45d8ea815c32e3b60cc3ea8ad2120132ddf407420865502e1dd9ab161',
    name: 'test123',
    decimals: 8,
    mintAmt: 2000,
    revealTxid: '67dae50a85e445e95e44e2641b601b0888238ab2b5786d1838a6c73247873e29',
    totalSupply: '21000000',
    type: 'CRC20',
    isCanonical: true
}

it('getTokensBySymbol', async () => {
    expect(getTokensBySymbol("TEST123 ")).rejects.toThrow("Symbol should not contain spaces at the beginning and end")
    const data = await getTokensBySymbol("TEST123")
    expect(data[0]).to.be.deep.contains(TEST123)
}, 10 * 1000);

it('getTokenByCategory', async () => {
    const data = await getTokenByCategory("548327f45d8ea815c32e3b60cc3ea8ad2120132ddf407420865502e1dd9ab161")
    expect(data).to.be.deep.contains(TEST123)
}, 10 * 1000);