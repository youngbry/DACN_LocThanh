const { ethers } = require("hardhat");

async function main() {
  const provider = ethers.provider;
  const currentBlock = await provider.getBlockNumber();

  console.log(`📦 Current Block Height: ${currentBlock}`);
  console.log("=".repeat(50));

  console.log("Listing all blocks:");

  for (let i = 0; i <= currentBlock; i++) {
    const block = await provider.getBlock(i);
    console.log(`🧱 Block #${block.number}`);
    console.log(`   Hash: ${block.hash}`);
    console.log(
      `   Timestamp: ${new Date(
        Number(block.timestamp) * 1000
      ).toLocaleString()}`
    );
    console.log(`   Transactions: ${block.transactions.length}`);

    // In Hardhat/Ethers v6, transactions might be objects or hashes depending on how getBlock is called.
    // Usually getBlock(i) returns transaction hashes by default or if prefetch is not enabled.
    // Let's just print the count and maybe the first few hashes if available.

    if (block.transactions.length > 0) {
      console.log(`   Tx Hashes:`);
      // block.transactions is an array of strings (hashes) or objects
      block.transactions.forEach((tx) => {
        const txHash = typeof tx === "string" ? tx : tx.hash;
        console.log(`      - ${txHash}`);
      });
    }
    console.log("-".repeat(30));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
