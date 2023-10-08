import { lockingBytecodeToCashAddress, CashAddressNetworkPrefix } from '@bitauth/libauth';
import { config } from "./config"
import { Buffer } from "buffer"
import { getElectrumClient } from './common/electrum';

export async function getSinger(txId: string) {
  const electrumClient = await getElectrumClient()
  const tx = await electrumClient.blockchain_transaction_get(txId, true)
  const preTx = await electrumClient.blockchain_transaction_get(tx.vin[0].txid, true)
  const lockCode = preTx.vout.find((x: any) => x.scriptPubKey.type === "pubkeyhash").scriptPubKey.hex
  const singer = lockingBytecodeToCashAddress(Buffer.from(lockCode, "hex"), config.network === "testnet" ? CashAddressNetworkPrefix.testnet : CashAddressNetworkPrefix.mainnet)
  return singer
}