const { ethers } = require("ethers")
require('dotenv').config()
const { getUserOpHash, getEmptyUserOperation } = require("./UserOperation")
const { getHumanContract, getFactoryContract, getProvider } = require("./Contracts")
const { HUMAN_ABI, ENTRY_POINT_ADDRESS, HUMAN_FACTORY_ADDRESS, BEACON_PROXY_BYTECODE, BEACON_PROXY_BYTECODE2, BEACON_ADDRESS } = require("./Constants")
const { executeCheckOwner } = require("./ExecutePolicies")

async function getSignedUserOperation(humanAddress, target, value, data, signer, callGas) {
    const isPoliciesAllowed = await executeCheckOwner(target, data, value)
    const nonce = await getHumanNonce(humanAddress)
    const estimateNonce = ethers.BigNumber.from(nonce.toString()).sub(ethers.BigNumber.from("1"))
    const executeData = isPoliciesAllowed ? getExecuteData(target, value, data, "0x") : getExecuteData(target, value, data, await masterSign(humanAddress, nonce, "0", target, value, data))
    let executeGas = await getProvider().estimateGas({
        from: ENTRY_POINT_ADDRESS,
        to: humanAddress,
        data: getExecuteData(target, value, data, await masterSign(humanAddress, estimateNonce, "0", target, value, data))
    })
    const op = await populateUserOp(humanAddress, executeData, executeGas.add(callGas))
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

async function populateUserOp(humanAddress, executeCalldata, executeGas) {
    const nonce = await getHumanNonce(humanAddress)
    const op = {
        ...getEmptyUserOperation(),
        sender: humanAddress,
        nonce: nonce,
        callData: executeCalldata,
        callGasLimit: executeGas,
    }
    return op
}

async function masterSign(humanAddress, nonce, operationType, target, value, data) {
    const provider = getProvider()
    await provider.getBalance(humanAddress)
    const chainId = provider._network.chainId
    const encoded = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "address", "uint256", "uint256", "address", "uint256", "bytes32"],
        [chainId, humanAddress, nonce, operationType, target, value, ethers.utils.keccak256(data)]
    )
    const hash = ethers.utils.keccak256(encoded)
    const masterSigner = new ethers.Wallet(process.env.MASTER_PRIV_KEY)
    const signature = await masterSigner.signMessage(ethers.utils.arrayify(hash))
    return signature
}

async function getHumanByEmailFromContract(email) {
    const factory = getFactoryContract()
    return await factory.getHuman(email)
}

async function getHumanByEmail(email) {
    const salt = ethers.utils.keccak256(ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["string"], [email])))
    const initCode = ethers.utils.solidityPack(["bytes", "bytes"], [BEACON_PROXY_BYTECODE, ethers.utils.defaultAbiCoder.encode(["address", "string"], [BEACON_ADDRESS, ""])])
    const initCodeHash = ethers.utils.keccak256(initCode)
    return ethers.utils.getCreate2Address(HUMAN_FACTORY_ADDRESS, salt, initCodeHash)
}

async function getHumanNonce(humanAddress) {
    const humanContract = getHumanContract(humanAddress)
    return await humanContract.nonce()
}

function getExecuteData(target, value, data, signature) {
    const operationType = "0" //v1 only allows operationType = 0
    const executeData = ethers.utils.defaultAbiCoder.encode(["bytes", "bytes"], [data, signature])
    return encodeFunctionData(HUMAN_ABI, "execute", [operationType, target, value, executeData])
}

function encodeFunctionData(abi, functionName, paramsArray) {
    const contract = new ethers.Contract(ethers.constants.AddressZero, abi)
    return contract.interface.encodeFunctionData(functionName, paramsArray)
}

module.exports = { getSignedUserOperation, getHumanByEmail }