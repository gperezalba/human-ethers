const { ethers } = require("ethers");
const { TOKEN_MOCK_ABI } = require("./Constants");
const { getEmptyUserOperation, getUserOpHash } = require("./UserOperation");
require('dotenv').config()

main()
async function main() {
    const entryPointAddress = "0xce71065d4017f316ec606fe4422e11eb2c47c246";
    const chainId = ethers.BigNumber.from("31337")
    const _bytes = encodeFunctionData(TOKEN_MOCK_ABI, "transfer", ["0x00000000000000000000000000000000000a71ce", ethers.BigNumber.from("12345")])
    const op = {
        ...getEmptyUserOperation(),
        sender: "0xCD7669AAFffB7F683995E6eD9b53d1E5FE72c142",
        nonce: ethers.BigNumber.from("7"),
        initCode: _bytes,
        callData: _bytes,
        callGasLimit: ethers.BigNumber.from("123456789012345678901234567890123456789012345678901234567890"),
        verificationGasLimit: ethers.BigNumber.from("987654321987654321987654321987654321987654321987654321"),
        preVerificationGas: ethers.BigNumber.from("122333444455555122333444455555122333444455555122333444455555"),
        maxFeePerGas: ethers.constants.MaxUint256,
        maxPriorityFeePerGas: ethers.constants.MaxUint256,
        paymasterAndData: _bytes,
    }
    const hash = getUserOpHash(op, entryPointAddress, chainId)
    console.log(hash) //MUST be 0xac99921716a323c24ac73a6d938b01cf5d08d6578066487a8e36fbfb95fd8b12
}

function encodeFunctionData(abi, functionName, paramsArray) {
    const contract = new ethers.Contract(ethers.constants.AddressZero, abi)
    return contract.interface.encodeFunctionData(functionName, paramsArray)
}