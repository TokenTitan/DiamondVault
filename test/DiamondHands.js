const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

let DiamondHands;
const WETHAddress = "0x4200000000000000000000000000000000000006";
let USDC;
const AggregatorAddress = "0xcD2A119bD1F7DF95d706DE6F2057fDD45A0503E2";
let wETH, Aggregator;
let deployer, user1, user2;

describe("Diamond Hands Vault Contract.", async function () {
  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();
    wETH = await ethers.getContractAt("WETH9", WETHAddress);
    Aggregator = await ethers.getContractAt(
      "AggregatorV3Interface",
      AggregatorAddress
    );
    USDC = await ethers.deployContract("MockToken", ["USDC", "USDC"]);
    console.log("USDC deployed at ", await USDC.getAddress());

    DiamondHands = await ethers.deployContract("DiamondHands", [
      WETHAddress,
      await USDC.getAddress(),
      AggregatorAddress,
      "vaultToken",
      "vt",
    ]);
    console.log("DiamondHands deployed at ", await DiamondHands.getAddress());
  });

  describe("Deposit WETH Token", async function () {
    it("user deposit  WETH token in return for vault token", async () => {
      expect(await wETH.balanceOf(user2.address)).to.be.equals(0);
      await wETH.connect(user2).deposit({ value: "100" });
      expect(await wETH.balanceOf(user2.address)).to.be.equals(100);

      await wETH.connect(user2).approve(await DiamondHands.getAddress(), 100);

      const userVTokenBeforeDeposit = await DiamondHands.balanceOf(
        user2.address
      );
      await DiamondHands.connect(user2).deposit(100, user2.address);
      expect(
        (await DiamondHands.balanceOf(user2.address)) - userVTokenBeforeDeposit
      ).to.be.equal(await DiamondHands.previewDeposit(100));
    });

    it("user can deposit WETH for exact number of VToken in return using mint", async () => {
      expect(await wETH.balanceOf(user2.address)).to.be.equals(0);
      await wETH.connect(user2).deposit({ value: "200" });
      expect(await wETH.balanceOf(user2.address)).to.be.equals(200);

      await wETH.connect(user2).approve(await DiamondHands.getAddress(), 200);

      const userVTokenBeforeMint = await DiamondHands.balanceOf(user2.address);
      await DiamondHands.connect(user2).mint(200, user2.address);
      expect(
        (await DiamondHands.balanceOf(user2.address)) - userVTokenBeforeMint
      ).to.be.equal(await DiamondHands.previewMint(200));
    });
  });

  describe("Withdraw WETH Token", async () => {
    it("user can withdraw WETH tokens along with the reward earned", async () => {
      await wETH.connect(user1).deposit({ value: "100" });
      await wETH.connect(user1).approve(await DiamondHands.getAddress(), 100);
      await DiamondHands.connect(user1).deposit(100, user1.address);

      expect(await USDC.balanceOf(deployer.address)).to.not.be.equal(0);
      await USDC.connect(deployer).transfer(
        DiamondHands.getAddress(),
        await USDC.balanceOf(deployer.address)
      );
      userVTokenBeforeWithdraw = await DiamondHands.balanceOf(user1.address);
      userWETHTokenBeforeWithdraw = await wETH.balanceOf(user1.address);
      userUSDTokenBeforeWithdraw = await USDC.balanceOf(user1.address);
      await DiamondHands.connect(user1).withdraw(
        100,
        user1.address,
        user1.address
      );
      expect(await DiamondHands.balanceOf(user1.address)).to.be.equal(
        userVTokenBeforeWithdraw - (await DiamondHands.previewWithdraw(100))
      );
      expect(await wETH.balanceOf(user1.address)).to.be.equal(
        userWETHTokenBeforeWithdraw + 100n
      );
      expect(await USDC.balanceOf(user1.address)).to.be.greaterThan(
        userUSDTokenBeforeWithdraw
      );
    });
    it("user can redeem vault token in exchange for their asset and reward", async () => {
      await wETH.connect(user1).deposit({ value: "200" });
      await wETH.connect(user1).approve(await DiamondHands.getAddress(), 200);
      await DiamondHands.connect(user1).deposit(200, user1.address);

      expect(await USDC.balanceOf(deployer.address)).to.not.be.equal(0);
      await USDC.connect(deployer).transfer(
        DiamondHands.getAddress(),
        await USDC.balanceOf(deployer.address)
      );
      userVTokenBeforeRedeem = await DiamondHands.balanceOf(user1.address);
      userWETHTokenBeforeRedeem = await wETH.balanceOf(user1.address);
      userUSDTokenBeforeRedeem = await USDC.balanceOf(user1.address);
      await DiamondHands.connect(user1).redeem(
        userVTokenBeforeRedeem,
        user1.address,
        user1.address
      );
      expect(await DiamondHands.balanceOf(user1.address)).to.be.equal(0);
      expect(await wETH.balanceOf(user1.address)).to.be.equal(
        userWETHTokenBeforeRedeem +
          (await DiamondHands.previewRedeem(userVTokenBeforeRedeem))
      );
      expect(await USDC.balanceOf(user1.address)).to.be.greaterThan(
        userUSDTokenBeforeRedeem
      );
    });
  });
});
