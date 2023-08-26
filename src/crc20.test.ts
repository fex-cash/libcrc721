import { getTokensBySymbol, getTokenByCategory } from "./index";
import { describe, it, expect } from 'vitest'

it('getTokensBySymbol', async () => {
    const data = await getTokensBySymbol("TEST123")
    console.log(data)
}, 10 * 1000);

it('getTokenByCategory', async () => {
    const data = await getTokenByCategory("548327f45d8ea815c32e3b60cc3ea8ad2120132ddf407420865502e1dd9ab161")
    console.log(data)
}, 10 * 1000);