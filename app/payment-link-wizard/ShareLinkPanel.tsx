import React from 'react';
import { FaWhatsapp, FaTelegramPlane, FaEnvelope } from "react-icons/fa";
import { siX, siFarcaster } from 'simple-icons';

interface ShareLinkPanelProps {
  generatedLink: string;
  copied: boolean;
  copyToClipboard: () => void;
  amount: string;
  currency: string;
  description: string;
  showWhatsAppInput: boolean;
  setShowWhatsAppInput: (value: boolean) => void;
  whatsAppReceiver: string;
  setWhatsAppReceiver: (value: string) => void;
  showTelegramInput: boolean;
  setShowTelegramInput: (value: boolean) => void;
  telegramReceiver: string;
  setTelegramReceiver: (value: string) => void;
}

const XIcon = ({ size = 24, color = siX.hex }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={`#${color}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={siX.path} />
  </svg>
);

const FarcasterIcon = ({ size = 24, color = siFarcaster.hex }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={`#${color}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={siFarcaster.path} />
  </svg>
);

export const ShareLinkPanel: React.FC<ShareLinkPanelProps> = ({
  generatedLink,
  copied,
  copyToClipboard,
  amount,
  currency,
  description,
  showWhatsAppInput,
  setShowWhatsAppInput,
  whatsAppReceiver,
  setWhatsAppReceiver,
  showTelegramInput,
  setShowTelegramInput,
  telegramReceiver,
  setTelegramReceiver,
}) => {
  const shareViaWhatsApp = (direct = false) => {
    const message = `Pay ${amount} ${currency} for ${description || 'your purchase'}: ${generatedLink}`;
    let whatsappUrl;
    if (direct) {
      whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    } else {
      if (!whatsAppReceiver) {
        setShowWhatsAppInput(true);
        return;
      }
      whatsappUrl = `https://wa.me/${encodeURIComponent(whatsAppReceiver)}?text=${encodeURIComponent(message)}`;
      setShowWhatsAppInput(false);
      setWhatsAppReceiver("");
    }
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const shareViaTelegram = (direct = false) => {
    const message = `Pay ${amount} ${currency} for ${description || 'your purchase'}: ${generatedLink}`;
    let telegramUrl;
    if (direct) {
      telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(generatedLink)}&text=${encodeURIComponent(message)}`;
    } else {
      if (!telegramReceiver) {
        setShowTelegramInput(true);
        return;
      }
      const receiver = telegramReceiver.startsWith('@') ? telegramReceiver.substring(1) : telegramReceiver;
      telegramUrl = `https://t.me/${encodeURIComponent(receiver)}?text=${encodeURIComponent(message)}`;
      setShowTelegramInput(false);
      setTelegramReceiver("");
    }
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  const shareViaEmail = () => {
    const subject = `Payment Request: ${amount} ${currency}`;
    const body = `Please make a payment of ${amount} ${currency} for ${description || 'your purchase'} using this link: ${generatedLink}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
  };

  const shareViaX = () => {
    const message = `Pay ${amount} ${currency} for ${description || 'your purchase'}: ${generatedLink}`;
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(message)}`;
    window.open(xUrl, '_blank', 'noopener,noreferrer');
  };

  const shareViaFarcaster = () => {
    const message = `Pay ${amount} ${currency} for ${description || 'your purchase'}: ${generatedLink}`;
    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`;
    window.open(farcasterUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mt-10 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 animate-fade-in">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" stroke="true" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-green-900">
          Payment Link Generated Successfully!
        </h3>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <input
          type="text"
          readOnly
          value={generatedLink}
          className="flex-1 !text-base px-4 py-3 !bg-white !border-2 !border-green-200 !rounded-xl !text-sm !font-mono"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 !rounded-xl !font-medium !transition-all !duration-300 ${
              copied
                ? "!bg-green-600 !text-white text-base"
                : "!bg-green-100 !text-green-700 hover:!bg-green-200 text-base"
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <a
            href={generatedLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all duration-300 text-base"
          >
            Preview
          </a>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => shareViaWhatsApp(true)}
            className="px-4 py-2 !bg-green-500 text-base !text-white !rounded-xl !font-medium hover:!bg-green-600 transition-all duration-300 flex items-center gap-2"
          >
            <FaWhatsapp /> Direct Share
          </button>
          <button
            onClick={() => shareViaWhatsApp(false)}
            className="px-4 py-2 !bg-green-500 text-base !text-white !rounded-xl !font-medium hover:!bg-green-600 transition-all duration-300 flex items-center gap-2"
          >
            <FaWhatsapp /> Share to Contact
          </button>
        </div>
        {showWhatsAppInput && (
          <div className="mt-3">
            <input
              type="text"
              value={whatsAppReceiver}
              onChange={(e) => setWhatsAppReceiver(e.target.value)}
              placeholder="Enter phone number (e.g., +1234567890)"
              className="w-full px-4 py-3 text-base rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300"
            />
          </div>
        )}
        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            onClick={() => shareViaTelegram(true)}
            className="px-4 py-2 !bg-blue-500 text-base !text-white !rounded-xl !font-medium hover:!bg-blue-600 transition-all duration-300 flex items-center gap-2"
          >
            <FaTelegramPlane /> Direct Share
          </button>
          <button
            onClick={() => shareViaTelegram(false)}
            className="px-4 py-2 !bg-blue-500 text-base !text-white !rounded-xl !font-medium hover:!bg-blue-600 transition-all duration-300 flex items-center gap-2"
          >
            <FaTelegramPlane /> Share to Contact
          </button>
        </div>
        {showTelegramInput && (
          <div className="mt-3">
            <input
              type="text"
              value={telegramReceiver}
              onChange={(e) => setTelegramReceiver(e.target.value)}
              placeholder="Enter Telegram handle (e.g., @username) or phone number"
              className="w-full px-4 py-3 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
            />
          </div>
        )}
        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            onClick={shareViaEmail}
            className="px-4 py-2 text-base !text-white !rounded-xl !font-medium hover:!bg-gray-600 transition-all duration-300 flex items-center gap-2"
          >
            <FaEnvelope color="black" size={20}/>
          </button>
          <button
            onClick={shareViaX}
            className="px-4 py-2 text-base !text-white !rounded-xl !font-medium hover:!bg-slate-600 transition-all duration-300 flex items-center gap-2"
          >
            <XIcon />
          </button>
          <button
            onClick={shareViaFarcaster}
            className="px-4 py-2 text-base !text-white !rounded-xl !font-medium hover:!bg-purple-300 transition-all duration-300 flex items-center gap-2"
          >
            <FarcasterIcon />
          </button>
        </div>
        <p className="mt-3 text-base text-green-700 text-center">
          Share this secure link with your customers to receive payments instantly.
        </p>
      </div>
    </div>
  );
};