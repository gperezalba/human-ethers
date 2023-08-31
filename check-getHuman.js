const { ethers } = require("ethers")
require('dotenv').config()
const { getHumanByDeployParamsFromContract, getHumanByCreate2SaltFromContract, getHumanByDeployParams } = require("./Human")

const safeOwners = ["0xCD7669AAFffB7F683995E6eD9b53d1E5FE72c142", "0x30729B6910757042024304E56BEB015821462691", "0xDB970fD8Ed083D0Dc6000fa1e4973F27d8eDA2A9"]
const timelock = "3600" //1h
const owner = "0xCD7669AAFffB7F683995E6eD9b53d1E5FE72c142"
const master = "0x44eEdBEE931A5dc22a5f4Ad441679FD5C0e38D38"
const policies = "0xBDE6a9e4278237098c021A44585B16fB35Fa3DEc"
const inactivityTime = "7200" //2h
const projectSalt = ethers.utils.id("projectSalt")

main()
async function main() {
    const expectedContract = await getHumanByDeployParamsFromContract(safeOwners, timelock, owner, master, policies, inactivityTime, projectSalt)
    console.log(expectedContract)
    const expectedEthers = await getHumanByDeployParams(safeOwners, timelock, owner, master, policies, inactivityTime, projectSalt)
    console.log(expectedEthers)
    const create2Salt = ethers.utils.keccak256(ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256", "address", "address", "address", "uint256", "bytes32"],
        [safeOwners, timelock, owner, master, policies, inactivityTime, projectSalt]
    )))
    const expectedContract2 = await getHumanByCreate2SaltFromContract(create2Salt)
    console.log(expectedContract2)
}