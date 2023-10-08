import { disassembleBytecodeBCH } from '@bitauth/libauth/build/lib/vm/instruction-sets/common/instruction-sets-utils';
import { OpcodesBCH, encodeDataPush, hexToBin, LockingBytecodeType, bigIntToVmNumber, utf8ToBin, binToUtf8, vmNumberToBigInt, isVmNumberError, encodeAuthenticationInstructions, decodeAuthenticationInstructions, hash160, lockingBytecodeToCashAddress } from '@bitauth/libauth';

const Op = OpcodesBCH;
function asmToBytecode(asm) {
    // Remove any duplicate whitespace
    asm = asm.replace(/\s+/g, ' ').trim();
    // Convert the ASM tokens to AuthenticationInstructions
    const instructions = asm.split(' ').map((token) => {
        if (token.startsWith('OP_')) {
            return { opcode: Op[token] };
        }
        return decodeAuthenticationInstructions(encodeDataPush(hexToBin(token)))[0];
    });
    // Convert the AuthenticationInstructions to bytecode
    return encodeAuthenticationInstructions(instructions);
}

function bytecodeToScript(bytecode) {
    // Convert the bytecode to AuthenticationInstructions
    const instructions = decodeAuthenticationInstructions(bytecode);
    // Convert the AuthenticationInstructions to script elements
    const script = instructions.map((instruction) => ('data' in instruction ? instruction.data : instruction.opcode));
    return script;
}

function asmToScript(asm) {
    return bytecodeToScript(asmToBytecode(asm));
}

function scriptToBytecode(script) {
    // Convert the script elements to AuthenticationInstructions
    const instructions = script.map((opOrData) => {
        if (typeof opOrData === 'number') {
            return { opcode: opOrData };
        }
        return decodeAuthenticationInstructions(encodeDataPush(opOrData))[0];
    });
    // Convert the AuthenticationInstructions to bytecode
    return encodeAuthenticationInstructions(instructions);
}

function encodeLockingBytecodeP2sh20(p2sh20Hash) {
    return Uint8Array.from([
        169 /* Opcodes.OP_HASH160 */,
        20 /* Opcodes.OP_PUSHBYTES_20 */,
        ...p2sh20Hash,
        135 /* Opcodes.OP_EQUAL */,
    ])
}

function addressContentsToLockingBytecode({ payload, type, }) {
    if (type === LockingBytecodeType.p2sh20) {
        return encodeLockingBytecodeP2sh20(payload);
    }
};

function scriptToLockingBytecode(script, addressType) {
    const scriptBytecode = scriptToBytecode(script);
    const scriptHash = hash160(scriptBytecode)
    const addressContents = { payload: scriptHash, type: LockingBytecodeType[addressType] };
    const lockingBytecode = addressContentsToLockingBytecode(addressContents);
    return lockingBytecode;
}

function scriptToAddress(script, network, addressType, tokenSupport) {
    const lockingBytecode = scriptToLockingBytecode(script, addressType);
    const prefix = network === "testnet" ? "bchtest" : "bitcoincash";
    const address = lockingBytecodeToCashAddress(lockingBytecode, prefix, { tokenSupport });
    return address;
}

function encodeBool(bool) {
    return bool ? encodeInt(1n) : encodeInt(0n);
}
function decodeBool(encodedBool) {
    // Any encoding of 0 is false, else true
    for (let i = 0; i < encodedBool.byteLength; i += 1) {
        if (encodedBool[i] !== 0) {
            // Can be negative zero
            if (i === encodedBool.byteLength - 1 && encodedBool[i] === 0x80)
                return false;
            return true;
        }
    }
    return false;
}
function encodeInt(int) {
    return bigIntToVmNumber(int);
}
function decodeInt(encodedInt, maxLength = 8) {
    const options = { maximumVmNumberByteLength: maxLength };
    const result = vmNumberToBigInt(encodedInt, options);
    if (isVmNumberError(result)) {
        throw new Error(result);
    }
    return result;
}
function encodeString(str) {
    return utf8ToBin(str);
}
function decodeString(encodedString) {
    return binToUtf8(encodedString);
}
function placeholder(size) {
    return new Uint8Array(size).fill(0);
}

class BytesType {
    public bound: any

    constructor(bound) {
        this.bound = bound;
    }
    static fromString(str) {
        const bound = str === 'byte' ? 1 : Number.parseInt(str.substring(5), 10) || undefined;
        return new BytesType(bound);
    }
    toString() {
        return `bytes${this.bound ?? ''}`;
    }
}

