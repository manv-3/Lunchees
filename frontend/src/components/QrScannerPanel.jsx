import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { apiRequest } from "../api.js";

export default function QrScannerPanel({ onRedeemed }) {
  const [codeInput, setCodeInput] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const lastScanRef = useRef({ text: "", time: 0 });

  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function redeemRaw(rawValue) {
    const trimmed = (rawValue || "").trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const coupon = await apiRequest("/coupons/redeem", {
        method: "POST",
        body: JSON.stringify({ qrData: trimmed })
      });
      setResult({
        ok: true,
        text: `SERVED! ${coupon.memberName || coupon.memberId} (${coupon.memberId}) - Code: ${coupon.code}`
      });
      setCodeInput("");
      if (onRedeemed) onRedeemed();
    } catch (err) {
      setResult({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera API is not supported in this browser. Use QR Image upload or Manual Entry.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      setCameraOn(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);

      timerRef.current = setInterval(() => {
        scanVideoFrame();
      }, 250);
    } catch (err) {
      setCameraError("Could not open camera (" + (err.message || "permission denied") + "). You can upload a QR image or type the code below.");
    }
  }

  function stopCamera() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }

  function scanVideoFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== 4) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const qr = jsQR(imgData.data, w, h);

    if (qr && qr.data) {
      const now = Date.now();
      if (lastScanRef.current.text === qr.data && now - lastScanRef.current.time < 3000) {
        return;
      }
      lastScanRef.current = { text: qr.data, time: now };
      stopCamera();
      redeemRaw(qr.data);
    }
  }

  function handleFileScan(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const qr = jsQR(imgData.data, img.width, img.height);
        if (qr && qr.data) {
          redeemRaw(qr.data);
        } else {
          setResult({ ok: false, text: "No valid QR code detected in the uploaded image." });
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleSubmit(e) {
    e.preventDefault();
    redeemRaw(codeInput);
  }

  return (
    <div className="panel scanner-panel">
      <h2>Counter QR Scanner &amp; Coupon Redeem</h2>
      <p className="hint">
        Scan student QR code using webcam, upload a QR image file, or enter coupon code manually.
      </p>

      <div className="scanner-methods">
        <div className="scanner-box">
          <h3>Option 1: Live Camera QR Scan</h3>
          {!cameraOn ? (
            <button type="button" className="btn-green" onClick={startCamera}>
              Start Camera Scanner
            </button>
          ) : (
            <div>
              <button type="button" className="btn-red" onClick={stopCamera}>
                Stop Camera
              </button>
              <div className="video-wrap">
                <video ref={videoRef} playsInline muted className="scanner-video" />
              </div>
              <p className="hint">Point student&apos;s QR code at the camera...</p>
            </div>
          )}
          {cameraError && <div className="alert alert-bad">{cameraError}</div>}
        </div>

        <div className="scanner-box">
          <h3>Option 2: Scan QR from Image</h3>
          <input type="file" accept="image/*" onChange={handleFileScan} />
          <p className="hint">Useful if testing without a webcam (upload downloaded QR PNG).</p>

          <hr />

          <h3>Option 3: Manual Code / QR Text</h3>
          <form onSubmit={handleSubmit} className="inline-form">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="LNC-XXXXXX or LUNCHEES|..."
            />
            <button type="submit" className="btn-blue" disabled={busy || !codeInput.trim()}>
              {busy ? "Checking..." : "Redeem Coupon"}
            </button>
          </form>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {result && (
        <div className={`alert ${result.ok ? "alert-ok" : "alert-bad"}`} role="status">
          <strong>{result.ok ? "SUCCESS: " : "REJECTED: "}</strong>
          {result.text}
        </div>
      )}
    </div>
  );
}
