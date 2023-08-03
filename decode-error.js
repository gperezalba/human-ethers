const { ethers } = require("ethers");
require('dotenv').config()

//https://soliditylang.org/blog/2021/04/21/custom-errors/

main()
async function main() {
    const data = "0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001348756d616e3a324641207369676e617475726500000000000000000000000000"
    const interface = new ethers.utils.Interface([
        "function Error(string)"
    ])
    const result = interface.decodeFunctionData(interface.functions["Error(string)"], data)
    console.log(result)
}