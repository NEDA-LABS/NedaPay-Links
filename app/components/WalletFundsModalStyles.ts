import styled from 'styled-components';
import { useTheme } from 'next-themes';

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 1rem;
  
  /* Mobile-first approach */
  @media (max-width: 480px) {
    align-items: flex-end;
    padding: 0;
    width: 100vw;
  }
`;

export const ModalContent = styled.div<{ theme?: string }>`
  background: ${({ theme }) => (theme === 'dark' ? '#1F2937' : 'white')};
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  height: auto;
  box-shadow: ${({ theme }) => 
    theme === 'dark' 
      ? '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
      : '0 10px 40px rgba(0, 0, 0, 0.2)'
  };
  z-index: 10000;

  /* Ensure it doesn't overflow on mobile */
  @media (max-width: 480px) {
    width: 95vw;
    height: 100vh;
    max-height: 100vh;
    max-width: 95vw;
    margin: 0;
    border-radius: 20px 20px 0 0;
    /* Prevent horizontal overflow */
    box-sizing: border-box;
  }
`;

export const ModalHeader = styled.div<{ theme?: string }>`
  color: ${({ theme }) => (theme === 'dark' ? '#F9FAFB' : '#111827')};
  background: ${({ theme }) => (theme === 'dark' ? '#1F2937' : 'white')};
  padding: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => (theme === 'dark' ? '#374151' : '#E5E7EB')};
  position: relative;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

export const ModalTitle = styled.div<{ theme?: string }>`
  padding-right: 3rem; /* Space for close button */
  
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${({ theme }) => (theme === 'dark' ? '#F9FAFB' : '#111827')};
    margin: 0 0 0.5rem 0;
    
    @media (max-width: 480px) {
      font-size: 1.25rem;
    }
  }
  
  .wallet-address {
    display: flex;
    align-items: center;
    color: ${({ theme }) => (theme === 'dark' ? '#9CA3AF' : '#6B7280')};
    font-size: 0.875rem;
    
    @media (max-width: 480px) {
      font-size: 0.75rem;
    }
    
    span {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      
      @media (min-width: 480px) {
        max-width: 200px;
      }
    }
  }
`;

export const ModalBody = styled.div<{ theme?: string }>`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  background: ${({ theme }) => (theme === 'dark' ? '#1F2937' : 'white')};
  
  @media (max-width: 480px) {
    padding: 1rem;
  }
  
  /* Prevent horizontal overflow */
  overflow-x: hidden;
  
  .total-balance {
    font-size: 2.5rem;
    font-weight: 700;
    color: ${({ theme }) => (theme === 'dark' ? '#F9FAFB' : '#111827')};
    margin-bottom: 1.5rem;
    
    @media (max-width: 480px) {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  }
`;

export const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 480px) {
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary'; theme?: string }>`
  padding: 1rem;
  font-weight: 600;
  border-radius: 16px;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    font-size: 0.875rem;
    border-radius: 12px;
  }
  
  ${({ variant, theme }) =>
    variant === 'secondary'
      ? `
        background: ${theme === 'dark' ? '#374151' : '#F3F4F6'};
        color: ${theme === 'dark' ? '#F9FAFB' : '#111827'};
        &:hover:not(:disabled) {
          background: ${theme === 'dark' ? '#4B5563' : '#E5E7EB'};
        }
      `
      : `
        background: #3B82F6;
        color: white;
        &:hover:not(:disabled) {
          background: #2563EB;
        }
      `}
