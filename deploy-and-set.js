const { ethers } = require("ethers")
require('dotenv').config()
const { SET_MOCK_ADDRESS, SET_MOCK_ABI } = require("./Constants")
const { getHumanByDeployParamsFromContract, getHumanByCreate2SaltFromContract, getHumanByDeployParams, getSignedUserOperation, getUserOpInitCode } = require("./Human")
const { getProvider } = require("./Contracts")
const { handleOps } = require("./Entrypoint")

const safeOwners = ["0xCD7669AAFffB7F683995E6eD9b53d1E5FE72c142", "0x30729B6910757042024304E56BEB015821462691", "0xDB970fD8Ed083D0Dc6000fa1e4973F27d8eDA2A9"]
const timelock = "3600" //1h
const owner = "0xCD7669AAFffB7F683995E6eD9b53d1E5FE72c142"
const master = "0x44eEdBEE931A5dc22a5f4Ad441679FD5C0e38D38"
const policies = "0xBDE6a9e4278237098c021A44585B16fB35Fa3DEc"
const inactivityTime = "7203" //2h
const projectSalt = ethers.utils.id("projectSalt")

main()
async function main() {
    const signer = new ethers.Wallet(process.env.SIGNER_PRIV_KEY, getProvider()) //signer from W3A, human.owner()
    const humanAddress = await getHumanByDeployParamsFromContract(safeOwners, timelock, owner, master, policies, inactivityTime, projectSalt)
    const target = SET_MOCK_ADDRESS
    const data = encodeFunctionData(SET_MOCK_ABI, "set", [ethers.BigNumber.from("9")])
    const setGas = await getProvider().estimateGas({
        from: humanAddress,
        to: target,
        data: data
    })
    const value = ethers.BigNumber.from("0")
    const initCode = getUserOpInitCode(safeOwners, timelock, owner, master, policies, inactivityTime, projectSalt)
    const userOp = await getSignedUserOperation(humanAddress, target, value, data, signer, setGas, initCode)
    await handleOps([userOp])
    const contract = new ethers.Contract(SET_MOCK_ADDRESS, SET_MOCK_ABI, getProvider())
    console.log((await contract.variable()).toString())
}

function encodeFunctionData(abi, functionName, paramsArray) {
    const contract = new ethers.Contract(ethers.constants.AddressZero, abi)
    return contract.interface.encodeFunctionData(functionName, paramsArray)
}
