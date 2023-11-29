import ElectrumClient from '@tkone7/electrum-client-js';
import { config } from "../config";

interface IElectrumClient {
    blockchain_address_getBalance(address: any): any
    blockchain_address_getHistory(address: any): any
    blockchain_address_getMempool(address: any): any
    blockchain_address_getProof(address: any): any
    blockchain_address_listunspent(address: any): any
    blockchain_address_subscribe(address: any): any
    blockchain_block_getChunk(index: any): any
    blockchain_block_header(height: any, cpHeight: any): any// cpHeight = 0
    blockchain_block_headers(startHeight: any, count: any, cpHeight: any): any // cpHeight = 0
    blockchain_headers_subscribe(): any
    blockchain_numblocks_subscribe(): any
    blockchain_relayfee(): any
    blockchain_scripthash_getBalance(scripthash: any): any
    blockchain_scripthash_getHistory(scripthash: any): any
    blockchain_scripthash_getMempool(scripthash: any): any
    blockchain_scripthash_listunspent(scripthash: any): any
    blockchain_scripthash_subscribe(scripthash: any): any
    blockchain_scripthash_unsubscribe(scripthash: any): any
    blockchain_transaction_broadcast(rawtx: any): any
    blockchain_transaction_get(tx_hash: any, verbose: any): any
    blockchain_transaction_getMerkle(tx_hash: any, height: any): any
    blockchain_utxo_getAddress(tx_hash: any, index: any): any
    blockchainEstimatefee(number: any): any
    close(): any
    connect(clientName: any, electrumProtocolVersion: any, persistencePolicy: any): any//persistencePolicy = { maxRetry: 10, callback: null }
    keepAlive(): any
    mempool_getFeeHistogram(): any
    onClose(): any
    request(method: any, params: any): any
    server_addPeer(features: any): any
    server_banner(): any
    server_donation_address(): any
    server_features(): any
    server_peers_subscribe(): any
    server_ping(): any
    server_version(client_name: any, protocol_version: any): any

    getAddressUtxos(address: any): Promise<Array<{
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

let electrumClientPromise: Promise<IElectrumClient> | null
export async function getElectrumClient() {
    if (!electrumClientPromise) {
        electrumClientPromise = new Promise((resolve, reject) => {
            const url = config.defaultElectrumClientUrl || (config.network === "mainnet" ? "wss://bch.imaginary.cash:50004/" : "wss://chipnet.imaginary.cash:50004/")
            const urlResult = new URL(url)
            const electrum = new ElectrumClient(urlResult.hostname, urlResult.port, urlResult.protocol.replace(":", ""));
            electrum.getAddressUtxos = async (address: string) => {
                const utxos = await electrum.request("blockchain.address.listunspent", [address, "include_tokens"])
                utxos.forEach((utxo: any) => {
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
            ).then(() => resolve(electrum)).catch((error: any) => { console.error(error); reject(error) })
        })
    }
    return electrumClientPromise
}

export default { getElectrumClient }