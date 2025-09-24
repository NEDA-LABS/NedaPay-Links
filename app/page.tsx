import { redirect } from 'next/navigation';

export default function HomePage() {
  // Create a demo payment link with sample parameters
  const demoParams = new URLSearchParams({
    amount: '10',
    currency: 'USDC',
    description: 'Demo Payment - NedaPay Showcase',
    to: '0x742d35Cc6634C0532925a3b8D8B7c4C0532925a3b',
    chainId: '8453', // Base chain
    sig: 'demo-signature-for-showcase'
  });

  // Redirect to demo payment link
  redirect(`/pay/demo-payment-link?${demoParams.toString()}`);
}
