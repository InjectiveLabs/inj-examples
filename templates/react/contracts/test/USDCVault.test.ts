import { expect } from "chai";
import { ethers } from "hardhat";
import { USDCVault } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("USDCVault", function () {
  let vault: USDCVault;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("USDCVault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      expect(await vault.USDC_ADDRESS()).to.equal("0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d");
    });

    it("Should start with zero total deposited", async function () {
      expect(await vault.totalDeposited()).to.equal(0);
    });
  });

  describe("Deposits and Withdrawals", function () {
    it("Should revert on zero amount deposit", async function () {
      await expect(vault.deposit(0)).to.be.revertedWithCustomError(vault, "ZeroAmount");
    });

    it("Should revert on zero amount withdrawal", async function () {
      await expect(vault.withdraw(0)).to.be.revertedWithCustomError(vault, "ZeroAmount");
    });

    it("Should track user deposits correctly", async function () {
      const address = await vault.getAddress();
      expect(await vault.getUserDeposit(user1.address)).to.equal(0);
    });
  });

  describe("View Functions", function () {
    it("Should return vault balance", async function () {
      const balance = await vault.getVaultBalance();
      expect(balance).to.equal(0);
    });

    it("Should return user deposit", async function () {
      const deposit = await vault.getUserDeposit(user1.address);
      expect(deposit).to.equal(0);
    });
  });
});
