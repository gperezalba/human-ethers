const { ethers } = require("ethers")
const { getExecutePoliciesContract } = require("./Contracts")

async function executeCheckOwner(operationType, target, data, value) {
    const policiesContract = getExecutePoliciesContract()
    return await policiesContract.executeCheckOwner(operationType, target, data, value)
}

module.exports = { executeCheckOwner }