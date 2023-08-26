import { lockingBytecodeToCashAddress, CashAddressNetworkPrefix } from '@bitauth/libauth';
import { getWallet } from "./config"
import { NetworkType } from 'mainnet-js';

export async function getSinger(txId: string) {
  const Wallet = getWallet()
  const provider = Wallet.prototype.getNetworkProvider()
  const tx = await provider.getRawTransactionObject(txId)
  const preTx = await provider.getRawTransactionObject(tx.vin[0].txid)
  const lockCode = preTx.vout.find((x: any) => x.scriptPubKey.type === "pubkeyhash").scriptPubKey.hex
  const singer = lockingBytecodeToCashAddress(Buffer.from(lockCode, "hex"), provider.network === NetworkType.Testnet ? CashAddressNetworkPrefix.testnet : CashAddressNetworkPrefix.mainnet)
  return singer
}