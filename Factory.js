const { ethers } = require("ethers")
const { getFactoryContract, getProvider } = require("./Contracts")
const { getHumanByEmail } = require("./Human")

async function deployHuman(safeOwners, safeSalt, timelock, owner, master, inactivityTime, email) {
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIV_KEY, getProvider())
    const factoryContract = getFactoryContract().connect(deployer)
    const humanAddress = await getHumanByEmail(email)
    console.log("Human:", humanAddress)
    const response = await factoryContract.deployHuman(
        safeOwners,
        safeSalt,
        timelock,
        owner,
        master,
        inactivityTime,
        email
    )
    console.log(response.hash)
    await response.wait()
    console.log("Success")
}

module.exports = { deployHuman }