import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, WalletIcon } from "lucide-react";
import { useEffect, useState } from 'react';
import Web3 from 'web3';

const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "NewGuess",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Winner",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "guesses",
    "outputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "guessedNumber",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "hasGuessed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_number",
        "type": "uint256"
      }
    ],
    "name": "makeGuess",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export const GuessingGame = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string>('');
  const [guess, setGuess] = useState<string>('');
  const [betAmount, setBetAmount] = useState<string>('0.01');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      
      // Check if we're on the right network
      web3Instance.eth.getChainId().then((chainId) => {
        console.log('Current chain ID:', chainId);
        if (Number(chainId) !== 31337) { // Hardhat's chain ID
          setStatus('❌ Please connect to Hardhat Network (Chain ID: 31337)');
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    if (!web3) return;
    
    try {
      // First check/switch to the correct network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7A69' }], // 31337 in hex
        });
      } catch (switchError) {
        // If the network doesn't exist, add it
        if (switchError && typeof switchError === 'object' && 'code' in switchError && switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7A69', // 31337 in hex
                chainName: 'Hardhat Network',
                nativeCurrency: {
                  name: 'Hardhat Ether',
                  symbol: 'hETH',
                  decimals: 18
                },
                rpcUrls: ['http://127.0.0.1:8545/'],
                blockExplorerUrls: [],
                iconUrls: []
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
      
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setAccount(accounts[0]);
      setStatus(''); // Clear any previous error messages
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      setStatus('❌ Failed to connect wallet. Please try again.');
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.ethereum?.removeAllListeners) {
        window.ethereum.removeAllListeners();
      }
      
      setAccount('');
      setWeb3(null);
      setStatus('');
      
      window.location.reload();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  const checkGameStatus = async (address: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/game/status/${address}`);
      const data = await response.json();
      return data.guess;
    } catch (error) {
      console.error('Error checking game status:', error);
      return null;
    }
  };

  const submitGuess = async () => {
    if (!web3 || !account) {
      setStatus('Please connect your wallet first!');
      return;
    }

    if (!guess || Number(guess) < 1 || Number(guess) > 3) {
      setStatus('Please enter a valid number between 1 and 3');
      return;
    }

    if (!betAmount || Number(betAmount) < 0.01) {
      setStatus('Minimum bet amount is 0.01 ETH');
      return;
    }

    setStatus('Processing your guess...');

    try {
      console.log('Checking game status for account:', account);
      const gameStatus = await checkGameStatus(account);
      console.log('Game status:', gameStatus);
      
      if (gameStatus?.hasGuessed) {
        setStatus('You have already made a guess! Wait for the next round.');
        return;
      }

      console.log('Creating contract instance with address:', CONTRACT_ADDRESS);
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      
      console.log('Submitting guess:', {
        number: Number(guess),
        betAmount: betAmount,
        weiAmount: web3.utils.toWei(betAmount, 'ether')
      });
      
      const tx = await contract.methods.makeGuess(Number(guess)).send({
        from: account,
        value: web3.utils.toWei(betAmount, 'ether')
      });
      
      console.log('Transaction result:', tx);

      setStatus('🎉 Guess submitted successfully! Good luck!');
      setGuess('');
      setBetAmount('0.01');
    } catch (error: unknown) {
      console.error('Detailed error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error message:', errorMessage);
      
      if (errorMessage.includes("Already guessed")) {
        setStatus('❌ You have already made a guess!');
      } else if (errorMessage.includes("Minimum bet not met")) {
        setStatus('❌ Minimum bet is 0.01 ETH!');
      } else {
        setStatus(`❌ Error submitting guess: ${errorMessage}`);
      }
    }
  };
  
  return (
    <div className="container max-w-lg mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            🎲 Web3 Number Guessing Game
          </CardTitle>
          <CardDescription className="text-center">
            Guess a number between 1-3 and try your luck!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!account ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Connect your wallet to start playing!
              </p>
              <Button 
                onClick={connectWallet} 
                className="w-full" 
                size="lg"
                variant="default"
              >
                <WalletIcon className="mr-2 h-4 w-4" />
                Connect MetaMask
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </div>
                <Button 
                  onClick={disconnectWallet}
                  variant="destructive"
                  size="sm"
                >
                  Disconnect
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guess">Your Guess</Label>
                  <Input
                    id="guess"
                    type="number"
                    min="1"
                    max="3"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Enter a number (1-3)"
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Choose a number between 1 and 3
                  </p>  
                </div>

                <div className="space-y-2">
                  <Label htmlFor="betAmount">Bet Amount</Label>
                  <div className="relative">
                    <Input
                      id="betAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="0.01"
                      className="text-lg pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ETH
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Minimum bet: 0.01 ETH
                  </p>
                </div>
              </div>

              <Button
                onClick={submitGuess}
                disabled={!guess || Number(guess) < 1 || Number(guess) > 3 || !betAmount || Number(betAmount) < 0.01}
                className="w-full"
                size="lg"
              >
                {status.includes('Processing') ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  '🎯'
                )}
                Submit Guess
              </Button>

              {status && (
                <Alert variant={
                  status.includes('❌') ? 'destructive' : 
                  status.includes('🎉') ? 'default' : 
                  'default'
                }>
                  {status.includes('❌') ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : status.includes('🎉') ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <AlertTitle>
                    {status.includes('❌') ? 'Error' : 
                     status.includes('🎉') ? 'Success' : 
                     'Processing'}
                  </AlertTitle>
                  <AlertDescription>
                    {status}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};