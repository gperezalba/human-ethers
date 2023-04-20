const { ethers } = require("ethers")
require('dotenv').config()
const { SET_MOCK_ADDRESS, SET_MOCK_ABI } = require("./Constants")
const { getHumanByEmail, getSignedUserOperation } = require("./Human")
const { getProvider } = require("./Contracts")
const { handleOps } = require("./Entrypoint")

main()
async function main() {
    const signer = new ethers.Wallet(process.env.SIGNER_PRIV_KEY, getProvider()) //signer from W3A, human.owner()
    const humanAddress = await getHumanByEmail("gperezalba94@gmail.com")
    const target = SET_MOCK_ADDRESS
    const data = encodeFunctionData(SET_MOCK_ABI, "set", [ethers.utils.parseEther("777")])
    const value = ethers.BigNumber.from("0")
    const userOp = await getSignedUserOperation(humanAddress, target, value, data, signer)
    handleOps([userOp])
}

function encodeFunctionData(abi, functionName, paramsArray) {
    const contract = new ethers.Contract(ethers.constants.AddressZero, abi)
    return contract.interface.encodeFunctionData(functionName, paramsArray)
}
