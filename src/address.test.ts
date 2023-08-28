import { Network } from "mainnet-js";
import { badgeNameToAddress, addressToBadgeName, config, getWallet } from "./index";
import { describe, it, expect } from 'vitest'

const Badge_Owner = "bchtest:qrfe6qx0js6k6v7nrrrt7prsezmk79s3mygrjdd5xk"
const Badge_Name = "CRC721-1"
config.network = Network.TESTNET
config.badgeTxQuerier = new class {
    async getTxId(category: string, commitment: string,) {
        return "d5b3db6509a51b1be4e31155c3d8c8c31f85763f377152c204896a284fb4f4a8" // just test
    }
}

it('addressToBadgeName', async () => {
    expect(addressToBadgeName("bchtest:pracl7c4cspgv2fuu4wjmf3n3l97nuytm5aga035zw")).rejects.toThrow("No badge is set")
    
    const data = await addressToBadgeName(Badge_Owner)
    expect(data).to.be.equal(Badge_Name)
}, 10 * 1000);

it('badgeNameToAddress', async () => {
    expect(badgeNameToAddress("xxccccc")).rejects.toThrow("Cannot find xxccccc")

    const data = await badgeNameToAddress(Badge_Name)
    expect(data).to.be.equal(Badge_Owner)
}, 10 * 1000);


