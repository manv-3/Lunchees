import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrCouponCard({ coupon }) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    QRCode.toDataURL(coupon.qrPayload || coupon.code, { width: 180, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [coupon.code, coupon.qrPayload]);

  return (
    <div className="qr-ticket">
      <strong>{coupon.code}</strong>
      <div>{coupon.memberName} ({coupon.memberId})</div>
      {qrDataUrl && <img src={qrDataUrl} alt={coupon.code} className="qr-img" />}
    </div>
  );
}