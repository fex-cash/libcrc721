# libcrc721
A Javascript library supports crc20 queries and crc721 badge queries.

## Install
```sh
npm install libcrc721
```
or
```sh
yarn add libcrc721
```
## Data Formats

`Badge`
```ts
export interface Badge {
  tokenId: string
  index: number
  owner: string
  badgeName: string
  info: {
    evmaddr?: string
    ipadd?: string
    social?: string
    email?: string
    remark?: string
  }
}
```

`CRC20Token`
```ts
export interface CRC20Token {
    symbol: string
    category: string
    name: string
    decimals: number
    mintAmt: number,
    totalSupply: number
    isCanonical: boolean
    type: "CRC20"
}
```

`CRC721Token`
```ts
export type CRC721Token = CRC20Token & {
    authorAddress: string
    baseTokenURI: string
    mintPrice: number
    feeCategory: string
    type: "CRC721"
}
```


## Examples

`async function addressToBadgeName(address: string): Promise<string>`
```ts
import { addressToBadgeName } from 'libcrc721';
const result = await addressToBadgeName("bitcoincash:qqeht8vnwag20yv8dvtcrd4ujx09fwxwsqqqw93w88")
console.log(result)
```

`async function badgeNameToAddress(badgeName: string): Promise<string>`
```ts
import { badgeNameToAddress } from 'libcrc721';
const result = await badgeNameToAddress("xx-1")
console.log(result)
```

`async function getTokensBySymbol(symbol: string): Promise<Array<CRC20Token | CRC721Token>> `
```ts
import { getTokensBySymbol } from 'libcrc721';
const result = await getTokensBySymbol("TEST")
console.log(result)
```

`async function getTokenByCategory(category: string): Promise<CRC20Token | CRC721Token>`
```ts
import { getTokenByCategory } from 'libcrc721';
const result = await getTokenByCategory("548327f45d8ea815c32e3b60cc3ea8ad2120132ddf407420865502e1dd9ab161")
console.log(result)
```

`async function getBadgesByAddress(owner: string): Promise<Badge[]>`
```ts
import { getBadgesByAddress } from 'libcrc721';
const result = await getBadgesByAddress("bitcoincash:qqeht8vnwag20yv8dvtcrd4ujx09fwxwsqqqw93w88")
console.log(result)
```

`async function getBadge(badgeName: string): Promise<Badge>`
```ts
import { getBadge } from 'libcrc721';
const result = await getBadge("xx-1")
console.log(result)
```

`function getBadgeName(symbol: string, index: number): string`
```ts
import { getBadgeName } from 'libcrc721';
console.log(getBadgeName("xx", 0)) // xx
console.log(getBadgeName("xx", 1)) // xx-1
```

`function splitBadgeName(badgeName: string): {string, number}`
```ts
import { splitBadgeName } from 'libcrc721';
console.log(splitBadgeName("xx")) // {symbol:"xx",index:0}
console.log(getBadgeName("xx-1")) // {symbol:"xx",index:1}
```


## Configs

#### Using customized Electrum URL
```ts
import { Connection } from "mainnet-js";
import { config } from 'libcrc721';
const conn = new Connection(
  "mainnet",
  "wss://bch.imaginary.cash:50004" 
)
config.connection = conn
```

#### Using Testnet
Note: The fetcher must be customized when using testnet.
```ts
import { Network } from "mainnet-js";
import { config } from 'libcrc721';
config.network = Network.TESTNET
```

## Fetcher
The default fetcher implements an interface to locate transaction ID by token category and commitment,
which using [Chaingraph](https://chaingraph.cash/).

#### Modify Chaingraph URL
```ts
import { mainnetChaingrapFetcher } from 'libcrc721';
mainnetChaingrapFetcher.defaultChaingraphUrl = "https://demo.chaingraph.cash/v1/graphql"
```

#### Customized Fetcher
Users can query the transaction ID using their own API.
```ts
import { config,Fetcher } from 'libcrc721';
const fetcher:Fetcher = {
    getTxId(tokenCategory: string, commitment: string){
        return fetch(<CUSTOMER_API_URL>)
    }
}
config.fetcher = fetcher
```