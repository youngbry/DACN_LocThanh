import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import "./Marketplace.css";

import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
} from "../blockchain/MotorbikeMarketplace";
import { CONTRACT_ADDRESS, ABI as NFT_ABI } from "../blockchain/MotorbikeNFT";

import "./MyNFTs.css"; // dùng lại style nền, card, button...

const RPC_ENDPOINTS = ["http://127.0.0.1:8545", "http://localhost:8545"];

const Marketplace = () => {
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState([]);
  const [error, setError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [buyingTokenId, setBuyingTokenId] = useState(null);
  const [currentEthRate, setCurrentEthRate] = useState(null);

  // Filters
  const [filterModel, setFilterModel] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Price edit
  const [editingTokenId, setEditingTokenId] = useState(null);
  const [newPriceEth, setNewPriceEth] = useState("");

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
      const ethVndPrice = await marketplaceContract.ethVndPrice();
      setCurrentEthRate(ethVndPrice.toString());

      const enriched = await Promise.all(
        listings.map(async (listing) => {
          try {
            const tokenId = Number(listing.tokenId);
            const motorbike = await nftContract.getMotorbike(tokenId);

            // Calculate required ETH for this VND price
            const requiredEthWei = await marketplaceContract.getRequiredEth(
              tokenId
            );
            const requiredEth = ethers.formatEther(requiredEthWei);

            // Price history
            let history = [];
            try {
              const rawHistory = await marketplaceContract.getPriceHistory(
                tokenId
              );
              history = rawHistory.map((h) => ({
                oldPriceVnd: h.oldPrice.toString(),
                newPriceVnd: h.newPrice.toString(),
                timestamp: Number(h.timestamp),
              }));
            } catch (_) {
              history = [];
            }

            return {
              tokenId,
              seller: listing.seller,
              priceVnd: listing.price.toString(),
              requiredEth: requiredEth,
              requiredEthWei: requiredEthWei,
              listedAt: Number(listing.listedAt),
              model: motorbike.model,
              year: motorbike.year?.toString?.() || "",
              color: motorbike.color,
              vin: motorbike.vin,
              engineNumber: motorbike.engineNumber,
              priceHistory: history,
            };
          } catch (innerError) {
            console.error(`Không thể tải NFT #${listing.tokenId}`, innerError);
            return null;
          }
        })
      );

      const filtered = enriched.filter(Boolean);

      // Apply filters
      const modelLower = filterModel.toLowerCase();
      const colorLower = filterColor.toLowerCase();
      const yearFilter = filterYear.trim();
      const minP = minPrice ? parseFloat(minPrice) : null;
      const maxP = maxPrice ? parseFloat(maxPrice) : null;

      const afterFilter = filtered.filter((n) => {
        if (modelLower && !(n.model || "").toLowerCase().includes(modelLower))
          return false;
        if (colorLower && !(n.color || "").toLowerCase().includes(colorLower))
          return false;
        if (yearFilter && n.year !== yearFilter) return false;
        const priceNum = parseFloat(n.priceVnd);
        if (minP !== null && priceNum < minP) return false;
        if (maxP !== null && priceNum > maxP) return false;
        return true;
      });

      afterFilter.sort((a, b) => b.listedAt - a.listedAt);
      setNfts(afterFilter);
    } catch (loadError) {
      console.error("loadMarketplaceData", loadError);
      setError(loadError?.message || "Không thể tải dữ liệu marketplace");
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [
    getReadableProvider,
    filterModel,
    filterColor,
    filterYear,
    minPrice,
    maxPrice,
  ]);

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
        value: nft.requiredEthWei,
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

  const startEditPrice = (nft) => {
    setEditingTokenId(nft.tokenId);
    setNewPriceEth(formatVND(nft.priceVnd.toString())); // Reusing state name but it's VND now
  };

  const cancelEdit = () => {
    setEditingTokenId(null);
    setNewPriceEth("");
  };

  // Hàm định dạng số với dấu chấm phân cách
  const formatVND = (value) => {
    if (!value) return "";
    const number = value.toString().replace(/\D/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePriceChange = (e) => {
    setNewPriceEth(formatVND(e.target.value));
  };

  const saveNewPrice = async (nft) => {
    try {
      const account = await ensureWallet();
      if (!account) return;
      if (!window.ethereum) {
        setError("Không phát hiện ví trên trình duyệt");
        return;
      }

      const rawPrice = newPriceEth.replace(/\./g, "");
      if (
        !rawPrice ||
        isNaN(parseFloat(rawPrice)) ||
        parseFloat(rawPrice) <= 0
      ) {
        setError("Giá mới không hợp lệ");
        return;
      }
      setError("");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplaceContract = new ethers.Contract(
        MARKETPLACE_ADDRESS,
        MARKETPLACE_ABI,
        signer
      );
      const vndPrice = Math.floor(parseFloat(rawPrice));
      const tx = await marketplaceContract.updatePrice(nft.tokenId, vndPrice);
      await tx.wait();
      await loadMarketplaceData();
      setEditingTokenId(null);
      alert(`✅ Cập nhật giá NFT #${nft.tokenId} thành công!`);
    } catch (e) {
      console.error("saveNewPrice", e);
      setError("Không thể cập nhật giá. Thử lại.");
    }
  };

  // --------- UI PHẦN LOADING (đồng bộ MyNFTs) ----------
  if (loading) {
    return (
      <div className="mynft-loading-wrapper">
        <div className="mynft-spinner"></div>
        <p>Đang tải các NFT đang bán...</p>
      </div>
    );
  }

  // --------- UI CHÍNH ----------
  return (
    <div className="mynft-container marketplace-page">
      {/* HEADER giống MyNFTs */}
      <div className="mynft-header-card">
        <div>
          <h1>🛒 Chợ NFT Xe Máy</h1>
          <p>Khám phá và mua các NFT xe máy độc đáo</p>
          {currentEthRate && (
            <div className="live-rate-badge">
              <span className="pulse-dot"></span>
              Tỷ giá trực tiếp: 1 ETH ={" "}
              {Number(currentEthRate).toLocaleString()} VND
            </div>
          )}
        </div>

        <div className="mynft-wallet-box">
          <div className="wallet-label">Trạng thái ví</div>

          {walletAddress ? (
            <>
              <div className="wallet-address">
                {formatAddress(walletAddress)}
              </div>
              <div className="wallet-status">
                <span></span> Đã kết nối
              </div>
            </>
          ) : (
            <>
              <div className="wallet-address">Chưa kết nối</div>
              <button
                className="mynft-btn connect"
                onClick={handleConnectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? "Đang kết nối..." : "🔗 Kết nối ví"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* BỘ LỌC – hiển thị trong card giống style MyNFTs */}
      <div className="market-filters-card">
        <div className="market-filters-title">🔍 Bộ lọc nâng cao</div>

        <div className="market-filters-grid">
          <input
            className="market-input"
            placeholder="Model"
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
          />
          <input
            className="market-input"
            placeholder="Màu"
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value)}
          />
          <input
            className="market-input"
            placeholder="Năm"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          />
          <input
            className="market-input"
            placeholder="Giá tối thiểu (VND)"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            className="market-input"
            placeholder="Giá tối đa (VND)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        <div className="market-filters-actions">
          <button onClick={loadMarketplaceData} className="mynft-btn primary">
            Áp dụng
          </button>
          <button
            className="mynft-btn secondary"
            onClick={() => {
              setFilterModel("");
              setFilterColor("");
              setFilterYear("");
              setMinPrice("");
              setMaxPrice("");
              loadMarketplaceData();
            }}
          >
            Xóa lọc
          </button>
          <button className="mynft-btn refresh" onClick={loadMarketplaceData}>
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* THÔNG BÁO LỖI */}
      {error && (
        <div className="market-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* DANH SÁCH NFT / TRẠNG THÁI RỖNG */}
      {nfts.length === 0 ? (
        <div className="mynft-empty">
          <div className="empty-icon">🛍️</div>
          <h3>Chưa có NFT nào đang được bán</h3>
          <p>Hãy thử làm mới trang hoặc quay lại sau.</p>
          <Link to="/user" className="mynft-btn primary">
            🏍️ Quản lý NFT của tôi
          </Link>
        </div>
      ) : (
        <>
          <div className="market-section-title">
            NFT đang bán ({nfts.length})
          </div>

          <div className="mynft-grid market-grid">
            {nfts.map((nft) => {
              const isOwner =
                walletAddress &&
                walletAddress.toLowerCase() === nft.seller.toLowerCase();

              return (
                <div className="mynft-card" key={nft.tokenId}>
                  <div className="mynft-banner">🏍️</div>

                  <div className="mynft-content">
                    <div className="mynft-top">
                      <span className="id">#{nft.tokenId}</span>
                      <span className="year">{nft.year || "(n/a)"}</span>
                      <div className="price-container">
                        <span className="price-tag">
                          {Number(nft.priceVnd).toLocaleString()} VND
                        </span>
                        <span className="eth-sub">~ {nft.requiredEth} ETH</span>
                      </div>
                    </div>

                    <h3 className="model">
                      {nft.model || `NFT #${nft.tokenId}`}
                    </h3>

                    <div className="details">
                      <div className="row">
                        <span className="label">VIN</span>
                        <span className="value">{nft.vin || "(n/a)"}</span>
                      </div>
                      <div className="row">
                        <span className="label">Số máy</span>
                        <span className="value">
                          {nft.engineNumber || "(n/a)"}
                        </span>
                      </div>
                      <div className="row">
                        <span className="label">Màu / Năm</span>
                        <span className="value">
                          {nft.color || "(n/a)"} · {nft.year || "(n/a)"}
                        </span>
                      </div>
                      <div className="row">
                        <span className="label">Người bán</span>
                        <span className="value">
                          {formatAddress(nft.seller)}
                        </span>
                      </div>

                      {nft.priceHistory && nft.priceHistory.length > 0 && (
                        <div className="market-history">
                          <span className="label">Lịch sử giá</span>
                          <ul>
                            {nft.priceHistory
                              .slice(-3)
                              .reverse()
                              .map((h, idx) => (
                                <li key={idx}>
                                  {Number(h.oldPriceVnd).toLocaleString()} →{" "}
                                  {Number(h.newPriceVnd).toLocaleString()} VND (
                                  {new Date(
                                    h.timestamp * 1000
                                  ).toLocaleDateString()}
                                  )
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="actions">
                      <Link
                        to={`/user/nft/${nft.tokenId}`}
                        className="mynft-btn secondary"
                      >
                        👁️ Chi tiết
                      </Link>

                      <button
                        onClick={() => handleBuy(nft)}
                        disabled={buyingTokenId === nft.tokenId}
                        className="mynft-btn primary"
                      >
                        {buyingTokenId === nft.tokenId
                          ? "Đang xử lý..."
                          : "Mua ngay"}
                      </button>

                      {isOwner &&
                        (editingTokenId === nft.tokenId ? (
                          <div className="market-edit-wrapper">
                            <input
                              type="text"
                              value={newPriceEth}
                              onChange={handlePriceChange}
                              placeholder="Giá mới (VND)"
                              className="market-input small"
                            />
                            <div className="market-edit-actions">
                              <button
                                onClick={() => saveNewPrice(nft)}
                                className="mynft-btn primary"
                              >
                                Lưu
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="mynft-btn secondary"
                              >
                                Huỷ
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditPrice(nft)}
                            className="mynft-btn secondary"
                          >
                            ✏️ Sửa giá
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Marketplace;
