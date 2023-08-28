import { BadgeTxQuerier, mainnetChaingrapBadgeTxQuerier } from './badgeTxQuerier';
import { Connection, Network, TestNetWallet, Wallet, getNetworkProvider } from "mainnet-js";

export const config: {
    network: Network
    connection?: Connection,
    badgeTxQuerier?: BadgeTxQuerier
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
        _Wallet.prototype.getNetworkProvider = () => (_Wallet as any).provider
    } else {
        _Wallet.prototype.getNetworkProvider = () => getNetworkProvider(config.network)
    }
    
    return _Wallet
}

export function getBadgeTxQuerier(): BadgeTxQuerier {
    return config.badgeTxQuerier || mainnetChaingrapBadgeTxQuerier
}