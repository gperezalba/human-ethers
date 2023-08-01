const { deployHuman } = require("./Factory");

main()
async function main() {
    const safeOwners = ["0xCD7669AAFffB7F683995E6eD9b53d1E5FE72c142", "0x30729B6910757042024304E56BEB015821462691", "0xDB970fD8Ed083D0Dc6000fa1e4973F27d8eDA2A9"]
    const safeSalt = parseInt(Date.now() / 1000)
    const timelock = "3600" //1h
    const owner = "0xCD7669AAFffB7F683995E6eD9b53d1E5FE72c142"
    const master = "0x44eEdBEE931A5dc22a5f4Ad441679FD5C0e38D38"
    const inactivityTime = "7200" //2h
    const email = "email2@humanwallet.com"
    deployHuman(safeOwners, safeSalt, timelock, owner, master, inactivityTime, email)
}