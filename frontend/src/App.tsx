import { useEffect, useState } from 'react';
import Web3 from 'web3';

const CONTRACT_ABI = [
  {
    "inputs": [{"name": "_number", "type": "uint256"}],
    "name": "makeGuess",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "guesses",
    "outputs": [
      {"name": "player", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "guessedNumber", "type": "uint256"},
      {"name": "hasGuessed", "type": "bool"}
    ],
    "stateMutability": "view",
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
    }
  }, []);

  const connectWallet = async () => {
    if (!web3) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setAccount(accounts[0]);
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
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
      const response = await fetch(`http://localhost:3001/api/game/status/${address}`);
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

    try {
      const gameStatus = await checkGameStatus(account);
      if (gameStatus?.hasGuessed) {
        setStatus('You have already made a guess! Wait for the next round.');
        return;
      }

      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      
      await contract.methods.makeGuess(Number(guess)).send({
        from: account,
        value: web3.utils.toWei(betAmount, 'ether')
      });

      setStatus('Guess submitted successfully!');
    } catch (error: any) {
      console.error('Error:', error);
      if (error.message.includes("Already guessed")) {
        setStatus('You have already made a guess!');
      } else if (error.message.includes("Minimum bet not met")) {
        setStatus('Minimum bet is 0.01 ETH!');
      } else {
        setStatus('Error submitting guess. Please try again.');
      }
    }
  };
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Number Guessing Game</h1>
      
      {!account ? (
        <button 
          onClick={connectWallet}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <button 
              onClick={disconnectWallet}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Disconnect
            </button>
          </div>
          
          <div>
            <label className="block">Your Guess (1-10):</label>
            <input
              type="number"
              min="1"
              max="10"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block">Bet Amount (ETH):</label>
            <input
              type="number"
              step="0.01"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <button
            onClick={submitGuess}
            className="bg-green-500 text-white px-4 py-2 rounded w-full"
          >
            Submit Guess
          </button>

          {status && (
            <p className="mt-4 p-2 bg-gray-100 rounded">{status}</p>
          )}
        </div>
      )}
    </div>
  );
};