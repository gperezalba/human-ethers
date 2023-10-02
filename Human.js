const { ethers } = require("ethers")
require("dotenv").config()
const { getUserOpHash, getEmptyUserOperation } = require("./UserOperation")
const { getHumanContract, getFactoryContract, getProvider } = require("./Contracts")
const { HUMAN_ABI, ENTRY_POINT_ADDRESS, HUMAN_FACTORY_ADDRESS, BEACON_PROXY_BYTECODE, BEACON_PROXY_BYTECODE2, BEACON_ADDRESS, ENTRYPOINT_DEPLOYEDBYTECODE, ENTRYPOINT_SIMULATIONS_ABI } = require("./Constants")
const { executeCheckOwner } = require("./ExecutePolicies")

async function getSignedUserOperation(humanAddress, target, value, data, signer, callGas, initCode = "0x") {
    const operationType = "0"
    const isPoliciesAllowed = await executeCheckOwner(operationType, target, data, value)
    const nonce = await getHumanNonce(humanAddress)
    const estimateNonce = nonce.toString() == "0" ? ethers.constants.MaxUint256 : ethers.BigNumber.from(nonce.toString()).sub(ethers.BigNumber.from("1"))
    const executeData = isPoliciesAllowed ? getExecuteData(target, value, data, "0x") : getExecuteData(target, value, data, await masterSign(humanAddress, nonce, "0", target, value, data))
    let executeGas = await getProvider().estimateGas({
        from: ENTRY_POINT_ADDRESS,
        to: humanAddress,
        data: getExecuteData(target, value, data, await masterSign(humanAddress, estimateNonce, "0", target, value, data))
    })
    const op = await populateUserOp(humanAddress, executeData, executeGas.add(callGas), initCode)
    op.callData = getExecuteData(target, value, data, await masterSign(humanAddress, estimateNonce, "0", target, value, data))
    const executionResult = await simulateHandleOp(op)
    op.callData = executeData
    op.callGasLimit = executionResult.paid
    op.signature = await signUserOp(op, signer)
    return op
}

async function simulateHandleOp(op) {
    const entryPointSimulations = new ethers.utils.Interface(ENTRYPOINT_SIMULATIONS_ABI)
    const data = entryPointSimulations.encodeFunctionData("simulateHandleOp", [op, ethers.constants.AddressZero, "0x"])
    const tx = {
        to: ENTRY_POINT_ADDRESS,
        data: data,
    }
    const stateOverride = {
        [ENTRY_POINT_ADDRESS]: {
            code: ENTRYPOINT_DEPLOYEDBYTECODE
        }
    }

    try {
        const simulationResult = await getProvider().send('eth_call', [tx, 'latest', stateOverride])
        const res = entryPointSimulations.decodeFunctionResult('simulateHandleOp', simulationResult)
        // note: here collapsing the returned "tuple of one" into a single value - will break for returning actual tuples
        return res[0]
    } catch (error) {
        const revertData = error?.data
        if (revertData != null) {
            // note: this line throws the revert reason instead of returning it
            entryPointSimulations.decodeFunctionResult('simulateHandleOp', revertData)
        }
        throw error
    }
}

async function signUserOp(op, signer) {
    const provider = getProvider()
    await provider.getBalance(ethers.constants.AddressZero) //without any rpc_call cant get chainId

    const hash = getUserOpHash(op, ENTRY_POINT_ADDRESS, provider._network.chainId)
    return await signer.signMessage(ethers.utils.arrayify(hash))
}

async function populateUserOp(humanAddress, executeCalldata, executeGas, initCode) {
    const nonce = await getHumanNonce(humanAddress)
    const op = {
        ...getEmptyUserOperation(),
        sender: humanAddress,
        nonce: nonce,
        callData: executeCalldata,
        callGasLimit: executeGas,
        initCode: initCode,
    }
    return op
}

function getUserOpInitCode(safeOwners, timelock, owner, master, policies, inactivityTime, salt) {
    const factoryContract = getFactoryContract()
    const initCallData = factoryContract.interface.encodeFunctionData(
        "deployHuman",
        [
            safeOwners,
            timelock,
            owner,
            master,
            policies,
            inactivityTime,
            salt
        ]
    )
    return ethers.utils.solidityPack(["address", "bytes"], [HUMAN_FACTORY_ADDRESS, initCallData])
}

async function masterSign(humanAddress, nonce, operationType, target, value, data) {
    const provider = getProvider()
    await provider.getBalance(humanAddress)
    const chainId = provider._network.chainId
    const encoded = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "address", "uint256", "uint256", "address", "uint256", "bytes32"],
        [chainId, humanAddress, nonce, operationType, target, value, ethers.utils.keccak256(data)]
    )
    const hash = ethers.utils.keccak256(encoded)
    const masterSigner = new ethers.Wallet(process.env.MASTER_PRIV_KEY)
    const signature = await masterSigner.signMessage(ethers.utils.arrayify(hash))
    return signature
}

async function getHumanByCreate2SaltFromContract(create2Salt) {
    const factory = getFactoryContract()
    return await factory["getHuman(bytes32)"](create2Salt)
}

async function getHumanByDeployParamsFromContract(safeOwners, timelock, owner, master, policies, inactivityTime, projectSalt) {
    const factory = getFactoryContract()
    return await factory["getHuman(address[],uint256,address,address,address,uint256,bytes32)"](safeOwners, timelock, owner, master, policies, inactivityTime, projectSalt)
}

async function getHumanByDeployParams(safeOwners, timelock, owner, master, policies, inactivityTime, projectSalt) {
    const create2Salt = ethers.utils.keccak256(ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256", "address", "address", "address", "uint256", "bytes32"],
        [safeOwners, timelock, owner, master, policies, inactivityTime, projectSalt]
    )))
    return getHumanByCreate2Salt(create2Salt)
}

async function getHumanByCreate2Salt(create2Salt) {
    const initCode = ethers.utils.solidityPack(["bytes", "bytes"], [BEACON_PROXY_BYTECODE, ethers.utils.defaultAbiCoder.encode(["address", "string"], [BEACON_ADDRESS, ""])])
    const initCodeHash = ethers.utils.keccak256(initCode)
    return ethers.utils.getCreate2Address(HUMAN_FACTORY_ADDRESS, create2Salt, initCodeHash)
}

async function getHumanNonce(humanAddress) {
    const humanContract = getHumanContract(humanAddress)
    try {
        return await humanContract.nonce()
    } catch (error) {
        return ethers.BigNumber.from("0")
    }
}

function getExecuteData(target, value, data, signature) {
    const operationType = "0" //v1 only allows operationType = 0
    const executeData = ethers.utils.defaultAbiCoder.encode(["bytes", "bytes"], [data, signature])
    return encodeFunctionData(HUMAN_ABI, "execute(uint256,address,uint256,bytes)", [operationType, target, value, executeData])
}

function encodeFunctionData(abi, functionName, paramsArray) {
    const contract = new ethers.Contract(ethers.constants.AddressZero, abi)
    return contract.interface.encodeFunctionData(functionName, paramsArray)
}

module.exports = { getSignedUserOperation, getUserOpInitCode, getHumanByDeployParams, getHumanByCreate2Salt, getHumanByCreate2SaltFromContract, getHumanByDeployParamsFromContract }