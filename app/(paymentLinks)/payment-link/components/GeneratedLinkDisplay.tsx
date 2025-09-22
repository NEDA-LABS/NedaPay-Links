import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { useTheme } from "next-themes";
import { siX, siFarcaster } from "simple-icons";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Copy, Check, Download, Share2, Send, MessageSquare, Mail } from "lucide-react";

const XIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={siX.path} />
  </svg>
);

const FarcasterIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={siFarcaster.path} />
  </svg>
);

interface GeneratedLinkDisplayProps {
  generatedLink: string;
  onCopy: (link: string) => void;
  onDownloadQR: (qrDataUrl: string) => void;
  onShare: (platform: string) => void;
}

export const GeneratedLinkDisplay: React.FC<GeneratedLinkDisplayProps> = ({ generatedLink, onCopy, onDownloadQR, onShare }) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    const generateQRCode = async (text: string) => {
      try {
        const url = await QRCode.toDataURL(text, {
          width: 200,
          margin: 1,
          color: { dark: "#020817", light: "#FFFFFF" },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    };
    generateQRCode(generatedLink);
  }, [generatedLink, theme]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    onCopy(generatedLink);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `nedapay-qr-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onDownloadQR(qrDataUrl);
  };

    const socialShares = [
    { name: "X", icon: XIcon, action: () => onShare("twitter"), color: "hover:text-[#1DA1F2]" },
    { name: "Farcaster", icon: FarcasterIcon, action: () => onShare("farcaster"), color: "hover:text-[#8a63d2]" },
    { name: "Telegram", icon: Send, action: () => onShare("telegram"), color: "hover:text-[#26A5E4]" },
    { name: "WhatsApp", icon: MessageSquare, action: () => onShare("whatsapp"), color: "hover:text-[#25D366]" },
    { name: "Email", icon: Mail, action: () => onShare("email"), color: "hover:text-slate-400" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-sm !rounded-3xl">
        <CardHeader>
          <Alert className="bg-gradient-to-r from-emerald-900/50 to-green-900/50 border-emerald-500/30 text-green-300 rounded-2xl">
            <CheckCircle2 className="h-4 w-4 !text-green-400" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>Your payment link has been generated.</AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input value={generatedLink} readOnly className="font-mono h-12 text-base bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-400" />
              <Button onClick={handleCopy} variant="secondary" size="icon" className={`h-12 w-12 bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-300 ${copied ? '!bg-emerald-600 !text-white' : ''}`}>
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </Button>
              <Button asChild variant="secondary" className="h-12 bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors duration-300">
                <a href={generatedLink} target="_blank" rel="noopener noreferrer">Preview</a>
              </Button>
            </div>
          </div>
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
              <div className="p-2 bg-white rounded-md shadow-lg">
                <img src={qrDataUrl} alt="Payment QR Code" className="w-32 h-32" />
              </div>
              <Button onClick={handleDownloadQR} variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-700/50">
                <Download className="mr-2 h-4 w-4" /> Download QR
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <div className="flex items-center w-full">
            <Separator className="flex-1 bg-slate-700" />
            <span className="px-4 text-xs text-slate-400">SHARE LINK</span>
            <Separator className="flex-1 bg-slate-700" />
          </div>
          <TooltipProvider>
            <div className="flex justify-center gap-2">
              {socialShares.map(({ name, icon: Icon, action, color }) => (
                <Tooltip key={name}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={action} className={`rounded-full h-12 w-12 bg-slate-800/50 hover:bg-slate-700/50 transition-colors duration-300`}>
                      <Icon className={`h-6 w-6 text-slate-400 transition-colors duration-300 ${color}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share on {name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </CardFooter>
      </Card>
    </motion.div>
  );
};