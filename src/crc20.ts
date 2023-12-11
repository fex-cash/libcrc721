import { decodeCashAddress, encodeCashAddress, hash160, vmNumberToBigInt, CashAddressNetworkPrefix } from '@bitauth/libauth'
import { CashAddressType } from "@bitauth/libauth/build/lib/address/cash-address";
import { disassembleBytecodeBCH } from "@bitauth/libauth/build/lib/vm/instruction-sets/common/instruction-sets-utils";
import { config } from './config';
import { getContractAddress } from './lib/contract';
import { Buffer } from "buffer"
import { getElectrumClient } from './common/electrum';

interface BaseCRC20Token {
    symbol: string
    category: string
    name: string
    decimals: number
    mintAmt: number
    totalSupply: number
    isCanonical: boolean | undefined
    revealHeight: number
    revealTxid: string
}

export interface CRC20Token extends BaseCRC20Token {
    type: "CRC20"
}

export interface CRC721Token extends BaseCRC20Token {
    authorAddress: string
    baseTokenURI: string
    mintPrice: number
    feeCategory: string
    type: "CRC721"
}

export type CRCToken = CRC20Token | CRC721Token

export function checkSymbol(symbol: string) {
    if (symbol !== symbol.trim()) {
        throw new Error("Symbol should not contain spaces at the beginning and end")
    }
}

async function getUtxosByAddress(address: any) {
    const electrumClient = await getElectrumClient()
    return await electrumClient.getAddressUtxos(address)
}

async function getTxByTxid(txid: string) {
    const electrumClient = await getElectrumClient()
    return await electrumClient.blockchain_transaction_get(txid, true)
}

async function getMetaInfoForSymbol(tx: any, symbol: string | undefined, checkSymbol: boolean = true, categoryWanted: any = undefined) {
    // console.log('getMetaInfoForSymbol, sym:', symbol, 'txd:', genesisTxId);

    let mintAmt; //released token amount for each mint
    if (tx.vout.length == 3
        && tx.vout[2].scriptPubKey?.type == 'nulldata'
        && tx.vout[2].scriptPubKey?.hex?.length == 20
        && tx.vout[2].scriptPubKey?.hex.startsWith('6a08')) {
        mintAmt = Number('0x' + tx.vout[2].scriptPubKey.hex.substr(4));
    }

    for (let i in tx.vout) {
        let vout = tx.vout[i]
        let tokenData = vout.tokenData
        if (tokenData !== undefined) {
            let category = tokenData.category
            if (!checkSymbol && category != categoryWanted) {
                continue
            }
            for (let j in tx.vin) {
                let vin = tx.vin[j]
                // if we find the genesis input for this token category
                if (category === vin.txid && vin.vout === 0) {
                    // vin[j] spends a genesis output
                    const electrumClient = await getElectrumClient()
                    const [commitTx, { height }] = await Promise.all([
                        getTxByTxid(vin.txid),
                        electrumClient.request("blockchain.headers.get_tip", [])
                    ])
                    const result = getMetaInfoFromGenesisOutput(commitTx.vout[0].scriptPubKey.type, commitTx.vout[0].scriptPubKey.asm, vin.scriptSig.asm)
                    if (result) {
                        let commitHeight = commitTx.confirmations > 0 ? height - commitTx.confirmations + 1 : undefined
                        const totalSupply = tx.vout.filter((v: any) => v?.tokenData?.category === category).reduce((acc: number, cur: any) => acc + Number(cur.tokenData.amount), 0)
                        if (checkSymbol && result.symbol == symbol) {
                            return [category, result.name, result.decimals, mintAmt, tx.confirmations, totalSupply, commitHeight];
                        }
                        if (!checkSymbol) {
                            return [result.symbol, category, result.name, result.decimals, mintAmt, tx.confirmations, totalSupply, commitHeight];
                        }
                    }
                }
            }
        }
    }
    return [undefined]
}

function getNftMetaInfoFromRevealOpreturn(opreturnHex: string, opreturnAsm: string) {
    const arr = opreturnAsm.split(" ")
    let baseTokenURI
    try {
        baseTokenURI = Buffer.from(arr[2], "hex").toString()
    } catch (error) {
        baseTokenURI = arr[2]
    }
    let feeCategory = arr[3].replace("OP_", "")
    feeCategory = feeCategory === "0" ? "" : feeCategory
    const authorAddress = pkhToCashAddr(Buffer.from(arr[4], "hex"))
    const length = opreturnHex.length
    const mintPrice = Number(`0x${opreturnHex.slice(length - 26, length - 8 - 2)}`)
    const totalSupply = Number(`0x${opreturnHex.slice(length - 8, length)}`)
    return {
        baseTokenURI, feeCategory, authorAddress, mintPrice, totalSupply, type: "CRC721"
    }
}

