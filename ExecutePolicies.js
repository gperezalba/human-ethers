const { ethers } = require("ethers")
const { getExecutePoliciesContract } = require("./Contracts")

async function executeCheckOwner(target, data, value) {
    const policiesContract = getExecutePoliciesContract()
    return await policiesContract.executeCheckOwner(target, data, value)
}

module.exports = { executeCheckOwner }