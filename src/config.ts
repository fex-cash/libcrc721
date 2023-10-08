import { BadgeTxQuerier, mainnetChaingrapBadgeTxQuerier } from './badgeTxQuerier';


export const config: {
    network: "mainnet" | "testnet"
    badgeTxQuerier?: BadgeTxQuerier
    defaultElectrumClientUrl?: string
} = {
    network: "mainnet"
}

export function getBadgeTxQuerier(): BadgeTxQuerier {
    return config.badgeTxQuerier || mainnetChaingrapBadgeTxQuerier
}