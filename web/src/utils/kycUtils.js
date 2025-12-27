export const getKycStatus = async (address) => {
  try {
    const res = await fetch(`http://localhost:4000/api/kyc/requests?t=${Date.now()}`);
    if (res.ok) {
      const requests = await res.json();
      const myRequests = requests.filter(
        (r) => r.walletAddress.toLowerCase() === address.toLowerCase()
      );

      // Ưu tiên trạng thái đã xác thực
      const verifiedRequest = myRequests.find((r) => r.status === "verified");
      if (verifiedRequest) return "verified";

      // Nếu không có verified, lấy cái mới nhất
      const latestRequest = myRequests.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      return latestRequest ? latestRequest.status : null;
    }
    return null;
  } catch (error) {
    console.error("Error checking KYC status:", error);
    return null;
  }
};
