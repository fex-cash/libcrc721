import {
    cashAddressToLockingBytecode,
} from '@bitauth/libauth';
import { Buffer } from "buffer"

export function reverseHexBytes(hexStr: string): string {
    if (hexStr === '') {
        return '';
    }
    if (hexStr.length % 2 !== 0) {
        hexStr = '0' + hexStr;
    }
    return hexStr.match(/[a-fA-F0-9]{2}/g)!.reverse().join('');
}



export function cashAddrToLock(addr: string) {
    const lock = cashAddressToLockingBytecode(addr);
    const lockHex = Buffer.from((lock as any).bytecode).toString('hex');
    return lockHex;
}

export default { reverseHexBytes, cashAddrToLock }