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
    ipaddr?: string
    social?: string
    email?: string
    remark?: string
  }
}
```

`BaseCRC20Token`
```ts
export interface BaseCRC20Token {
  symbol: string
  category: string
  name: string
  decimals: number
  mintAmt: number
  totalSupply: number
  isCanonical: boolean
  revealHeight: number
  revealTxid: string
}
```

`CRC20Token`
```ts
export interface CRC20Token extends BaseCRC20Token {
    type: "CRC20"
}
```

`CRC721Token`
```ts
export interface CRC721Token extends BaseCRC20Token {
    authorAddress: string
    baseTokenURI: string
    mintPrice: number
    feeCategory: string
    type: "CRC721"
}
```

`CRCToken`
```ts
export type CRCToken = CRC20Token | CRC721Token
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
import { config } from 'libcrc721';
config.defaultElectrumClientUrl =  "wss://bch.imaginary.cash:50004"
```

#### Using Testnet
Note: The badgeTxQuerier must be customized when using testnet.
```ts
import { config } from 'libcrc721';
config.network = "testnet"
```

## BadgeTxQuerier
The default badgeTxQuerier implements an interface to locate transaction ID by token category and commitment,
which using [Chaingraph](https://chaingraph.cash/).

#### Modify Chaingraph URL
```ts
import { mainnetChaingrapBadgeTxQuerier } from 'libcrc721';
mainnetChaingrapBadgeTxQuerier.defaultChaingraphUrl = "https://demo.chaingraph.cash/v1/graphql"
```

#### Customized BadgeTxQuerier
Users can query the transaction ID using their own API.
```ts
import { config,BadgeTxQuerier } from 'libcrc721';
const badgeTxQuerier:BadgeTxQuerier = {
  getTxId(tokenCategory: string, commitment: string){
    return fetch(<CUSTOMER_API_URL>)
  }
}
config.badgeTxQuerier = badgeTxQuerier
```