const PrimitiveType: any = {};
PrimitiveType["INT"] = "int";
PrimitiveType["BOOL"] = "bool";
PrimitiveType["STRING"] = "string";
// ADDRESS = 'address',
PrimitiveType["PUBKEY"] = "pubkey";
PrimitiveType["SIG"] = "sig";
PrimitiveType["DATASIG"] = "datasig";
PrimitiveType["ANY"] = "any";

function parseType(str) {
    if (str.startsWith('byte'))
        return BytesType.fromString(str);
    return PrimitiveType[str.toUpperCase()];
}

class TypeError extends Error {
    constructor(actual, expected) {
        super(`Found type '${actual}' where type '${expected.toString()}' was expected`);
    }
}

function encodeArgument(argument, typeStr) {
    let type = parseType(typeStr);
    if (type === PrimitiveType.BOOL) {
        if (typeof argument !== 'boolean') {
            throw new TypeError(typeof argument, type);
        }
        return encodeBool(argument);
    }
    if (type === PrimitiveType.INT) {
        if (typeof argument !== 'bigint') {
            throw new TypeError(typeof argument, type);
        }
        return encodeInt(argument);
    }
    if (type === PrimitiveType.STRING) {
        if (typeof argument !== 'string') {
            throw new TypeError(typeof argument, type);
        }
        return encodeString(argument);
    }
    if (type === PrimitiveType.SIG) {
        throw new Error("SIG ERROR");
    }
    // Convert hex string to Uint8Array
    if (typeof argument === 'string') {
        if (argument.startsWith('0x')) {
            argument = argument.slice(2);
        }
        argument = hexToBin(argument);
    }
    if (!(argument instanceof Uint8Array)) {
        throw Error(`Value for type ${type} should be a Uint8Array or hex string`);
    }
    // Redefine SIG as a bytes65 so it is included in the size checks below
    // Note that ONLY Schnorr signatures are accepted
    if (type === PrimitiveType.SIG && argument.byteLength !== 0) {
        type = new BytesType(65);
    }
    // Redefine SIG as a bytes64 so it is included in the size checks below
    // Note that ONLY Schnorr signatures are accepted
    if (type === PrimitiveType.DATASIG && argument.byteLength !== 0) {
        type = new BytesType(64);
    }
    // Bounded bytes types require a correctly sized argument
    if (type instanceof BytesType && type.bound && argument.byteLength !== type.bound) {
        throw new TypeError(`bytes${argument.byteLength}`, type);
    }
    return argument;
}

function calculateBytesize(script) {
    return scriptToBytecode(script).byteLength;
}

function bytecodeToAsm(bytecode) {
    // Convert the bytecode to libauth's ASM format
    let asm = disassembleBytecodeBCH(bytecode);
    // COnvert libauth's ASM format to BITBOX's
    asm = asm.replace(/OP_PUSHBYTES_[^\s]+/g, '');
    asm = asm.replace(/OP_PUSHDATA[^\s]+ [^\s]+/g, '');
    asm = asm.replace(/(^|\s)0x/g, ' ');
    // Remove any duplicate whitespace
    asm = asm.replace(/\s+/g, ' ').trim();
    return asm;
}

function scriptToAsm(script) {
    return bytecodeToAsm(scriptToBytecode(script));
}

function replaceBytecodeNop(script) {
    const index = script.findIndex((op) => op === Op.OP_NOP);
    if (index < 0)
        return script;
    // Remove the OP_NOP
    script.splice(index, 1);
    // Retrieve size of current OP_SPLIT
    let oldCut = script[index];
    if (oldCut instanceof Uint8Array) {
        oldCut = Number(decodeInt(oldCut));
    }
    else if (oldCut === Op.OP_0) {
        oldCut = 0;
    }
    else if (oldCut >= Op.OP_1 && oldCut <= Op.OP_16) {
        oldCut -= 80;
    }
    else {
        return script;
    }
    // Update the old OP_SPLIT by adding either 1 or 3 to it
    script[index] = encodeInt(BigInt(oldCut + 1));
    const bytecodeSize = calculateBytesize(script);
    if (bytecodeSize > 252) {
        script[index] = encodeInt(BigInt(oldCut + 3));
    }
    // Minimally encode
    return asmToScript(scriptToAsm(script));
}

function generateRedeemScript(baseScript, encodedArgs) {
    return replaceBytecodeNop([...encodedArgs, ...baseScript]);
}

export function getContractAddress(network: "testnet" | "mainnet", bytecode: string, constructorArgs: any[], constructorInputTypes: string[]) {
    const encodedArgs = constructorArgs
        .map((arg, i) => encodeArgument(arg, constructorInputTypes[i]))
        .reverse();
    const redeemScript = generateRedeemScript(asmToScript(bytecode), encodedArgs);
    return scriptToAddress(redeemScript, network, "p2sh20", false);
}