function pkhToCashAddr(pkh: Buffer) {
    return encodeCashAddress(CashAddressNetworkPrefix[config.network], 'p2pkh' as any, pkh)
}

// Returns a Symbol UTXO's address
function getAddressFromSymbol(symbol: string) {
    const symbolHash = new Buffer(hash160(new Buffer(symbol)))
    return pkhToCashAddr(symbolHash)
}

export async function getTokensBySymbol(symbol: string): Promise<Array<CRC20Token | CRC721Token | null>> {
    checkSymbol(symbol)
    let symbolAddress = getAddressFromSymbol(symbol)
    let utxoInfos = await getUtxosByAddress(symbolAddress)
    const tokens: any = [];
    await Promise.all(utxoInfos.map(async utxoInfo => {
        if (utxoInfo.tx_pos !== 0) {
            return
        }
        let tx = await getTxByTxid(utxoInfo.tx_hash); // get the detail of genesis Tx which reveals MetaInfo
        let [category, name, decimals, mintAmt, confirmations, supply, commitHeight] = await getMetaInfoForSymbol(tx, symbol)
        if (category !== undefined) {
            // nft
            let info = {}
            const lastVout = tx.vout[tx.vout.length - 1]
            if (lastVout.scriptPubKey.hex.indexOf("6a06435243373231") === 0) {
                info = getNftMetaInfoFromRevealOpreturn(lastVout.scriptPubKey.hex, lastVout.scriptPubKey.asm)
            }
            let fairGenesisHeight = Math.max(commitHeight, utxoInfo.height - 20);
            tokens.push({
                symbol: symbol,
                category: category,
                name: name,
                decimals: decimals,
                mintAmt: mintAmt,
                revealHeight: fairGenesisHeight,
                revealTxid: utxoInfo.tx_hash,
                revealTxConfirmations: confirmations,
                totalSupply: supply,
                type: "CRC20",
                ...info
            });
        }
    }))
    const map = getCategoryColorMap(tokens)
    tokens.forEach((v: any) => {
        if (map[v.category] === "green") {
            v.isCanonical = true
        } else if (map[v.category] === "red") {
            v.isCanonical = false
        }
    })
    return tokens
}

function getCategoryColorMap(tokens: any[]) {
    let categoryColorMap: any = {}
    let canonicalCategory = ""
    tokens.sort(function (a, b) { return a.revealHeight - b.revealHeight });
    if (tokens.length > 0) {
        if (tokens[0].revealTxConfirmations >= 10) {
            canonicalCategory = tokens[0].category
        }
    }
    for (let token of tokens) {
        if (canonicalCategory.length == 0) {
            categoryColorMap[token.category] = "yellow"
        } else if (canonicalCategory == token.category) {
            categoryColorMap[token.category] = "green"
        } else {
            categoryColorMap[token.category] = "red"
        }
    }
    return categoryColorMap
}



function getCovenantAddress(recipientPK: Uint8Array, metaInfo: Uint8Array, symbolLen: number) {
    const contractAddress = getContractAddress(config.network, 'OP_3 OP_ROLL OP_SWAP OP_CHECKSIGVERIFY OP_SWAP OP_SPLIT OP_DROP OP_HASH160 76a914 OP_SWAP OP_CAT 88ac OP_CAT OP_0 OP_OUTPUTBYTECODE OP_EQUAL', [recipientPK, metaInfo, BigInt(symbolLen)], ["pubkey", "bytes", "int"])
    const addr = decodeCashAddress(contractAddress as string) as {
        payload: Uint8Array;
        prefix: string;
        type: CashAddressType;
    }
    return Buffer.from(addr.payload).toString('hex')
}


