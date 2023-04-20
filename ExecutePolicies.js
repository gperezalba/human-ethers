const { ethers } = require("ethers")
const { getExecutePoliciesContract } = require("./Contracts")

async function executeCheckOwner() {
    const policiesContract = getExecutePoliciesContract()
    return await policiesContract.executeCheckOwner(target, data, value)
}

module.exports = { executeCheckOwner }