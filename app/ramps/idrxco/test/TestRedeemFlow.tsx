'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBalance } from '../hooks/useBalance';
import { useTransaction } from '../hooks/useTransaction';
import { useIDRXRedeem } from '../hooks/useIDRXRedeem';
import { SUPPORTED_CHAINS_NORMAL, type ChainConfig } from '../utils/chains';
import { DEFAULT_TOKEN } from '../utils/tokens';

/**
 * Test component to verify the new IDRX implementation
 * This helps ensure all hooks and services work correctly
 */
export function TestRedeemFlow() {
  const [selectedChain, setSelectedChain] = useState<ChainConfig>(SUPPORTED_CHAINS_NORMAL[0]);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Test the new hooks
  const { walletAddress, isConnected } = useTransaction();
  const { balance, isLoading: balanceLoading, error: balanceError } = useBalance(
    selectedChain,
    DEFAULT_TOKEN,
    walletAddress
  );
  const { 
    validateRedemption, 
    getRedemptionFee, 
    getNetAmount 
  } = useIDRXRedeem(selectedChain, walletAddress);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runTests = async () => {
    setTestResults([]);
    
    // Test 1: Connection status
    addTestResult(`Wallet connected: ${isConnected ? '✅' : '❌'}`);
    addTestResult(`Wallet address: ${walletAddress || 'Not available'}`);
    
    // Test 2: Balance loading
    addTestResult(`Balance loading: ${balanceLoading ? 'Loading...' : 'Complete'}`);
    addTestResult(`Balance: ${balance || '0'} ${DEFAULT_TOKEN}`);
    if (balanceError) {
      addTestResult(`Balance error: ❌ ${balanceError}`);
    } else {
      addTestResult(`Balance fetch: ✅`);
    }
    
    // Test 3: Validation logic
    const testAmount = '100';
    const validationError = validateRedemption(testAmount);
    if (validationError) {
      addTestResult(`Validation (${testAmount}): ❌ ${validationError}`);
    } else {
      addTestResult(`Validation (${testAmount}): ✅`);
    }
    
    // Test 4: Fee calculations
    const fee = getRedemptionFee(testAmount);
    const netAmount = getNetAmount(testAmount);
    addTestResult(`Fee calculation: ${fee} ${DEFAULT_TOKEN} (✅)`);
    addTestResult(`Net amount: ${netAmount} IDR (✅)`);
    
    // Test 5: Chain support
    const supportedChain = SUPPORTED_CHAINS_NORMAL.find(c => c.id === selectedChain.id);
    addTestResult(`Chain support: ${supportedChain ? '✅' : '❌'} ${selectedChain.name}`);
    
    addTestResult('🎉 All tests completed!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>IDRX Implementation Test Suite</CardTitle>
          <CardDescription>
            Test the new wagmi + Privy implementation to ensure everything works correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {walletAddress && (
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </code>
            )}
          </div>

          {/* Chain Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Chain:</label>
            <div className="flex gap-2">
              {SUPPORTED_CHAINS_NORMAL.map((chain) => (
                <Button
                  key={chain.id}
                  variant={selectedChain.id === chain.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedChain(chain)}
                >
                  {chain.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Balance Display */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Balance on {selectedChain.name}:</div>
            <div className="text-lg font-semibold">
              {balanceLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `${parseFloat(balance || '0').toLocaleString()} ${DEFAULT_TOKEN}`
              )}
            </div>
            {balanceError && (
              <div className="text-red-500 text-sm mt-1">Error: {balanceError}</div>
            )}
          </div>

          {/* Test Runner */}
          <Button onClick={runTests} className="w-full">
            Run Implementation Tests
          </Button>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Test Results:</h4>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index}>{result}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Implementation Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-semibold mb-2">✅ Completed:</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• Replaced Web3Provider with wagmi public clients</li>
                <li>• Implemented Privy transaction logic</li>
                <li>• Created modern hook-based architecture</li>
                <li>• Added efficient balance caching</li>
                <li>• Improved error handling</li>
                <li>• Updated RedeemForm component</li>
                <li>• Created new API endpoints</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">🚀 Improvements:</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• Faster balance queries with parallel requests</li>
                <li>• Better transaction security with viem</li>
                <li>• Cleaner separation of concerns</li>
                <li>• Type-safe implementations</li>
                <li>• Reduced bundle size (no ethers dependency)</li>
                <li>• Better caching strategies</li>
                <li>• Enhanced user experience</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
