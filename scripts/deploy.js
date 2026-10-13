const hre = require("hardhat");

async function main() {
  const PAYMENT_TOKEN = "0x1283abdaedf2a556ef3fd98409b55efa725fb071";
  const RECIPIENT = "0x49ca95109188b814139ccf7E17aB3CB0D808a679";
  const BASE_URI = "https://mi-juego.com/metadata/";

  const GameStoreAutoNFTV2 = await hre.ethers.getContractFactory("GameStoreAutoNFTV2");
  const store = await GameStoreAutoNFTV2.deploy(PAYMENT_TOKEN, RECIPIENT, BASE_URI);
  await store.deployed();

  console.log("GameStoreAutoNFTV2 deployed to:", store.address);

  const items = [
    { id: 101, tokenPrice: "1000000000000000000", nativePrice: "10000000000000000", maxSupply: 500, rarity: 3, maxPerWallet: 3, uri: `${BASE_URI}101.json` },
    { id: 102, tokenPrice: "2500000000000000000", nativePrice: "20000000000000000", maxSupply: 250, rarity: 4, maxPerWallet: 1, uri: `${BASE_URI}102.json` },
    { id: 103, tokenPrice: "5000000000000000000", nativePrice: "50000000000000000", maxSupply: 100, rarity: 4, maxPerWallet: 1, uri: `${BASE_URI}103.json` }
  ];

  for (const item of items) {
    await store.setItem(
      item.id,
      item.tokenPrice,
      item.nativePrice,
      item.maxSupply,
      item.rarity,
      item.maxPerWallet,
      true,
      item.uri
    );
    console.log(`Item ${item.id} configured.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
