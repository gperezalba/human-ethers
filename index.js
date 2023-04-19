const { ethers } = require("ethers")
require('dotenv').config()
const { getUserOpHash, getEmptyUserOperation } = require("./UserOperation")
const { RPC_URL, HUMAN_FACTORY_ABI, HUMAN_ABI, HUMAN_FACTORY_ADDRESS, ENTRY_POINT_ADDRESS, HUMAN_ENTRY_POINT_ABI, SET_MOCK_ADDRESS, SET_MOCK_ABI } = require("./Constants")

main()
async function main() {
    const signer = new ethers.Wallet(process.env.SIGNER_PRIV_KEY, getProvider()) //signer from W3A, human.owner()
    const humanAddress = await getHumanByEmail("gperezalba94@gmail.com")
    const target = SET_MOCK_ADDRESS
    const data = encodeFunctionData(SET_MOCK_ABI, "set", [ethers.utils.parseEther("777")])
    const value = ethers.BigNumber.from("0")
    const userOp = await getSignedUserOperation(humanAddress, target, value, data, signer)

    const bundler = new ethers.Wallet(process.env.BUNDLER_PRIV_KEY, getProvider())
    const entryPointContract = getEntrypointContract().connect(bundler)
    const response = await entryPointContract.handleOps([userOp], ethers.constants.AddressZero)
    console.log(response.hash)
    const receipt = await response.wait()
    console.log("Success")
}

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

function getEntrypointContract() {
    return new ethers.Contract(ENTRY_POINT_ADDRESS, HUMAN_ENTRY_POINT_ABI, getProvider())
}

function getFactoryContract() {
    return new ethers.Contract(HUMAN_FACTORY_ADDRESS, HUMAN_FACTORY_ABI, getProvider())
}

function getHumanContract(humanAddress) {
    return new ethers.Contract(humanAddress, HUMAN_ABI, getProvider())
}

function getProvider() {
    return new ethers.providers.JsonRpcProvider(RPC_URL)
}