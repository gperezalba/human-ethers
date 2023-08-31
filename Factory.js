const { ethers } = require("ethers")
const { getFactoryContract, getProvider } = require("./Contracts")
const { getHumanByEmail } = require("./Human")

async function deployHuman(safeOwners, timelock, owner, master, policies, inactivityTime, email) {
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIV_KEY, getProvider())
    const factoryContract = getFactoryContract().connect(deployer)
    const humanAddress = await getHumanByEmail(email)
    console.log("Human:", humanAddress)
    const response = await factoryContract.deployHuman(
        safeOwners,
        timelock,
        owner,
        master,
        policies,
        inactivityTime,
        email
    )
    console.log(response.hash)
    await response.wait()
    console.log("Success")
}

module.exports = { deployHuman }