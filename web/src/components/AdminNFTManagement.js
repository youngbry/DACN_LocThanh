import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ABI as CONTRACT_ABI,
} from "../blockchain/MotorbikeNFT";
import "./AdminNFTManagement.css";

const AdminNFTManagement = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAddress, setAdminAddress] = useState("");
  const [allNFTs, setAllNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNFTs: 0,
    uniqueOwners: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState("all"); // all, tokenId, vin, engine, model, owner
  const [editMap, setEditMap] = useState({}); // { [tokenId]: { editing, model, color, year } }
  const [lockInput, setLockInput] = useState({}); // { [tokenId]: reason }
  const [pending, setPending] = useState({}); // { [tokenId]: 'edit'|'lock'|undefined }
  // Removed unused report-related state

  useEffect(() => {
    checkAdminAndLoadNFTs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAndLoadNFTs = async () => {
    try {
      setLoading(true);

      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);

        if (accounts.length > 0) {
          const userAddress = accounts[0];
          setAdminAddress(userAddress);

          const contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            provider
          );

          // Check if user is admin
          const owner = await contract.owner();
          const adminCheck = owner.toLowerCase() === userAddress.toLowerCase();
          setIsAdmin(adminCheck);

          if (adminCheck) {
            await loadAllNFTs(provider, contract);
          }
        }
      }
    } catch (error) {
      console.error("Lỗi kiểm tra admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllNFTs = async (provider, contract) => {
    try {
      // Get total supply
      const totalSupply = await contract.totalSupply();
      const total = Number(totalSupply);

      const nfts = [];
      const owners = new Set();

      // Loop through all token IDs from 0 to totalSupply - 1
      for (let i = 0; i < total; i++) {
        const tokenId = i.toString();
        try {
          const nftData = await contract.getMotorbike(tokenId);
          const owner = await contract.ownerOf(tokenId);
          const isLocked = await contract.locked(tokenId);
          const lReason = await contract.lockReason(tokenId);

          owners.add(owner.toLowerCase());

          nfts.push({
            tokenId: tokenId,
            vin: nftData.vin,
            engineNumber: nftData.engineNumber,
            model: nftData.model,
            color: nftData.color,
            year: nftData.year.toString(),
            currentOwner: owner,
            transferHistory: [], // Load on demand if needed
            transferCount: 0,
            locked: isLocked,
            lockReason: lReason,
          });
        } catch (error) {
          console.error(`Lỗi load NFT ${tokenId}:`, error);
        }
      }

      // Sort by tokenId descending (newest first)
      nfts.sort((a, b) => parseInt(b.tokenId) - parseInt(a.tokenId));

      setAllNFTs(nfts);
      setStats({
        totalNFTs: nfts.length,
        uniqueOwners: owners.size,
      });
    } catch (error) {
      console.error("Lỗi load NFTs:", error);
    }
  };

  const getSignerContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  };

  const startEdit = (nft) => {
    setEditMap((prev) => ({
      ...prev,
      [nft.tokenId]: {
        editing: true,
        model: nft.model,
        color: nft.color,
        year: nft.year,
      },
    }));
  };

  const cancelEdit = (tokenId) => {
    setEditMap((prev) => ({ ...prev, [tokenId]: { editing: false } }));
  };

  const changeEditField = (tokenId, field, value) => {
    setEditMap((prev) => ({
      ...prev,
      [tokenId]: { ...prev[tokenId], [field]: value },
    }));
  };

  const saveEdit = async (tokenId) => {
    try {
      setPending((p) => ({ ...p, [tokenId]: "edit" }));
      const form = editMap[tokenId];
      const contract = await getSignerContract();
      const tx = await contract.updateMotorbikeDetails(
        tokenId,
        form.model,
        form.color,
        parseInt(form.year)
      );
      await tx.wait();
      await checkAdminAndLoadNFTs();
      setEditMap((prev) => ({ ...prev, [tokenId]: { editing: false } }));
      alert(`✅ Cập nhật NFT #${tokenId} thành công`);
    } catch (err) {
      console.error("Lỗi cập nhật NFT:", err);
      alert("❌ Lỗi cập nhật NFT: " + (err?.message || "Không rõ lỗi"));
    } finally {
      setPending((p) => ({ ...p, [tokenId]: undefined }));
    }
  };

  const setLock = async (tokenId, currentLocked) => {
    try {
      setPending((p) => ({ ...p, [tokenId]: "lock" }));
      const reason = currentLocked ? "" : lockInput[tokenId] || "";
      const contract = await getSignerContract();
      const tx = await contract.setTokenLock(tokenId, !currentLocked, reason);
      await tx.wait();
      await checkAdminAndLoadNFTs();
      if (!currentLocked) setLockInput((prev) => ({ ...prev, [tokenId]: "" }));
      alert(
        `✅ ${currentLocked ? "Mở khóa" : "Khóa"} NFT #${tokenId} thành công`
      );
    } catch (err) {
      console.error("Lỗi đặt khóa NFT:", err);
      alert("❌ Lỗi đặt khóa NFT: " + (err?.message || "Không rõ lỗi"));
    } finally {
      setPending((p) => ({ ...p, [tokenId]: undefined }));
    }
  };

  const formatAddress = (address) => {
    if (address === ethers.ZeroAddress) return "Mint (Tạo mới)";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date) => {
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Đã copy!");
  };

  const filterNFTs = (nfts) => {
    if (!searchTerm.trim()) return nfts;

    const term = searchTerm.toLowerCase().trim();

    return nfts.filter((nft) => {
      switch (searchFilter) {
        case "tokenId":
          return nft.tokenId.toString().includes(term);
        case "vin":
          return nft.vin.toLowerCase().includes(term);
        case "engine":
          return nft.engineNumber.toLowerCase().includes(term);
        case "model":
          return nft.model.toLowerCase().includes(term);
        case "owner":
          return nft.currentOwner.toLowerCase().includes(term);
        default: // "all"
          return (
            nft.tokenId.toString().includes(term) ||
            nft.vin.toLowerCase().includes(term) ||
            nft.engineNumber.toLowerCase().includes(term) ||
            nft.model.toLowerCase().includes(term) ||
            nft.color.toLowerCase().includes(term) ||
            nft.currentOwner.toLowerCase().includes(term)
          );
      }
    });
  };

  if (loading) {
    return (
      <div className="admin-nft-management">
        <div className="loading-section">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu quản lý...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-nft-management">
        <div className="access-denied">
          <h2>🚫 Truy cập bị từ chối</h2>
          <p>Bạn không có quyền admin để xem trang này.</p>
          <Link to="/admin" className="back-btn">
            ← Quay về Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-nft-management">
      <div className="management-header">
        <button
          onClick={() => window.history.back()}
          className="back-btn"
          title="Quay lại"
        >
          ← Quay lại
        </button>
        <h1>📋 Quản lý tất cả NFT</h1>
        <div className="header-actions">
          <button onClick={checkAdminAndLoadNFTs} className="refresh-btn">
            🔄 Làm mới
          </button>
        </div>
      </div>

      <div className="management-stats">
        <div className="stat-card">
          <div className="stat-icon">🏍️</div>
          <div className="stat-content">
            <h3>Tổng NFT</h3>
            <div className="stat-number">{stats.totalNFTs}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Chủ sở hữu</h3>
            <div className="stat-number">{stats.uniqueOwners}</div>
          </div>
        </div>
      </div>

      {allNFTs.length > 0 && (
        <div className="search-section">
          <div className="search-controls">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Tìm kiếm NFT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>

            <select
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="search-filter"
            >
              <option value="all">Tất cả</option>
              <option value="tokenId">Token ID</option>
              <option value="vin">VIN</option>
              <option value="engine">Số máy</option>
              <option value="model">Mẫu xe</option>
              <option value="owner">Chủ sở hữu</option>
            </select>
          </div>

          {searchTerm && (
            <div className="search-results-info">
              Tìm thấy <strong>{filterNFTs(allNFTs).length}</strong> kết quả cho
              "{searchTerm}"
              {searchFilter !== "all" &&
                ` trong ${
                  searchFilter === "tokenId"
                    ? "Token ID"
                    : searchFilter === "vin"
                    ? "VIN"
                    : searchFilter === "engine"
                    ? "Số máy"
                    : searchFilter === "model"
                    ? "Mẫu xe"
                    : "Chủ sở hữu"
                }`}
            </div>
          )}
        </div>
      )}

      <div className="nft-management-content">
        {allNFTs.length === 0 ? (
          <div className="no-nfts">
            <div className="no-nfts-icon">🏍️</div>
            <h3>Chưa có NFT nào được tạo</h3>
            <p>Hãy tạo NFT đầu tiên từ Admin Dashboard</p>
            <Link to="/admin" className="create-btn">
              🏭 Tạo NFT đầu tiên
            </Link>
          </div>
        ) : (
          <div className="nfts-table">
            {filterNFTs(allNFTs).map((nft) => (
              <div key={nft.tokenId} className="nft-management-card">
                <div className="nft-main-info">
                  <div className="nft-header">
                    <span className="nft-id">#{nft.tokenId}</span>
                    <span className="nft-year">{nft.year}</span>
                    <span className="transfer-count">
                      {nft.transferCount} lần chuyển
                    </span>
                    {nft.locked && (
                      <span
                        className="lock-badge"
                        title={nft.lockReason || "Đã khóa"}
                      >
                        🔒 Đã khóa
                      </span>
                    )}
                  </div>

                  <h3 className="nft-model">{nft.model}</h3>

                  <div className="nft-specs">
                    <div className="spec-row">
                      <span className="spec-label">VIN:</span>
                      <span className="spec-value">{nft.vin}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Số máy:</span>
                      <span className="spec-value">{nft.engineNumber}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Màu:</span>
                      <span className="spec-value">{nft.color}</span>
                    </div>
                  </div>

                  <div className="current-owner">
                    <span className="owner-label">Chủ hiện tại:</span>
                    <div className="owner-address">
                      <span>{formatAddress(nft.currentOwner)}</span>
                      <button
                        onClick={() => copyToClipboard(nft.currentOwner)}
                        className="copy-btn"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div className="card-actions">
                    {!editMap[nft.tokenId]?.editing ? (
                      <>
                        <button
                          className="action-btn primary"
                          onClick={() => startEdit(nft)}
                          disabled={pending[nft.tokenId] === "edit"}
                        >
                          ✏️ Sửa
                        </button>
                        <div className="lock-controls">
                          {!nft.locked ? (
                            <>
                              <input
                                type="text"
                                placeholder="Lý do khóa (tuỳ chọn)"
                                value={lockInput[nft.tokenId] || ""}
                                onChange={(e) =>
                                  setLockInput((prev) => ({
                                    ...prev,
                                    [nft.tokenId]: e.target.value,
                                  }))
                                }
                                className="lock-reason-input"
                              />
                              <button
                                className="action-btn danger"
                                onClick={() => setLock(nft.tokenId, nft.locked)}
                                disabled={pending[nft.tokenId] === "lock"}
                              >
                                🔒 Khóa
                              </button>
                            </>
                          ) : (
                            <button
                              className="action-btn success"
                              onClick={() => setLock(nft.tokenId, nft.locked)}
                              disabled={pending[nft.tokenId] === "lock"}
                              title={nft.lockReason || "Đã khóa"}
                            >
                              🔓 Mở khóa
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="edit-form">
                        <div className="edit-row">
                          <label>Mẫu xe</label>
                          <input
                            type="text"
                            value={editMap[nft.tokenId]?.model || ""}
                            onChange={(e) =>
                              changeEditField(
                                nft.tokenId,
                                "model",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="edit-row">
                          <label>Màu</label>
                          <input
                            type="text"
                            value={editMap[nft.tokenId]?.color || ""}
                            onChange={(e) =>
                              changeEditField(
                                nft.tokenId,
                                "color",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="edit-row">
                          <label>Năm</label>
                          <input
                            type="number"
                            value={editMap[nft.tokenId]?.year || ""}
                            onChange={(e) =>
                              changeEditField(
                                nft.tokenId,
                                "year",
                                e.target.value
                              )
                            }
                            min="1980"
                            max={new Date().getFullYear()}
                          />
                        </div>
                        <div className="edit-actions">
                          <button
                            className="action-btn primary"
                            onClick={() => saveEdit(nft.tokenId)}
                            disabled={pending[nft.tokenId] === "edit"}
                          >
                            💾 Lưu
                          </button>
                          <button
                            className="action-btn secondary"
                            onClick={() => cancelEdit(nft.tokenId)}
                            disabled={pending[nft.tokenId] === "edit"}
                          >
                            ✖️ Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="nft-history">
                  <h4>📜 Lịch sử chuyển quyền</h4>
                  <div className="history-list">
                    {nft.transferHistory.map((transfer, index) => (
                      <div key={index} className="history-item">
                        <div className="history-header">
                          <span className="history-date">
                            {formatDate(transfer.timestamp)}
                          </span>
                          <span className="history-block">
                            Block #{transfer.blockNumber}
                          </span>
                        </div>

                        <div className="history-transfer">
                          <span className="transfer-from">
                            {formatAddress(transfer.from)}
                          </span>
                          <span className="transfer-arrow">→</span>
                          <span className="transfer-to">
                            {formatAddress(transfer.to)}
                          </span>
                        </div>

                        <div className="history-tx">
                          <span>
                            TX: {transfer.transactionHash.slice(0, 10)}...
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(transfer.transactionHash)
                            }
                            className="copy-btn small"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reports panel moved to dedicated AdminReports page */}
    </div>
  );
};

export default AdminNFTManagement;
