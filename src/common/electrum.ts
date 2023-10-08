import ElectrumClient from '@tkone7/electrum-client-js';
import { config } from "../config";

interface IElectrumClient {
    blockchain_address_getBalance(address)
    blockchain_address_getHistory(address)
    blockchain_address_getMempool(address)
    blockchain_address_getProof(address)
    blockchain_address_listunspent(address)
    blockchain_address_subscribe(address)
    blockchain_block_getChunk(index)
    blockchain_block_header(height, cpHeight) // cpHeight = 0
    blockchain_block_headers(startHeight, count, cpHeight) // cpHeight = 0
    blockchain_headers_subscribe()
    blockchain_numblocks_subscribe()
    blockchain_relayfee()
    blockchain_scripthash_getBalance(scripthash)
    blockchain_scripthash_getHistory(scripthash)
    blockchain_scripthash_getMempool(scripthash)
    blockchain_scripthash_listunspent(scripthash)
    blockchain_scripthash_subscribe(scripthash)
    blockchain_scripthash_unsubscribe(scripthash)
    blockchain_transaction_broadcast(rawtx)
    blockchain_transaction_get(tx_hash, verbose)
    blockchain_transaction_getMerkle(tx_hash, height)
    blockchain_utxo_getAddress(tx_hash, index)
    blockchainEstimatefee(number)
    close()
    connect(clientName, electrumProtocolVersion, persistencePolicy) //persistencePolicy = { maxRetry: 10, callback: null }
    keepAlive()
    mempool_getFeeHistogram()
    onClose()
    request(method, params)
    server_addPeer(features)
    server_banner()
    server_donation_address()
    server_features()
    server_peers_subscribe()
    server_ping()
    server_version(client_name, protocol_version)

    getAddressUtxos(address): Promise<Array<{
        height: number,
        token_data: {
            amount: string,
            category: string,
            capability: string
            commitment: string
        },
        tx_hash: string,
        tx_pos: number,
        value: number
    }>>
}

let electrumClientPromise: Promise<IElectrumClient>
export async function getElectrumClient() {
    if (!electrumClientPromise) {
        electrumClientPromise = new Promise((resolve, reject) => {
            const url = config.defaultElectrumClientUrl || (config.network === "mainnet" ? "wss://bch.imaginary.cash:50004/" : "wss://chipnet.imaginary.cash:50004/")
            const urlResult = new URL(url)
            const electrum = new ElectrumClient(urlResult.hostname, urlResult.port, urlResult.protocol.replace(":", ""));
            electrum.getAddressUtxos = async (address: string) => {
                const utxos = await electrum.request("blockchain.address.listunspent", [address, "include_tokens"])
                utxos.forEach(utxo => {
                    if (typeof utxo?.token_data?.nft === "object") {
                        utxo.token_data = { ...utxo.token_data, ...utxo.token_data.nft }
                    }
                });
                return utxos
            }
            console.log("new electrum")
            electrum.onClose = () => {
                console.log("electrum onClose")
                electrumClientPromise = null
            }
            electrum.connect(
                'electrum-client-js', // optional client name
                '1.4.2' // optional protocol version
            ).then(() => resolve(electrum)).catch((error) => { console.error(error); reject(error) })
        })
    }
    return electrumClientPromise
}