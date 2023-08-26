import { Fetcher, mainnetChaingrapFetcher } from './fetcher';
import { Connection, Network, TestNetWallet, Wallet } from "mainnet-js";

export const config: {
    network: Network
    connection?: Connection,
    fetcher?: Fetcher
} = {
    network: Network.MAINNET
}

export function getWallet(): typeof Wallet {
    let _Wallet: typeof Wallet
    if (config.network === Network.MAINNET) {
        _Wallet = Wallet
    } else {
        _Wallet = TestNetWallet
    }
    if (config.connection) {
        (_Wallet as any).provider = config.connection.networkProvider
    }
    return _Wallet
}

export function getFetcher(): Fetcher {
    return config.fetcher || mainnetChaingrapFetcher
}