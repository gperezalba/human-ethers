const { ethers } = require("ethers")
require('dotenv').config()
const { SET_MOCK_ADDRESS, SET_MOCK_ABI } = require("./Constants")
const { getHumanByEmail, getSignedUserOperation } = require("./Human")
const { getProvider } = require("./Contracts")
const { handleOps } = require("./Entrypoint")

main()
async function main() {
    const signer = new ethers.Wallet(process.env.SIGNER_PRIV_KEY, getProvider()) //signer from W3A, human.owner()
    const humanAddress = "0x7f00cC95e3e7cbb936c73Ec96586D8d689296C99"
    const target = SET_MOCK_ADDRESS
    const data = encodeFunctionData(SET_MOCK_ABI, "set", [ethers.BigNumber.from("7")])
    const setGas = await getProvider().estimateGas({
        from: humanAddress,
        to: target,
        data: data
    })
    const value = ethers.BigNumber.from("0")
    const userOp = await getSignedUserOperation(humanAddress, target, value, data, signer, setGas)
    await handleOps([userOp])
    const contract = new ethers.Contract(SET_MOCK_ADDRESS, SET_MOCK_ABI, getProvider())
    console.log((await contract.variable()).toString())
}

function encodeFunctionData(abi, functionName, paramsArray) {
    const contract = new ethers.Contract(ethers.constants.AddressZero, abi)
    return contract.interface.encodeFunctionData(functionName, paramsArray)
}
