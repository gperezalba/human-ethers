const { ethers } = require("ethers")
require('dotenv').config()
const { SET_MOCK_ADDRESS, SET_MOCK_ABI } = require("./Constants")
const { getHumanByEmail, getSignedUserOperation } = require("./Human")
const { getProvider, getEntrypointContract } = require("./Contracts")

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

function encodeFunctionData(abi, functionName, paramsArray) {
    const contract = new ethers.Contract(ethers.constants.AddressZero, abi)
    return contract.interface.encodeFunctionData(functionName, paramsArray)
}
