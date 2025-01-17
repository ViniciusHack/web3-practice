// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NumberGuessingGame {
    // Think of these like private class properties in TypeScript
    address private owner;
    uint256 private winningNumber;
    uint256 private minBet = 0.01 ether;
    
    // Similar to TypeScript interfaces
    struct Guess {
        address player;
        uint256 amount;
        uint256 guessedNumber;
        bool hasGuessed;
    }
    
    // Like a Map<address, Guess> in TypeScript
    mapping(address => Guess) public guesses;
    
    // Similar to TypeScript events/emitters
    event NewGuess(address player, uint256 amount);
    event Winner(address player, uint256 amount);
    
    // Constructor (like a class constructor in TypeScript)
    constructor() {
        owner = msg.sender;
        // Generate a random-ish number between 1-3
        winningNumber = (block.timestamp % 3) + 1;
    }
    
    // Public method (like a public class method)
    function makeGuess(uint256 _number) public payable {
        require(_number > 0 && _number <= 3, "Guess must be between 1 and 3");
        require(msg.value >= minBet, "Minimum bet not met");
        require(!guesses[msg.sender].hasGuessed, "Already guessed");
        
        // Store the guess
        guesses[msg.sender] = Guess(
            msg.sender,
            msg.value,
            _number,
            true
        );
        
        emit NewGuess(msg.sender, msg.value);
        
        // Check if won
        if (_number == winningNumber) {
            uint256 prize = msg.value * 2;
            payable(msg.sender).transfer(prize);
            emit Winner(msg.sender, prize);
        }
    }
}