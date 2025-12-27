import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyAqOTo6L5TlY0Ixv7g__ipM1oXSLQ3urVE"; // Dùng key từ env hoặc mặc định
const genAI = new GoogleGenerativeAI(API_KEY);

const dataDir = path.join(__dirname, "data");
const kycFile = path.join(dataDir, "kyc_requests.json");

// Đảm bảo thư mục data và file json tồn tại
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(kycFile))
  fs.writeFileSync(kycFile, JSON.stringify({ requests: [] }, null, 2));

const getKycStore = () => {
  try {
    if (!fs.existsSync(kycFile)) return { requests: [] };
    const data = fs.readFileSync(kycFile, "utf-8");
    return data.trim() ? JSON.parse(data) : { requests: [] };
  } catch (error) {
    console.error("Error reading KYC file:", error);
    return { requests: [] };
  }
};

export const checkImageQuality = async (req, res) => {
  // Luôn trả về true cho demo theo yêu cầu
  res.json({ valid: true, reason: "" });
};

export const extractInfo = async (req, res) => {
  try {
    const { idCardFront, idCardBack } = req.body;
    console.log("Extracting info from images...");
    if (!idCardFront) {
      console.log("Missing front image");
      return res.status(400).json({ error: "Thiếu ảnh mặt trước" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      Bạn là hệ thống trích xuất thông tin CCCD. Hãy đọc 2 ảnh mặt trước và mặt sau này.
      Trích xuất các thông tin sau:
      1. Họ tên (fullName)
      2. Số CCCD (idNumber)
      3. Năm sinh (dob - chỉ lấy năm hoặc ngày tháng năm nếu rõ)
      4. Giới tính (gender)
      5. Nơi thường trú (address)
      6. Ngày cấp (issueDate)
      7. Giá trị đến (expiryDate)

      Nếu không đọc được, hãy để trống hoặc ghi "N/A".
      Trả về JSON duy nhất:
      {
        "fullName": "",
        "idNumber": "",
        "dob": "",
        "gender": "",
        "address": "",
        "issueDate": "",
        "expiryDate": ""
      }
    `;

    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: idCardFront.split(",")[1] || idCardFront,
        },
      },
    ];

    if (idCardBack) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: idCardBack.split(",")[1] || idCardBack,
        },
      });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();
    console.log("AI Response:", text);
    const jsonMatch = text.match(/\{.*\}/s);
    const info = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    console.log("Extracted Info:", info);
    res.json(info);
  } catch (error) {
    console.error("Extract Info Error:", error);
    res
      .status(500)
      .json({ error: "Lỗi trích xuất thông tin: " + error.message });
  }
};

export const verifyKYC = async (req, res) => {
  try {
    const { walletAddress, idCardFront, idCardBack, selfieBase64, userData } =
      req.body;

    if (!walletAddress || !idCardFront || !idCardBack || !selfieBase64) {
      return res.status(400).json({
        error:
          "Thiếu thông tin xác thực (wallet, idCardFront, idCardBack, selfie)",
      });
    }

    let kycData = userData;

    // Nếu không có userData từ frontend, mới dùng AI để trích xuất lại
    if (!kycData) {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `
        Đây là 3 ảnh: CCCD mặt trước, CCCD mặt sau và ảnh selfie. 
        Hệ thống đang chạy DEMO, hãy trích xuất thông tin CỰC KỲ LINH HOẠT:
        1. Trích xuất từ CCCD: Họ tên (fullName), Số CCCD (idNumber), Ngày sinh (dob), Giới tính (gender), Quốc tịch (nationality), Nơi thường trú (address).
        2. So sánh khuôn mặt: Luôn cho điểm matchScore từ 90-100 nếu thấy có mặt người.

        Trả về kết quả JSON duy nhất: 
        { 
          "fullName": string, 
          "idNumber": string, 
          "dob": string, 
          "gender": string,
          "nationality": string,
          "address": string,
          "matchScore": number 
        }
      `;

      const parts = [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: idCardFront.split(",")[1] || idCardFront,
          },
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: idCardBack.split(",")[1] || idCardBack,
          },
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: selfieBase64.split(",")[1] || selfieBase64,
          },
        },
      ];

      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{.*\}/s);
      kycData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    }

    if (!kycData) {
      throw new Error("Không thể phân tích dữ liệu");
    }

    // Đảm bảo có matchScore cho demo
    if (!kycData.matchScore) kycData.matchScore = 95;

    // Lưu vào file kyc_requests.json
    const store = getKycStore();

    // 1. Kiểm tra trùng số CCCD với ví khác
    const duplicateIdRequest = store.requests.find(
      (r) =>
        r.idNumber === kycData.idNumber &&
        r.walletAddress.toLowerCase() !== walletAddress.toLowerCase() &&
        (r.status === "verified" || r.status === "pending")
    );

    if (duplicateIdRequest) {
      return res.status(400).json({
        error: `Số CCCD ${kycData.idNumber} đã được sử dụng cho ví khác (${
          duplicateIdRequest.status === "verified" ? "Đã xác thực" : "Đang chờ duyệt"
        }).`,
      });
    }

    // 2. Kiểm tra xem ví này đã có yêu cầu nào chưa
    const existingRequestIndex = store.requests.findIndex(
      (r) => r.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    if (existingRequestIndex !== -1) {
      const existingRequest = store.requests[existingRequestIndex];
      if (existingRequest.status === "verified") {
        return res.status(400).json({ error: "Ví này đã được xác thực KYC." });
      }
      // Nếu đang pending hoặc rejected, cho phép ghi đè (xóa cũ thêm mới)
      // Để đơn giản, ta xóa cái cũ đi để tránh duplicate
      store.requests.splice(existingRequestIndex, 1);
    }

    const newRequest = {
      id: Date.now().toString(),
      walletAddress,
      ...kycData,
      status: "pending",
      createdAt: new Date().toISOString(),
      images: {
        idCardFront: idCardFront,
        idCardBack: idCardBack,
        selfie: selfieBase64,
      },
    };

    store.requests.push(newRequest);
    fs.writeFileSync(kycFile, JSON.stringify(store, null, 2));

    res.json({
      success: true,
      message: "Yêu cầu KYC đã được gửi và đang chờ duyệt",
      data: kycData,
    });
  } catch (error) {
    console.error("KYC Error:", error);
    res.status(500).json({ error: "Lỗi xử lý KYC: " + error.message });
  }
};

export const getKYCRequests = (req, res) => {
  const store = getKycStore();
  res.json(store.requests);
};

export const approveKYC = (req, res) => {
  try {
    const { walletAddress, requestId } = req.body;
    if (!walletAddress && !requestId) {
      return res
        .status(400)
        .json({ error: "Thiếu walletAddress hoặc requestId" });
    }

    const store = getKycStore();

    // Ưu tiên cập nhật đúng requestId, nếu không truyền thì lấy yêu cầu mới nhất theo ví
    const request = requestId
      ? store.requests.find((r) => r.id === requestId)
      : [...store.requests]
          .reverse()
          .find(
            (r) =>
              r.walletAddress &&
              walletAddress &&
              r.walletAddress.toLowerCase() === walletAddress.toLowerCase()
          );

    if (!request)
      return res.status(404).json({ error: "Không tìm thấy yêu cầu" });

    // KIỂM TRA TRÙNG CCCD TRƯỚC KHI DUYỆT
    // Tìm xem có ví nào KHÁC đã được verified với cùng số CCCD này không
    const duplicateId = store.requests.find(
      (r) =>
        r.status === "verified" &&
        r.idNumber === request.idNumber &&
        r.walletAddress.toLowerCase() !== request.walletAddress.toLowerCase()
    );

    if (duplicateId) {
      return res.status(400).json({
        error: `Không thể duyệt! Số CCCD ${request.idNumber} đã được xác thực cho ví ${duplicateId.walletAddress}`,
      });
    }

    request.status = "verified";
    request.updatedAt = new Date().toISOString();

    fs.writeFileSync(kycFile, JSON.stringify(store, null, 2));
    res.json({ success: true, message: "Đã cập nhật trạng thái verified" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectKYC = (req, res) => {
  try {
    const { walletAddress, reason, requestId } = req.body;
    if (!walletAddress && !requestId) {
      return res
        .status(400)
        .json({ error: "Thiếu walletAddress hoặc requestId" });
    }

    const store = getKycStore();

    const request = requestId
      ? store.requests.find((r) => r.id === requestId)
      : [...store.requests]
          .reverse()
          .find(
            (r) =>
              r.walletAddress &&
              walletAddress &&
              r.walletAddress.toLowerCase() === walletAddress.toLowerCase()
          );

    if (!request)
      return res.status(404).json({ error: "Không tìm thấy yêu cầu" });

    request.status = "rejected";
    request.rejectReason = reason || "Không đạt yêu cầu";
    request.updatedAt = new Date().toISOString();

    fs.writeFileSync(kycFile, JSON.stringify(store, null, 2));
    res.json({ success: true, message: "Đã từ chối yêu cầu KYC" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkIdNumber = (req, res) => {
  try {
    const { idNumber, walletAddress } = req.body;
    if (!idNumber) return res.status(400).json({ error: "Thiếu số CCCD" });

    const store = getKycStore();

    // Check if this ID is already used by ANOTHER wallet (verified or pending)
    const duplicate = store.requests.find(
      (r) =>
        r.idNumber === idNumber &&
        r.walletAddress.toLowerCase() !== walletAddress.toLowerCase() &&
        (r.status === "verified" || r.status === "pending")
    );

    if (duplicate) {
      return res.json({
        available: false,
        message:
          "Thông tin cá nhân của bạn đã được đăng ký ở 1 ví khác vui lòng kiểm tra lại.",
      });
    }

    res.json({ available: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
