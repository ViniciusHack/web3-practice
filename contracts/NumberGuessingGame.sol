// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NumberGuessingGame {
    address private owner;
    uint256 private winningNumber;
    uint256 private minBet = 0.01 ether;
    
    struct Guess {
        address player;
        uint256 amount;
        uint256 guessedNumber;
        bool hasGuessed;
    }
    
    mapping(address => Guess) public guesses;
    
    event NewGuess(address player, uint256 amount);
    event Winner(address player, uint256 amount);
    
    constructor() {
        owner = msg.sender;
        winningNumber = (block.timestamp % 2) + 1;
    }
    
    function makeGuess(uint256 _number) public payable {
        require(_number > 0 && _number <= 2, "Guess must be between 1 and 2");
        require(msg.value >= minBet, "Minimum bet not met");
        require(!guesses[msg.sender].hasGuessed, "Already guessed");
        
        guesses[msg.sender] = Guess(
            msg.sender,
            msg.value,
            _number,
            true
        );
        
        emit NewGuess(msg.sender, msg.value);
        
        if (_number == winningNumber) {
            uint256 prize = msg.value * 2;
            payable(msg.sender).transfer(prize);
            emit Winner(msg.sender, prize);
        }
    }
}