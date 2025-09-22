"use client";

import { useState, useEffect } from "react";
import { usePaymentLink } from "../hooks/usePaymentLink";
import { WalletStatus } from "./WalletStatus";
import { LinkTypeSelector } from "./LinkTypeSelector";
import { OffRampFields } from "./OfframpFields";
import { NormalLinkFields } from "./NormalLinkFields";
import { AmountDescriptionFields } from "./AmountDescriptionFields";
import { ExpirationField } from "./ExpirationDateField";
import { GeneratedLinkDisplay } from "./GeneratedLinkDisplay";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon } from "lucide-react";

export const PaymentLinkForm: React.FC = () => {
  const {
    formData,
    updateFormData,
    supportedInstitutions,
    supportedCurrencies,
    isLoading,
    setIsLoading,
    isConnected,
    getMerchantAddress,
    sanitizeInput,
    validateInput,
    walletAddress,
    createLink,
  } = usePaymentLink();

  const [generatedLink, setGeneratedLink] = useState("");
  const [recentLinks, setRecentLinks] = useState<any[]>([]);

  const handleShare = (platform: string) => {
    const shareText = "Check out this NedaPay payment link:";
    const shareUrl = generatedLink;
    
    switch (platform) {
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case "farcaster":
        // Farcaster uses Warpcast for sharing
        window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '_blank');
        break;
      case "telegram":
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '_blank');
        break;
      case "email":
        const subject = "NedaPay Payment Link";
        const body = `${shareText}\n\n${shareUrl}\n\nSent via NedaPay`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
        break;
      default:
        // Fallback to native share API if available
        if (navigator.share) {
          navigator.share({
            title: 'NedaPay Payment Link',
            text: shareText,
            url: shareUrl,
          }).catch(console.error);
        } else {
          // Fallback to copying to clipboard
          navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        }
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateInput()) {
      setIsLoading(false);
      return;
    }

    try {
      const newLink = await createLink(formData);
      if (newLink) {
        setGeneratedLink(newLink.url);
        // Optionally, add to recent links
        setRecentLinks(prev => [newLink, ...prev.slice(0, 4)]);
      } else {
        // You might want to show an error toast here
        console.error("Link creation returned null");
      }
    } catch (error) {
      console.error("An unexpected error occurred during link creation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
          Create Instant Payment Link
        </h1>
        {/* <p className="text-lg text-slate-400 max-w-xl mx-auto">
          Generate secure and shareable payment links in seconds.
        </p> */}
      </div>

      <WalletStatus 
        getMerchantAddress={getMerchantAddress} 
        isConnected={isConnected} 
      />

      <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-sm mt-8 !rounded-3xl">
        <form onSubmit={handleCreateLink}>
          <CardHeader>
            <LinkTypeSelector
              linkType={formData.linkType}
              onLinkTypeChange={(type) => updateFormData({ linkType: type })}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.linkType === "OFF_RAMP" ? (
              <OffRampFields
                formData={formData}
                supportedInstitutions={supportedInstitutions}
                supportedCurrencies={supportedCurrencies}
                onUpdate={updateFormData}
              />
            ) : (
              <NormalLinkFields
                formData={formData}
                onUpdate={updateFormData}
              />
            )}

            <AmountDescriptionFields
              formData={formData}
              onUpdate={updateFormData}
              linkType={formData.linkType}
            />

            <ExpirationField
              formData={formData}
              onUpdate={updateFormData}
            />
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              disabled={isLoading || !isConnected}
              className="w-full text-lg py-7 font-bold text-white rounded-2xl transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/20 hover:shadow-purple-500/30 focus:ring-4 focus:ring-purple-500/50 disabled:bg-slate-700 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <LinkIcon className="mr-2 h-5 w-5" />
              )}
              {isLoading ? "Generating Link..." : "Generate Payment Link"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {generatedLink && (
        <div className="mt-8">
          <GeneratedLinkDisplay
            generatedLink={generatedLink}
            onCopy={() => {}}
            onDownloadQR={() => {}}
            onShare={handleShare}
          />
        </div>
      )}
    </div>
  );
};