import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
} from "../blockchain/MotorbikeMarketplace";
import { CONTRACT_ADDRESS, ABI as NFT_ABI } from "../blockchain/MotorbikeNFT";

const RPC_ENDPOINTS = ["http://127.0.0.1:8545", "http://localhost:8545"];

const Marketplace = () => {
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState([]);
  const [error, setError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [buyingTokenId, setBuyingTokenId] = useState(null);

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getReadableProvider = useCallback(async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        await browserProvider.getNetwork();
        return browserProvider;
      } catch (browserError) {
        console.warn("Browser provider unavailable", browserError);
      }
    }

    for (const rpcUrl of RPC_ENDPOINTS) {
      try {
        const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
        await rpcProvider.getNetwork();
        return rpcProvider;
      } catch (rpcError) {
        console.warn(`RPC ${rpcUrl} failed`, rpcError);
      }
    }

    throw new Error("Không thể kết nối tới mạng blockchain");
  }, []);

  const loadMarketplaceData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const provider = await getReadableProvider();
      const marketplaceContract = new ethers.Contract(
        MARKETPLACE_ADDRESS,
        MARKETPLACE_ABI,
        provider
      );
      const nftContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        NFT_ABI,
        provider
      );

      const listings = await marketplaceContract.getActiveListings();

      const enriched = await Promise.all(
        listings.map(async (listing) => {
          try {
            const tokenId = Number(listing.tokenId);
            const motorbike = await nftContract.getMotorbike(tokenId);

            return {
              tokenId,
              seller: listing.seller,
              priceEth: ethers.formatEther(listing.price),
              priceRaw: listing.price,
              listedAt: Number(listing.listedAt),
              model: motorbike.model,
              year: motorbike.year?.toString?.() || "",
              color: motorbike.color,
              vin: motorbike.vin,
              engineNumber: motorbike.engineNumber,
            };
          } catch (innerError) {
            console.error(`Không thể tải NFT #${listing.tokenId}`, innerError);
            return null;
          }
        })
      );

      const filtered = enriched.filter(Boolean);
      filtered.sort((a, b) => b.listedAt - a.listedAt);
      setNfts(filtered);
    } catch (loadError) {
      console.error("loadMarketplaceData", loadError);
      setError(loadError?.message || "Không thể tải dữ liệu marketplace");
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [getReadableProvider]);

  const checkWalletConnection = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      } else {
        setWalletAddress("");
      }
    } catch (walletError) {
      console.warn("checkWalletConnection", walletError);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await checkWalletConnection();
      if (mounted) {
        await loadMarketplaceData();
      }
    };

    init().catch(() => {});

    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        setWalletAddress(accounts.length > 0 ? accounts[0] : "");
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        mounted = false;
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }

    return () => {
      mounted = false;
    };
  }, [checkWalletConnection, loadMarketplaceData]);

  const handleConnectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("Vui lòng cài đặt Rabby hoặc MetaMask");
      return null;
    }

    try {
      setIsConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const account = accounts?.[0] || "";
      setWalletAddress(account);
      setError("");
      return account;
    } catch (connectError) {
      console.error("handleConnectWallet", connectError);
      setError("Không thể kết nối ví của bạn");
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const ensureWallet = async () => {
    if (walletAddress) {
      return walletAddress;
    }
    return await handleConnectWallet();
  };

  const handleBuy = async (nft) => {
    try {
      const account = await ensureWallet();
      if (!account) {
        return;
      }

      if (!window.ethereum) {
        setError("Không phát hiện ví trên trình duyệt");
        return;
      }

      setBuyingTokenId(nft.tokenId);
      setError("");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplaceContract = new ethers.Contract(
        MARKETPLACE_ADDRESS,
        MARKETPLACE_ABI,
        signer
      );

      const tx = await marketplaceContract.buyNFT(nft.tokenId, {
        value: nft.priceRaw,
      });
      await tx.wait();

      await loadMarketplaceData();
      alert(`✅ Mua NFT #${nft.tokenId} thành công!`);
    } catch (buyError) {
      console.error("handleBuy", buyError);

      const message = buyError?.message || "";
      if (message.includes("user rejected")) {
        setError("Bạn đã từ chối giao dịch mua");
      } else if (message.includes("insufficient funds")) {
        setError("Không đủ ETH để thanh toán");
      } else {
        setError("Không thể mua NFT. Vui lòng thử lại");
      }
    } finally {
      setBuyingTokenId(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: "2rem 0",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 1.5rem",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "800",
              marginBottom: "0.5rem",
              background: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🛒 Chợ NFT Xe Máy
          </h1>
          <p
            style={{
              color: "#64748b",
              fontSize: "1.125rem",
              margin: 0,
            }}
          >
            Khám phá và mua các NFT xe máy độc đáo
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: "0.95rem",
            }}
          >
            {walletAddress
              ? `Đang kết nối với ví ${formatAddress(walletAddress)}`
              : "Chưa kết nối ví"}
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={loadMarketplaceData}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "999px",
                border: "1px solid #2563eb",
                background: "white",
                color: "#2563eb",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🔄 Làm mới
            </button>
            <button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: "999px",
                border: "none",
                background: "linear-gradient(135deg, #2563eb, #06b6d4)",
                color: "white",
                fontWeight: 600,
                cursor: isConnecting ? "not-allowed" : "pointer",
                opacity: isConnecting ? 0.7 : 1,
              }}
            >
              {isConnecting ? "Đang kết nối..." : "🔗 Kết nối ví"}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              borderRadius: "12px",
              background: "rgba(220, 38, 38, 0.12)",
              color: "#b91c1c",
              fontWeight: 500,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "360px",
              color: "#64748b",
            }}
          >
            <div
              style={{
                width: "3rem",
                height: "3rem",
                border: "3px solid #e2e8f0",
                borderTop: "3px solid #2563eb",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: "1rem",
              }}
            ></div>
            <p>Đang tải các NFT đang bán...</p>
          </div>
        ) : nfts.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              textAlign: "center",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛍️</div>
            <h2 style={{ margin: "0 0 0.5rem", color: "#1e293b" }}>
              Chưa có NFT nào đang được bán
            </h2>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              Hãy thử làm mới trang hoặc quay lại sau.
            </p>
            <Link
              to="/user"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                borderRadius: "999px",
                textDecoration: "none",
                fontWeight: 600,
                color: "white",
                background: "linear-gradient(135deg, #2563eb, #06b6d4)",
              }}
            >
              🏍️ Quản lý NFT của tôi
            </Link>
          </div>
        ) : (
          <div>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "2rem",
              }}
            >
              NFT đang bán ({nfts.length})
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {nfts.map((nft) => (
                <div
                  key={nft.tokenId}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      background:
                        "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "4rem",
                      color: "white",
                    }}
                  >
                    🏍️
                  </div>

                  <div style={{ padding: "1.5rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "700",
                          color: "#1e293b",
                          margin: 0,
                        }}
                      >
                        {nft.model || `NFT #${nft.tokenId}`}
                      </h3>
                      <div
                        style={{
                          fontSize: "1.125rem",
                          fontWeight: "700",
                          color: "#059669",
                        }}
                      >
                        {nft.priceEth} ETH
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "0.5rem",
                        marginBottom: "1.25rem",
                        fontSize: "0.9rem",
                        color: "#64748b",
                      }}
                    >
                      <div>VIN: {nft.vin || "(n/a)"}</div>
                      <div>Số máy: {nft.engineNumber || "(n/a)"}</div>
                      <div>{`Màu: ${nft.color || "(n/a)"} · Năm: ${
                        nft.year || "(n/a)"
                      }`}</div>
                      <div>Người bán: {formatAddress(nft.seller)}</div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                      }}
                    >
                      <Link
                        to={`/user/nft/${nft.tokenId}`}
                        style={{
                          flex: 1,
                          padding: "0.75rem",
                          background: "#f8fafc",
                          color: "#64748b",
                          textDecoration: "none",
                          borderRadius: "8px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "0.875rem",
                        }}
                      >
                        Chi tiết
                      </Link>

                      <button
                        onClick={() => handleBuy(nft)}
                        disabled={buyingTokenId === nft.tokenId}
                        style={{
                          flex: 1,
                          padding: "0.75rem",
                          background: "#2563eb",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "600",
                          fontSize: "0.9rem",
                          cursor:
                            buyingTokenId === nft.tokenId
                              ? "not-allowed"
                              : "pointer",
                          opacity: buyingTokenId === nft.tokenId ? 0.7 : 1,
                        }}
                      >
                        {buyingTokenId === nft.tokenId
                          ? "Đang xử lý..."
                          : "Mua ngay"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `,
        }}
      />
    </div>
  );
};

export default Marketplace;
