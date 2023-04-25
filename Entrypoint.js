const { ethers } = require("ethers")
require('dotenv').config()
const { getProvider, getEntrypointContract } = require("./Contracts")
const verifySigExtraGas = ethers.BigNumber.from("25000")

async function handleOps(userOps, extraGas) {
    const bundler = new ethers.Wallet(process.env.BUNDLER_PRIV_KEY, getProvider())
    const entryPointContract = getEntrypointContract().connect(bundler)
    const gas = await entryPointContract.estimateGas.handleOps(userOps, ethers.constants.AddressZero)
    const response = await entryPointContract.handleOps(userOps, ethers.constants.AddressZero, { gasLimit: gas.add(extraGas).add(verifySigExtraGas) })
    console.log(response.hash)
    await response.wait()
    console.log("Success")
}

module.exports = { handleOps }