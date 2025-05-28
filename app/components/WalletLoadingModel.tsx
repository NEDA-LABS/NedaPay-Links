import React from 'react';

interface WalletLoadingModalProps {
  isVisible: boolean;
  walletType?: string;
  userAddress?: string;
  userName?: string;
}

const WalletLoadingModal: React.FC<WalletLoadingModalProps> = ({ 
  isVisible, 
  walletType = "wallet",
  userAddress,
  userName 
}) => {
  console.log("WalletLoadingModal rendering with props:", { isVisible, walletType, userAddress, userName });
  if (!isVisible) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0, 0, 0, 0.5)', 
      zIndex: 9999, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        textAlign: 'center' 
      }}>
        <h2>Wallet Connected!</h2>
        <p>Loading...</p>
        {userAddress && <p>Address: {userAddress}</p>}
        {userName && <p>Name: {userName}</p>}
      </div>
    </div>
  );
};

export default WalletLoadingModal;