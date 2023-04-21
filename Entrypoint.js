const { ethers } = require("ethers")
require('dotenv').config()
const { getProvider, getEntrypointContract } = require("./Contracts")

async function handleOps(userOps) {
    const bundler = new ethers.Wallet(process.env.BUNDLER_PRIV_KEY, getProvider())
    const entryPointContract = getEntrypointContract().connect(bundler)
    const response = await entryPointContract.handleOps(userOps, ethers.constants.AddressZero, { gasLimit: 500000 })
    await response.wait()
    console.log("Success")
}

module.exports = { handleOps }