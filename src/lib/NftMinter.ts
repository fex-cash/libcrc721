import { bigIntToVmNumber, binToHex } from '@bitauth/libauth';
import { reverseHexBytes } from '../common/common';

export class NftMinterContract {

    static index2Commitment(index: number) {
        if (index === 0) {
            return '00'
        }
        return binToHex(bigIntToVmNumber(BigInt(index)))
    }

    static commitment2Index(commitment: string) {
        return Number(`0x${reverseHexBytes(commitment)}`)
    }
}


