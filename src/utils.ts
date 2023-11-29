import { lockingBytecodeToCashAddress, CashAddressNetworkPrefix } from '@bitauth/libauth';
import { config } from "./config"
import { Buffer } from "buffer"
import { getElectrumClient } from './common/electrum';

export async function getSinger(txId: string, category: string, commitment: string) {
  const electrumClient = await getElectrumClient()
  const tx = await electrumClient.blockchain_transaction_get(txId, true)
  const preTx = await electrumClient.blockchain_transaction_get(tx.vin[0].txid, true)
  const vout = preTx.vout.find((x: any) => {
    const {tokenData } = x
    return tokenData?.category === category && tokenData?.nft?.commitment === commitment
  })
  const lockingBytecode = vout.scriptPubKey.hex
  const singer = lockingBytecodeToCashAddress(Buffer.from(lockingBytecode, "hex"), config.network === "testnet" ? CashAddressNetworkPrefix.testnet : CashAddressNetworkPrefix.mainnet)
  return singer
}