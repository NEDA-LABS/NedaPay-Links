import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { useTheme } from "next-themes";

export const useQRCode = (text: string) => {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    const generateQRCode = async () => {
      if (!text) return;

      try {
        const url = await QRCode.toDataURL(text, {
          width: 400,
          margin: 2,
          color: {
            dark: theme === "dark" ? "#ffffff" : "#000000",
            light: "#0000",
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    };

    generateQRCode();
  }, [text, theme]);

  const downloadQRCode = (filename = `payment-link-${Date.now()}.png`) => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { qrDataUrl, downloadQRCode };
};