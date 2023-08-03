const { ethers } = require("ethers")

function getUserOpHash(op, entryPoint, chainId) {
    const userOpHash = ethers.utils.keccak256(packUserOp(op))
    const enc = ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "address", "uint256"],
        [userOpHash, entryPoint, chainId])
    return ethers.utils.keccak256(enc)
}

function packUserOp(op) {
    return ethers.utils.defaultAbiCoder.encode(
        [
            'address',
            'uint256',
            'bytes32',
            'bytes32',
            'uint256',
            'uint256',
            'uint256',
            'uint256',
            'uint256',
            'bytes32'
        ],
        [
            op.sender,
            op.nonce,
            ethers.utils.keccak256(op.initCode),
            ethers.utils.keccak256(op.callData),
            op.callGasLimit,
            op.verificationGasLimit,
            op.preVerificationGas,
            op.maxFeePerGas,
            op.maxPriorityFeePerGas,
            ethers.utils.keccak256(op.paymasterAndData)
        ]
    )
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