const { ethers } = require("ethers")
require('dotenv').config()
const { getUserOpHash, getEmptyUserOperation } = require("./UserOperation")
const { getHumanContract, getFactoryContract, getProvider } = require("./Contracts")
const { HUMAN_ABI, ENTRY_POINT_ADDRESS } = require("./Constants")

async function getSignedUserOperation(humanAddress, target, value, data, signer) {
    const executeData = getExecuteData(target, value, data)
    const op = await populateUserOp(humanAddress, executeData)
    const signature = await signUserOp(op, signer)
    op.signature = signature
    return op
}

async function signUserOp(op, signer) {
    const provider = getProvider()
    await provider.getBalance(ethers.constants.AddressZero) //without any rpc_call cant get chainId

    const hash = getUserOpHash(op, ENTRY_POINT_ADDRESS, provider._network.chainId)
    return await signer.signMessage(hash)
}

async function populateUserOp(humanAddress, executeCalldata) {
    const nonce = await getHumanNonce(humanAddress)
    const op = {
        ...getEmptyUserOperation(),
        sender: humanAddress,
        nonce: nonce,
        callData: executeCalldata,
    }
    return op
}

async function getHumanByEmail(email) {
    const factory = getFactoryContract()
    return await factory.getHuman(email)
}

async function getHumanNonce(humanAddress) {
    const humanContract = getHumanContract(humanAddress)
    return await humanContract.nonce()
}

function getExecuteData(target, value, data) {
    const operationType = "0" //v1 only allows operationType = 0
    return encodeFunctionData(HUMAN_ABI, "execute", [operationType, target, value, data])
}

function encodeFunctionData(abi, functionName, paramsArray) {
    const contract = new ethers.Contract(ethers.constants.AddressZero, abi)
    return contract.interface.encodeFunctionData(functionName, paramsArray)
}

module.exports = { getSignedUserOperation, getHumanByEmail }