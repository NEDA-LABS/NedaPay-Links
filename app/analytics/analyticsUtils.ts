import { stablecoins } from '../data/stablecoins';

export const processBalances = (balanceData: Record<string, string>, networkChainId?: number) => {
  const processed = stablecoins.map((coin) => {
    let balance = '0';
    if (!networkChainId || coin.chainId === networkChainId) {
      balance = balanceData[coin.baseToken] || '0';
    }
    return {
      symbol: coin.baseToken,
      name: coin.name,
      balance,
      flag: coin.flag || '🌐',
      region: coin.region || 'Unknown',
    };
  });
  const total = processed.reduce((sum, coin) => sum + parseInt(coin.balance.replace(/,/g, '')), 0);
  const processedCoins = processed.map(coin => ({
    ...coin,
    percentage: total > 0 ? Math.round((parseInt(coin.balance.replace(/,/g, '')) / total) * 100) : 0
  }));
  return {
    processedBalances: processed,
    totalReceived: total.toLocaleString(),
    processedStablecoins: processedCoins
  };
};

export async function fetchIncomingPayments(merchantAddress: `0x${string}`) {
  console.log("merchantAddress debug:", merchantAddress); //debugging
  if (!merchantAddress) return [];

  try {
    // Fetch transactions from the database via API
    const response = await fetch(`/api/transactions?merchantId=${merchantAddress}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }
    const txs = await response.json();
    console.log('Fetched transactions debug:', txs); //debugging

    // Map database transactions to UI-expected format
    const formattedTxs = txs.map((tx: any) => {
      const date = tx.createdAt ? new Date(tx.createdAt) : new Date();
      const transactionHash = tx.txHash;
      const sender = tx.wallet; // Use wallet as sender address
      return {
        id: transactionHash,
        shortId: transactionHash.slice(0, 6) + '...' + transactionHash.slice(-4),
        date: date.toISOString().replace('T', ' ').slice(0, 16), // Format as "YYYY-MM-DD HH:mm"
        amount: tx.amount.toFixed(2), // Ensure 2 decimal places
        currency: tx.currency,
        status: tx.status.charAt(0).toUpperCase() + tx.status.slice(1), // Capitalize status
        sender,
        senderShort: sender.slice(0, 6) + '...' + sender.slice(-4),
        blockExplorerUrl: `https://basescan.org/tx/${transactionHash}`
      };
    });

    // Sort by date (newest first) and limit to 10
    formattedTxs.sort((a: any, b: any) => b.date.localeCompare(a.date));
    return formattedTxs.slice(0, 10);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export const getPaymentMethodsData = (balanceData: Record<string, string>) => {
  const { processedStablecoins } = processBalances(balanceData);
  return {
    labels: processedStablecoins.map((coin: any) => coin.symbol),
    datasets: [
      {
        label: 'Payment Methods',
        data: processedStablecoins.map((coin: any) => coin.percentage),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',  // Blue
          'rgba(16, 185, 129, 0.8)',  // Green
          'rgba(245, 158, 11, 0.8)',  // Amber
          'rgba(139, 92, 246, 0.8)',  // Purple
          'rgba(239, 68, 68, 0.8)'    // Red
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
};