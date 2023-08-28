import { decodeAuthenticationInstructions } from '@bitauth/libauth';
import { NftMinterContract } from './lib/NftMinter';
import { cashAddrToLock } from './common/common';
import { BadgeNftHolderContract } from './lib/BadgeNftHolder';
import { getBadgeTxQuerier, getWallet } from './config';
import { getSinger } from './utils';
import { checkSymbol, getTokenByCategory, getTokensBySymbol } from './crc20';

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

function _getBadgeName(symbol: string, index: number): string {
  return symbol + (index === 0 ? "" : `-${index}`)
}

function _splitBadgeName(badgeName: string): { symbol: string, index: number } {
  let symbol = badgeName, index = 0
  const index_index = badgeName.search("\-[0-9]+$")
  if (index_index !== -1) {
    symbol = badgeName.slice(0, index_index)
    index = Number(badgeName.slice(index_index + 1, badgeName.length))
  }
  return {
    symbol, index
  }
}

export function checkBadgeSymbol(symbol: string) {
  checkSymbol(symbol)
  if (symbol.search("\-[0-9]+$") >= 0) {
    throw new Error("BadgeSymbol cannot match \-[0-9]+$")
  }
}

export function checkBadgeName(badgeName: string) {
  if (badgeName !== badgeName.trim()) {
    throw new Error("BadgeName should not contain spaces at the beginning and end")
  }
  const { symbol, index } = _splitBadgeName(badgeName)
  checkBadgeSymbol(symbol)
  if (_getBadgeName(symbol, index) !== badgeName) {
    throw new Error("Incorrect badgeName")
  }
}



export function getBadgeName(symbol: string, index: number): string {
  checkBadgeSymbol(symbol)
  return _getBadgeName(symbol, index)
}

export function splitBadgeName(badgeName: string): { symbol: string, index: number } {
  checkBadgeName(badgeName)
  return _splitBadgeName(badgeName)
}


export async function getBadge(badgeName: string): Promise<Badge | null> {
  checkBadgeName(badgeName)
  const { symbol, index } = splitBadgeName(badgeName)
  const tokens = await getTokensBySymbol(symbol)
  const canonicalToken = tokens.find((x) => x.isCanonical)
  if (!canonicalToken) {
    return
  }
  const txId = await getBadgeTxQuerier().getTxId(canonicalToken.category, NftMinterContract.index2Commitment(index))
  if (!txId) {
    return
  }
  const singer: any = await getSinger(txId)
  const badges = await getBadgesByAddress(singer)
  return badges.find(x => x.badgeName === badgeName)
}

export async function getBadgesByAddress(owner: string): Promise<Badge[]> {
  const wallet = await getWallet().fromCashaddr(owner)
  const ownerLockingBytes = cashAddrToLock(wallet.getDepositAddress())
  const contract = new BadgeNftHolderContract(ownerLockingBytes, wallet.network)
  const utxos = await contract.contract.getUtxos()
  let result = await Promise.all(utxos.map(async utxo => {
    const singer = await getSinger(utxo.txid)
    if (singer !== owner) {
      return null
    }
    const tx = await (contract.contract as any).provider.mainnetProvider.getRawTransactionObject(utxo.txid)
    const info: any = {}
    tx.vout.filter((v: any) => v.scriptPubKey.asm.indexOf("OP_RETURN") === 0).forEach((output: any) => {
      const data: any = decodeAuthenticationInstructions(Buffer.from(output.scriptPubKey.hex, 'hex'))
      const key = Buffer.from(data[1].data, 'hex').toString()
      if (key === "evmaddr") {
        info[key] = `0x${Buffer.from(data[2].data, 'hex').toString("hex")}`
      } else {
        info[key] = Buffer.from(data[2].data, 'hex').toString()
      }
    })
    return { info, token: utxo.token }
  }))
  result = result.filter(x => x)
  const basgesResult = await Promise.all(result.map(async v => {
    const { token: { tokenId, commitment }, info } = v as any
    const index = NftMinterContract.commitment2Index(commitment)
    const { symbol, isCanonical } = (await getTokenByCategory(tokenId))!
    if (!isCanonical) {
      return null
    }
    return { tokenId, index, info, badgeName: getBadgeName(symbol, index), owner }
  }))
  return basgesResult.filter(v => v)
}