import cors from 'cors';
import { config } from 'dotenv';
import { ethers } from 'ethers';
import express from 'express';

const app = express();
config();

app.use(cors());
app.use(express.json());

// Helper function to serialize BigInt
const serializeGuess = (guess: any) => ({
    player: guess.player,
    amount: guess.amount.toString(),
    guessedNumber: guess.guessedNumber.toString(),
    hasGuessed: guess.hasGuessed
});

// Contract setup
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PROVIDER = new ethers.JsonRpcProvider(process.env.ETHEREUM_NODE_URL);

// API endpoints
app.get('/api/game/status/:address', async (req: any, res: any) => {
    if (!CONTRACT_ADDRESS) {
        return res.status(500).json({ 
            error: 'Contract address not configured' 
        });
    }

    try {
        const contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            ['function guesses(address) view returns (address player, uint256 amount, uint256 guessedNumber, bool hasGuessed)'],
            PROVIDER
        );
        
        const guess = await contract.guesses(req.params.address);
        console.log(guess);
        res.json({ guess: serializeGuess(guess) });
    } catch (error: any) {
        console.error('Error fetching game status:', error);
        res.status(500).json({ 
            error: 'Failed to fetch game status',
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Contract address: ${CONTRACT_ADDRESS}`);
    console.log(`Ethereum node URL: ${process.env.ETHEREUM_NODE_URL}`);
});