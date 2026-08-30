import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "INJ");

  const Vault = await ethers.getContractFactory("USDCVault");
  console.log("Deploying USDCVault...");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  console.log("\n✅ USDCVault deployed!");
  console.log("   Contract address:", address);
  console.log("   Network: Injective EVM Testnet (Chain ID 1439)");
  console.log("   Explorer: https://testnet.blockscout.injective.network/address/" + address);
  console.log("\nAdd to frontend/.env:");
  console.log("   VITE_VAULT_ADDRESS=" + address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