`;

export const TokenCard = styled.div<{ selected?: boolean; theme?: string }>`
  padding: 1rem;
  border: 2px solid ${({ selected, theme }) => 
    selected 
      ? '#3B82F6' 
      : theme === 'dark' 
        ? '#374151' 
        : '#E5E7EB'
  };
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: border 0.2s ease;
  margin-bottom: 0.75rem;
  background: ${({ theme }) => (theme === 'dark' ? '#1F2937' : 'white')};
  
  &:hover {
    border-color: #3B82F6;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    border-radius: 12px;
    margin-bottom: 0.5rem;
  }
  
  .token-info {
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1;
    
    .token-details {
      min-width: 0;
      flex: 1;
      
      .token-symbol {
        font-weight: 600;
        color: ${({ theme }) => (theme === 'dark' ? '#F9FAFB' : '#111827')};
        font-size: 1rem;
        
        @media (max-width: 480px) {
          font-size: 0.875rem;
        }
      }
      
      .token-balance {
        color: ${({ theme }) => (theme === 'dark' ? '#9CA3AF' : '#6B7280')};
        font-size: 0.875rem;
        
        @media (max-width: 480px) {
          font-size: 0.75rem;
        }
      }
    }
  }
  
  .token-value {
    font-weight: 700;
    color: ${({ theme }) => (theme === 'dark' ? '#F9FAFB' : '#111827')};
    text-align: right;
    font-size: 1rem;
    
    @media (max-width: 480px) {
      font-size: 0.875rem;
    }
  }
`;

export const TokenIcon = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ color }) => color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
    margin-right: 0.75rem;
  }
  
  span {
    color: white;
    font-weight: 700;
    font-size: 0.875rem;
    
    @media (max-width: 480px) {
      font-size: 0.75rem;
    }
  }
`;

export const WarningBox = styled.div<{ theme?: string }>`
  background: ${({ theme }) => 
    theme === 'dark' ? '#451A03' : '#FEF3C7'
  };
  border: 1px solid ${({ theme }) => 
    theme === 'dark' ? '#78350F' : '#FDE68A'
  };
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 480px) {
    border-radius: 12px;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .warning-content {
    display: flex;
    align-items: flex-start;
    
    .warning-icon {
      flex-shrink: 0;
      margin-right: 0.75rem;
      margin-top: 0.125rem;
    }
    
    .warning-text {
      min-width: 0;
      
      .warning-title {
        font-weight: 600;
        color: ${({ theme }) => 
          theme === 'dark' ? '#FCD34D' : '#92400E'
        };
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
        
        @media (max-width: 480px) {
          font-size: 0.75rem;
        }
      }
      
      .warning-description {
        color: ${({ theme }) => 
          theme === 'dark' ? '#F59E0B' : '#B45309'
        };
        font-size: 0.875rem;
        line-height: 1.4;
        
        @media (max-width: 480px) {
          font-size: 0.75rem;
        }
      }
    }
  }
`;

export const Input = styled.input<{ error?: boolean; theme?: string }>`
  width: 100%;
  padding: 1rem;
  border: 1px solid ${({ error, theme }) => 
    error 
      ? '#DC2626' 
      : theme === 'dark' 
        ? '#374151' 
        : '#D1D5DB'
  };
  border-radius: 16px;
  font-size: 1rem;
  transition: 0.2s ease;
  box-sizing: border-box;
  background: ${({ theme }) => (theme === 'dark' ? '#111827' : 'white')};
  color: ${({ theme }) => (theme === 'dark' ? '#F9FAFB' : '#111827')};
  
  &::placeholder {
    color: ${({ theme }) => (theme === 'dark' ? '#6B7280' : '#9CA3AF')};
  }
  
  &:focus {
    outline: none;
    border-color: ${({ error }) => (error ? '#DC2626' : '#3B82F6')};
    box-shadow: 0 0 0 3px ${({ error }) => 
      error 
        ? 'rgba(220, 38, 38, 0.1)' 
        : 'rgba(59, 130, 246, 0.1)'
    };
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    font-size: 0.875rem;
    border-radius: 12px;
  }
`;

export const MaxButton = styled.button<{ theme?: string }>`
  background: ${({ theme }) => (theme === 'dark' ? '#374151' : '#F3F4F6')};
  color: #3B82F6;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => (theme === 'dark' ? '#4B5563' : '#E5E7EB')};
  }
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
    padding: 0.25rem 0.375rem;
  }
`;

