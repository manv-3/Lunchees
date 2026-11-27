import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrCouponCard({ coupon, showActions = true }) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let active = true;
    const payload = coupon.qrPayload || coupon.code;
    QRCode.toDataURL(payload, { width: 180, margin: 2 })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl("");
      });
    return () => {
      active = false;
    };
  }, [coupon.code, coupon.qrPayload]);

  const isUsed = coupon.status === "REDEEMED";

  return (
    <div className={`qr-ticket ${isUsed ? "qr-ticket-used" : ""}`}>
      <div className="qr-ticket-header">
        <strong>ABESEC MESS COUPON</strong>
        <span className={`status-tag ${isUsed ? "tag-red" : "tag-green"}`}>
          {isUsed ? "USED" : "ACTIVE"}
        </span>
      </div>

      <div className="qr-ticket-body">
        <div className="qr-image-wrap">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR for ${coupon.code}`} className="qr-img" />
          ) : (
            <div className="qr-loading">Generating QR...</div>
          )}
        </div>
        <div className="qr-info">
          <div className="coupon-code-big">{coupon.code}</div>
          <div>
            <b>Name:</b> {coupon.memberName || "-"}
          </div>
          <div>
            <b>Roll / ID:</b> {coupon.memberId}
          </div>
          <div>
            <b>Valid Date:</b> {coupon.validDate}
          </div>
          {isUsed && coupon.redeemedAt && (
            <div className="used-note">
              Redeemed at: {new Date(coupon.redeemedAt).toLocaleTimeString()}
              {coupon.redeemedBy ? ` (by ${coupon.redeemedBy})` : ""}
            </div>
          )}
        </div>
      </div>

      {showActions && qrDataUrl && (
        <div className="qr-ticket-actions no-print">
          <a
            href={qrDataUrl}
            download={`${coupon.code}.png`}
            className="btn-link"
          >
            Download QR PNG
          </a>
          <button
            type="button"
            className="btn-gray small-btn"
            onClick={() => window.print()}
          >
            Print Coupon
          </button>
        </div>
      )}
    </div>
  );
}
