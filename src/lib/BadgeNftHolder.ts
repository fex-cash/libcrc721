import { Network } from "mainnet-js";
import { decodeAuthenticationInstructions } from '@bitauth/libauth';
import { Contract } from '@mainnet-cash/contract';

const badgeCS = `
pragma cashscript ^0.8.0;

contract BadgeNftHolder(bytes ownerLockingBytes) {
    function spend(string badge) {
        require(badge == "badge");
        require(this.activeInputIndex == 1);
        require(tx.inputs[0].lockingBytecode == ownerLockingBytes);
        require(tx.inputs[1].nftCommitment == tx.outputs[1].nftCommitment);
        require(tx.inputs[1].tokenCategory == tx.outputs[1].tokenCategory);
    }
}
`;

export class BadgeNftHolderContract {
    contract: Contract;

    init(network: Network, script: string, ...args: any[]) {
        this.contract = new Contract(script, args, network);
    }

    constructor(
        ownerLockingBytes: string,
        network: Network
    ) {
        const args = [ownerLockingBytes];
        this.init(network, badgeCS, ...args);
    }



}