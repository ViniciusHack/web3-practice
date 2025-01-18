import cors from 'cors';
import { config } from 'dotenv';
import { ethers } from 'ethers';
import express from 'express';

const app = express();
config();

app.use(cors());
app.use(express.json());

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

const serializeGuess = (guess: any) => ({
    player: guess.player,
    amount: guess.amount.toString(),
    guessedNumber: guess.guessedNumber.toString(),
    hasGuessed: guess.hasGuessed
});

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PROVIDER = new ethers.JsonRpcProvider(process.env.ETHEREUM_NODE_URL);

app.get('/api/game/status/:address', async (req: any, res: any) => {
    if (!CONTRACT_ADDRESS) {
        return res.status(500).json({ 
            error: 'Contract address not configured' 
        });
    }

    try {
        console.log('Attempting to connect to contract at:', CONTRACT_ADDRESS);
        const contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            PROVIDER
        );
        
        console.log('Fetching guess for address:', req.params.address);
        // Ensure the address is properly formatted
        const formattedAddress = ethers.getAddress(req.params.address);
        console.log('Formatted address:', formattedAddress);
        
        const guess = await contract.guesses(formattedAddress);
        console.log('Raw guess data:', guess);
        res.json({ guess: serializeGuess(guess) });
    } catch (error: any) {
        console.error('Detailed error information:', {
            message: error.message,
            code: error.code,
            value: error.value,
            info: error.info,
            stack: error.stack
        });
        res.status(500).json({ 
            error: 'Failed to fetch game status',
            details: error.message,
            errorInfo: {
                code: error.code,
                value: error.value,
                info: error.info
            }
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Contract address: ${CONTRACT_ADDRESS}`);
    console.log(`Ethereum node URL: ${process.env.ETHEREUM_NODE_URL}`);
});