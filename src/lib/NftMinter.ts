import { bigIntToVmNumber, binToHex } from '@bitauth/libauth';
import { reverseHexBytes } from '../common/common';

export class NftMinterContract {

    static index2Commitment(index: number) {
        if (index === 0) {
            return '00'
          }
          const hex = binToHex(bigIntToVmNumber(BigInt(index)))
          if (hex.length > 8) {
            throw new Error("index too large")
          }
          return hex
    }

    static commitment2Index(commitment: string) {
        if (commitment.length > 8) {
            commitment = commitment.slice(0, 8)
          }
          return Number(`0x${reverseHexBytes(commitment)}`)
    }
}


