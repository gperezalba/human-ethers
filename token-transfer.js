const { ethers } = require("ethers")
require('dotenv').config()
const { TOKEN_MOCK_ABI, TOKEN_MOCK_ADDRESS } = require("./Constants")
const { getHumanByEmail, getSignedUserOperation } = require("./Human")
const { getProvider } = require("./Contracts")
const { handleOps } = require("./Entrypoint")

main()
async function main() {
    const signer = new ethers.Wallet(process.env.SIGNER_PRIV_KEY, getProvider()) //signer from W3A, human.owner()
    const humanAddress = await getHumanByEmail("gperezalba94@gmail.com")
    const target = TOKEN_MOCK_ADDRESS
    const data = encodeFunctionData(TOKEN_MOCK_ABI, "transfer", ["0xCD7669AAFffB7F683995E6eD9b53d1E5FE72c142", ethers.utils.parseEther("1")])
    const transferGas = await getProvider().estimateGas({
        from: humanAddress,
        to: TOKEN_MOCK_ADDRESS,
        data: data
    })
    const value = ethers.BigNumber.from("0")
    const userOp = await getSignedUserOperation(humanAddress, target, value, data, signer)
    handleOps([userOp], transferGas)
}

function encodeFunctionData(abi, functionName, paramsArray) {
    const contract = new ethers.Contract(ethers.constants.AddressZero, abi)
    return contract.interface.encodeFunctionData(functionName, paramsArray)
}