export const SuccessIcon = styled.div<{ theme?: string }>`
  width: 80px;
  height: 80px;
  background: ${({ theme }) => (theme === 'dark' ? '#064E3B' : '#DCFCE7')};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
  
  @media (max-width: 480px) {
    width: 64px;
    height: 64px;
    margin-bottom: 1rem;
  }
`;

export const CloseButton = styled.button<{ theme?: string }>`
  position: absolute;
  right: 1rem;
  top: 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.2s ease;
  color: ${({ theme }) => (theme === 'dark' ? '#9CA3AF' : '#6B7280')};
  
  &:hover {
    background: ${({ theme }) => (theme === 'dark' ? '#374151' : '#F3F4F6')};
  }
  
  @media (max-width: 480px) {
    right: 0.75rem;
    top: 0.75rem;
    padding: 0.375rem;
  }
`;

// Additional utility styles
export const TabNavigation = styled.div<{ theme?: string }>`
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => (theme === 'dark' ? '#374151' : '#E5E7EB')};
  overflow-x: auto;
  background: ${({ theme }) => (theme === 'dark' ? '#1F2937' : 'white')};
  
  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
  
  button {
    padding: 0.75rem 0;
    margin-right: 2rem;
    font-weight: 600;
    border: none;
    background: transparent;
    cursor: pointer;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    
    @media (max-width: 480px) {
      margin-right: 1.5rem;
      padding: 0.5rem 0;
      font-size: 0.875rem;
    }
    
    &.active {
      color: ${({ theme }) => (theme === 'dark' ? '#F9FAFB' : '#111827')};
      border-bottom-color: ${({ theme }) => (theme === 'dark' ? '#F9FAFB' : '#111827')};
    }
    
    &:not(.active) {
      color: ${({ theme }) => (theme === 'dark' ? '#9CA3AF' : '#6B7280')};
      
      &:hover {
        color: ${({ theme }) => (theme === 'dark' ? '#F9FAFB' : '#111827')};
      }
    }
  }
`;

export const GasSummary = styled.div<{ theme?: string }>`
  background: ${({ theme }) => (theme === 'dark' ? '#111827' : '#F9FAFB')};
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid ${({ theme }) => (theme === 'dark' ? '#374151' : 'transparent')};
  
  @media (max-width: 640px) {
    border-radius: 12px;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .gas-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    
    &:last-child {
      margin-bottom: 0;
      padding-top: 0.5rem;
      border-top: 1px solid ${({ theme }) => (theme === 'dark' ? '#374151' : '#E5E7EB')};
    }
    
    .gas-label {
      color: ${({ theme }) => (theme === 'dark' ? '#9CA3AF' : '#6B7280')};
      font-size: 0.875rem;
      
      @media (max-width: 640px) {
        font-size: 0.75rem;
      }
    }
    
    .gas-value {
      font-weight: 600;
      color: ${({ theme }) => (theme === 'dark' ? '#F9FAFB' : '#111827')};
      font-size: 0.875rem;
      
      @media (max-width: 640px) {
        font-size: 0.75rem;
      }
      
      &.total {
        font-weight: 700;
      }
    }
  }
`;

export const FormGroup = styled.div<{ theme?: string }>`
  margin-bottom: 1.5rem;
  
  @media (max-width: 640px) {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    font-weight: 600;
    color: ${({ theme }) => (theme === 'dark' ? '#D1D5DB' : '#374151')};
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    
    @media (max-width: 640px) {
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
    }
  }
  
  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    
    @media (max-width: 640px) {
      margin-bottom: 0.5rem;
    }
  }
  
  .error-message {
    color: #DC2626;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    
    @media (max-width: 640px) {
      font-size: 0.75rem;
    }
  }
`;