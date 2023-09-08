const { ethers } = require("ethers");
const { SET_MOCK_ADDRESS, SET_MOCK_ABI, HUMAN_ENTRY_POINT_ABI } = require("./Constants")
require('dotenv').config()
const { getSignedUserOperation } = require("./Human")
const { getProvider } = require("./Contracts")
const { handleOps } = require("./Entrypoint")

//https://soliditylang.org/blog/2021/04/21/custom-errors/

main()
async function main() {
    const signer = new ethers.Wallet(ethers.utils.id("BAD_SIGNER_BAD_SIGNER"), getProvider()) //signer from W3A, human.owner()
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

    try {
        await handleOps([userOp])
    } catch (error) {
        const customErrorData = JSON.parse(error.error.body).error.data
        const entryPointInterface = new ethers.utils.Interface(HUMAN_ENTRY_POINT_ABI)
        try {
            const result = entryPointInterface.decodeFunctionResult("handleOps", customErrorData)
        } catch (error) {
            console.log(error.errorName)
            console.log(error.errorArgs)
        }
    }
}

function encodeFunctionData(abi, functionName, paramsArray) {
    const contract = new ethers.Contract(ethers.constants.AddressZero, abi)
    return contract.interface.encodeFunctionData(functionName, paramsArray)
}