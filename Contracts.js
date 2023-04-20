const { ethers } = require("ethers")
const { RPC_URL, HUMAN_FACTORY_ABI, HUMAN_ABI, HUMAN_FACTORY_ADDRESS, ENTRY_POINT_ADDRESS, HUMAN_ENTRY_POINT_ABI } = require("./Constants")

function getEntrypointContract() {
    return new ethers.Contract(ENTRY_POINT_ADDRESS, HUMAN_ENTRY_POINT_ABI, getProvider())
}

function getFactoryContract() {
    return new ethers.Contract(HUMAN_FACTORY_ADDRESS, HUMAN_FACTORY_ABI, getProvider())
}

function getHumanContract(humanAddress) {
    return new ethers.Contract(humanAddress, HUMAN_ABI, getProvider())
}

function getProvider() {
    return new ethers.providers.JsonRpcProvider(RPC_URL)
}

module.exports = { getEntrypointContract, getFactoryContract, getHumanContract, getProvider }