function getMetaInfoFromGenesisOutput(scriptType: string, scriptPubkeyASM: string, scriptSigASM: string) {
    let revealScriptHex = "537a7cad7c7f75a90376a9147c7e0288ac7e00cd87"
    if (scriptType != "scripthash") {
        return undefined
    }
    let scriptPubkeyItems = scriptPubkeyASM.split(" ")
    if (scriptPubkeyItems.length !== 3) {
        return undefined
    }
    let p2shAddressHash160 = scriptPubkeyItems[1]
    let items = scriptSigASM.split(" ")
    if (items.length !== 2) {
        return undefined
    }
    let redeemScript = items[1]
    if (redeemScript.endsWith(revealScriptHex) !== true) {
        return undefined
    }
    let redeemScriptHead = redeemScript.slice(0, -revealScriptHex.length)
    const redeemScriptHeadAsm: any = disassembleBytecodeBCH(Buffer.from(redeemScriptHead, 'hex'))
    let params = redeemScriptHeadAsm.split(' ').filter((c: any) => c.indexOf('OP_PUSH') === -1).map((c: any) => c.replace(/^0x/, ''))
    if (params.length !== 3) {
        return undefined
    }
    if (params[2].length !== 65 * 2) {
        return undefined
    }
    let recipientPK = params[2]
    let metaInfo = params[1]
    let symbolLength
    const OP_XMap: any = {
        'OP_0': 0,
        'OP_FALSE': 0,
        'OP_1': 1,
        'OP_TRUE': 1,
        'OP_2': 2,
        'OP_3': 3,
        'OP_4': 4,
        'OP_5': 5,
        'OP_6': 6,
        'OP_7': 7,
        'OP_8': 8,
        'OP_9': 9,
        'OP_10': 10,
        'OP_11': 11,
        'OP_12': 12,
        'OP_13': 13,
        'OP_14': 14,
        'OP_15': 15,
        'OP_16': 16
    }
    const param0 = params[0]
    if ((Object as any).hasOwn(OP_XMap, param0)) {
        symbolLength = OP_XMap[param0] // OP_1 ~ OP_16
    } else {
        try {
            symbolLength = Number(vmNumberToBigInt(Buffer.from(param0, "hex")))
        } catch (e) {
            console.log('err:', e);
            return undefined
        }
    }
    if (symbolLength === undefined) {
        return undefined
    }
    const symbol = Buffer.from(metaInfo.slice(0, symbolLength * 2), 'hex').toString('utf8');
    const decimals = Number("0x" + metaInfo.slice(symbolLength * 2, symbolLength * 2 + 2));
    const name = Buffer.from(metaInfo.slice(symbolLength * 2 + 2), 'hex').toString('utf8');

    let pk = Uint8Array.from(Buffer.from(recipientPK, 'hex'))
    let address = getCovenantAddress(pk, Buffer.from(metaInfo, 'hex'), symbolLength)
    if (address === p2shAddressHash160) { // Not necessary, BCH's consensus rule ensures it's true
        return { name, decimals, symbol };
    } else {
        return undefined;
    }
}

export async function getTokenByCategory(category: string): Promise<CRC20Token | CRC721Token | null> {
    const token = await _getTokenByCategory(category)
    if (!token) {
        return null
    }
    const { symbol } = token
    const tokens = await getTokensBySymbol(symbol)
    return tokens.find(x => x?.category === category) || null
}

async function _getTokenByCategory(category: string) {
    let tx = await getTxByTxid(category)
    if (!tx) {
        return undefined
    }
    let genesisOut = tx.vout[0]
    if (genesisOut.scriptPubKey.type != 'scripthash') {
        return undefined
    }
    let addresses = genesisOut.scriptPubKey.addresses
    if (addresses == undefined) {
        return undefined
    }
    let p2shAddress = addresses[0]
    const electrumClient = await getElectrumClient()
    let histories = await electrumClient.blockchain_address_getHistory(p2shAddress)
    for (let i in histories) {
        let history = histories[i]
        let tx = await getTxByTxid(history.tx_hash)
        for (let j in tx.vin) {
            if (tx.vin[j].txid == category) {
                // hit
                let [symbol, categoryParsed, name, decimals, mintAmt, confirmations, supply] = await getMetaInfoForSymbol(tx, undefined, false, category)
                if (symbol === undefined) {
                    continue
                }
                if (category != categoryParsed) {
                    return undefined
                }
                // nft
                // let info = {}
                // const lastVout = tx.vout[tx.vout.length - 1]
                // if (lastVout.scriptPubKey.hex.indexOf("6a06435243373231") === 0) {
                //     info = getNftMetaInfoFromRevealOpreturn(lastVout.scriptPubKey.asm)
                // }
                return {
                    symbol: symbol,
                    category: category,
                    name: name,
                    decimals: decimals,
                    mintAmt: mintAmt,
                    revealHeight: history.height,
                    revealTxid: tx.txid,
                    revealTxConfirmations: confirmations,
                    totalSupply: supply,
                    // ...info
                }
            }
        }
    }
}

export default { checkSymbol, getTokenByCategory, getTokensBySymbol }