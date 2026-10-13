import { useEffect, useState } from "react";
import { Contract, formatEther } from "ethers";
import { useAccount, useConnect, useDisconnect, useProvider, useSigner } from "wagmi";
import { storeAbi, tokenAbi } from "./abi";
import { STORE_ADDRESS, PAYMENT_TOKEN, ITEM_IDS, ITEM_ID, QUANTITY } from "./constants";
import GameScene from "./GameScene";
import MobileControls from "./MobileControls";
import "./styles.css";

const rarityLabels = ["Common", "Rare", "Epic", "Legendary"];

export default function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: signer } = useSigner();
  const provider = useProvider();

  const [storeContract, setStoreContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(ITEM_ID);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [equippedSkin, setEquippedSkin] = useState("gold");
  const [movement, setMovement] = useState({ forward: false, backward: false, left: false, right: false });

  useEffect(() => {
    if (!signer || !address) return;

    const contract = new Contract(STORE_ADDRESS, storeAbi, signer);
    const token = new Contract(PAYMENT_TOKEN, tokenAbi, signer);
    setStoreContract(contract);
    setTokenContract(token);

    const read = new Contract(STORE_ADDRESS, storeAbi, provider);
    read.on("Purchase", (buyer, tokenAddr, amount, itemId, quantity, rarity, ts) => {
      if (buyer.toLowerCase() === address.toLowerCase()) {
        setMessage("¡Skin comprada y añadida a tu inventario!");
        const itemIdNum = Number(itemId);
        const selectedSkin = itemIdNum === 101 ? "red" : itemIdNum === 102 ? "blue" : "gold";
        setEquippedSkin(selectedSkin);
      }
    });

    return () => {
      try { read.removeAllListeners("Purchase"); } catch (_) {}
    };
  }, [signer, address, provider]);

  useEffect(() => {
    if (!storeContract) return;
    loadInventory();
  }, [storeContract]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return;
      if (e.key === "w" || e.key === "W") setMovement(m => ({ ...m, forward: true }));
      if (e.key === "s" || e.key === "S") setMovement(m => ({ ...m, backward: true }));
      if (e.key === "a" || e.key === "A") setMovement(m => ({ ...m, left: true }));
      if (e.key === "d" || e.key === "D") setMovement(m => ({ ...m, right: true }));
    };

    const onKeyUp = (e) => {
      if (e.key === "w" || e.key === "W") setMovement(m => ({ ...m, forward: false }));
      if (e.key === "s" || e.key === "S") setMovement(m => ({ ...m, backward: false }));
      if (e.key === "a" || e.key === "A") setMovement(m => ({ ...m, left: false }));
      if (e.key === "d" || e.key === "D") setMovement(m => ({ ...m, right: false }));
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const handleMobileStart = (dir) => {
    setMovement(m => ({ ...m, [dir]: true }));
  };

  const handleMobileEnd = (dir) => {
    setMovement(m => ({ ...m, [dir]: false }));
  };

  const isTouchDevice = typeof navigator !== "undefined" && (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

  const loadInventory = async () => {
    try {
      const items = [];
      for (const id of ITEM_IDS) {
        const raw = await storeContract.getItem(id);
        const [tokenPrice, nativePrice, maxSupply, totalSupply, rarity, maxPerWallet, active, uri] = raw;

        let metadata = {};
        try {
          const res = await fetch(uri);
          metadata = await res.json();
        } catch (e) {
          console.warn("Metadata not available", e);
        }

        items.push({
          itemId: id,
          tokenPrice,
          nativePrice,
          maxSupply,
          totalSupply,
          rarity,
          maxPerWallet,
          active,
          metadata
        });
      }
      setInventory(items);
    } catch (err) {
      console.error(err);
      setMessage("No se pudo cargar la tienda.");
    }
  };

  const connectInjected = () => {
    const injected = connectors.find(c => c.id === "injected");
    if (!injected) {
      setMessage("MetaMask/SafePal in-app no está disponible");
      return;
    }
    connect({ connector: injected });
  };

  const connectWalletConnect = () => {
    const wc = connectors.find(c => c.id === "walletConnect");
    if (!wc) {
      setMessage("WalletConnect no disponible. Revisa VITE_WC_PROJECT_ID.");
      return;
    }
    connect({ connector: wc });
  };

  async function buyWithToken() {
    if (!storeContract || !tokenContract || !address) {
      setMessage("Conecta una wallet primero.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Aprobando tokens...");
      const total = (await storeContract.tokenPrices(selectedItemId)).mul(QUANTITY);
      const balance = await tokenContract.balanceOf(address);

      if (balance.lt(total)) {
        setMessage("No tienes suficientes MORLES.");
        setLoading(false);
        return;
      }

      const approveTx = await tokenContract.approve(STORE_ADDRESS, total);
      await approveTx.wait();

      setMessage("Comprando...");
      const tx = await storeContract.buyWithToken(total, selectedItemId, QUANTITY);
      await tx.wait();

      setMessage("Compra con MORLES confirmada.");
      await loadInventory();
      setLoading(false);
    } catch (e) {
      console.error(e);
      setMessage("Error al comprar con MORLES.");
      setLoading(false);
    }
  }

  async function buyWithBnb() {
    if (!storeContract || !address) {
      setMessage("Conecta una wallet primero.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Comprando con BNB...");
      const total = (await storeContract.nativePrices(selectedItemId)).mul(QUANTITY);
      const tx = await storeContract.buyWithNative(selectedItemId, QUANTITY, { value: total });
      await tx.wait();

      setMessage("Compra con BNB confirmada.");
      await loadInventory();
      setLoading(false);
    } catch (e) {
      console.error(e);
      setMessage("Error al comprar con BNB.");
      setLoading(false);
    }
  }

  const selectedItem = inventory.find(item => item.itemId === selectedItemId) || inventory[0];

  return (
    <div className="layout">
      <div className="left-panel">
        <h1>Morles Royal</h1>

        <div className="buttonRow">
          {!isConnected && (
            <>
              <button className="primary" onClick={connectInjected}>Conectar MetaMask / SafePal dApp</button>
              <button className="secondary" onClick={connectWalletConnect}>Conectar SafePal QR</button>
            </>
          )}

          {isConnected && (
            <button className="danger" onClick={() => disconnect()}>Desconectar</button>
          )}
        </div>

        {address && (
          <div className="walletBox">
            Wallet: {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}

        {inventory.length > 0 && (
          <div className="shop-grid">
            {inventory.map((item) => (
              <button
                key={item.itemId}
                className={`item-button ${selectedItemId === item.itemId ? "selected" : ""}`}
                onClick={() => setSelectedItemId(item.itemId)}
              >
                <span>{item.metadata?.name || `Skin ${item.itemId}`}</span>
                <small>{rarityLabels[Number(item.rarity)] || "Unknown"}</small>
              </button>
            ))}
          </div>
        )}

        {selectedItem && (
          <>
            <img
              className="skin-image"
              src={selectedItem.metadata?.image || "https://placehold.co/600x400/1f2937/f3f4f6?text=Skin"}
              alt="Skin"
            />
            <h2>{selectedItem.metadata?.name || "Skin"}</h2>
            <p className="rarity">Rareza: {rarityLabels[Number(selectedItem.rarity)] || "Unknown"}</p>
            <p>Precio MORLES: {formatEther(selectedItem.tokenPrice)} MORLES</p>
            <p>Precio BNB: {formatEther(selectedItem.nativePrice)} BNB</p>
            <p>Stock: {selectedItem.maxSupply > 0 ? selectedItem.maxSupply - selectedItem.totalSupply : "Ilimitado"}</p>

            <div className="actions">
              <button className="success" onClick={buyWithToken} disabled={!isConnected || loading}>Comprar con MORLES</button>
              <button className="warning" onClick={buyWithBnb} disabled={!isConnected || loading}>Comprar con BNB</button>
            </div>
          </>
        )}

        {equipped && (
          <div className="equipped">Skin equipada: {equipped}</div>
        )}

        {message && (
          <div className="message">{message}</div>
        )}
      </div>

      <div className="game-panel">
        <GameScene
          items={inventory}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          equippedSkin={equippedSkin}
          movement={movement}
        />

        <MobileControls
          onStart={handleMobileStart}
          onEnd={handleMobileEnd}
          visible={isTouchDevice}
        />
      </div>
    </div>
  );
}
