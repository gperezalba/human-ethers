const { ethers } = require("ethers")

function getUserOpHash(op, entryPoint, chainId) {
    const userOpHash = ethers.utils.id(packUserOp(op, true))
    const enc = ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "address", "uint256"],
        [userOpHash, entryPoint, chainId])
    return ethers.utils.id(enc)
}

function packUserOp(op) {
    // lighter signature scheme (must match UserOperation#pack): do encode a zero-length signature, but strip afterwards the appended zero-length value
    const userOpType = {
        components: [
            { type: "address", name: "sender" },
            { type: "uint256", name: "nonce" },
            { type: "bytes", name: "initCode" },
            { type: "bytes", name: "callData" },
            { type: "uint256", name: "callGasLimit" },
            { type: "uint256", name: "verificationGasLimit" },
            { type: "uint256", name: "preVerificationGas" },
            { type: "uint256", name: "maxFeePerGas" },
            { type: "uint256", name: "maxPriorityFeePerGas" },
            { type: "bytes", name: "paymasterAndData" },
            { type: "bytes", name: "signature" }
        ],
        name: "userOp",
        type: "tuple"
    }
    let encoded = ethers.utils.defaultAbiCoder.encode([userOpType], [{ ...op, signature: "0x" }])
    // remove leading word (total length) and trailing word (zero-length signature)
    encoded = "0x" + encoded.slice(66, encoded.length - 64)
    return encoded
}

const getEmptyUserOperation = () => ({
    sender: ethers.constants.AddressZero,
    nonce: "0",
    initCode: "0x",
    callData: "0x",
    callGasLimit: "0",
    verificationGasLimit: "0",
    preVerificationGas: "0",
    maxFeePerGas: "0",
    maxPriorityFeePerGas: "0",
    paymasterAndData: "0x",
    signature: "0x",
})

module.exports = { getUserOpHash, getEmptyUserOperation }