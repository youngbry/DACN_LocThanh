import React, { useState, useRef, useEffect, useCallback } from "react";

const FaceScanStep = ({ onComplete, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [isScanning, setIsScanning] = useState(true);
  const [cameraError, setCameraError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(
        "Không thể truy cập camera. Vui lòng tải ảnh lên thay thế."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
  }, []);

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageSrc = canvas.toDataURL("image/jpeg");
      setImgSrc(imageSrc);
      setIsScanning(false);
      stopCamera();
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isScanning) {
      startCamera();
    }
    return () => stopCamera();
  }, [isScanning, startCamera, stopCamera]);

  useEffect(() => {
    let timer;
    if (isScanning && countdown > 0 && !cameraError) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isScanning && !cameraError) {
      capture();
    }
    return () => clearInterval(timer);
  }, [countdown, isScanning, cameraError, capture]);

  const reset = () => {
    setImgSrc(null);
    setCountdown(3);
    setIsScanning(true);
    setCameraError(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgSrc(reader.result);
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-gray-900 shadow-2xl"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "600px",
          background: "#111827",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {/* Camera Container */}
        <div
          className="relative aspect-video w-full bg-black"
          style={{
            position: "relative",
            width: "100%",
            height: "400px",
            background: "black",
          }}
        >
          {isScanning && !cameraError && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {imgSrc && (
            <img
              src={imgSrc}
              alt="Selfie"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}

          {/* Error State */}
          {cameraError && isScanning && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <p style={{ marginBottom: "20px", color: "#ef4444" }}>
                {cameraError}
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                id="selfie-upload"
                hidden
              />
              <label
                htmlFor="selfie-upload"
                style={{
                  background: "#3b82f6",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                📂 Tải ảnh lên
              </label>
            </div>
          )}

          {/* Overlay Mask */}
          {isScanning && !cameraError && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            >
              {/* Dark overlay with oval cutout - simplified with CSS */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 60%)",
                }}
              ></div>

              {/* Oval Border */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "250px",
                  height: "350px",
                  border: "2px dashed #60a5fa",
                  borderRadius: "50%",
                }}
              ></div>

              {/* Scanning Line */}
              <div
                className="animate-scan"
                style={{
                  position: "absolute",
                  top: "20%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "250px",
                  height: "2px",
                  background: "#3b82f6",
                  boxShadow: "0 0 10px #3b82f6",
                }}
              ></div>
            </div>
          )}

          {/* Countdown UI */}
          {isScanning && !cameraError && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontSize: "5rem",
                  fontWeight: "bold",
                  color: "white",
                  textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                }}
              >
                {countdown}
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div
          className="p-6 text-center"
          style={{ padding: "20px", textAlign: "center" }}
        >
          {!imgSrc && !cameraError ? (
            <p style={{ color: "#d1d5db" }}>
              Vui lòng đưa khuôn mặt vào khung hình và giữ yên...
            </p>
          ) : imgSrc ? (
            <div
              style={{ display: "flex", justifyContent: "center", gap: "15px" }}
            >
              <button
                onClick={reset}
                style={{
                  background: "#374151",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Chụp lại
              </button>
              <button
                onClick={() => onComplete(imgSrc)}
                style={{
                  background: "#2563eb",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Xác nhận
              </button>
            </div>
          ) : null}

          <button
            onClick={onCancel}
            style={{
              marginTop: "15px",
              background: "transparent",
              border: "none",
              color: "#9ca3af",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Hủy bỏ
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 20%; }
          50% { top: 80%; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default FaceScanStep;
