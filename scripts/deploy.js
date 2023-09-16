const hre = require("hardhat");
async function main() {
  const contract = await hre.ethers.getContractFactory("DiamondHands");
  const DiamondHands = await contract.deploy(
    "0x4200000000000000000000000000000000000006",
    "0x2e9f75df8839ff192da27e977cd154fd1eae03cf",
    "0xcd2a119bd1f7df95d706de6f2057fdd45a0503e2",
    "VToken",
    "VT"
  );
  await DiamondHands.waitForDeployment();
  console.log(DiamondHands);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
