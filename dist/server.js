"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_cors = __toESM(require("cors"));
var import_dotenv = require("dotenv");
var import_ethers = require("ethers");
var import_express = __toESM(require("express"));
var app = (0, import_express.default)();
(0, import_dotenv.config)();
app.use((0, import_cors.default)());
app.use(import_express.default.json());
var serializeGuess = (guess) => ({
  player: guess.player,
  amount: guess.amount.toString(),
  guessedNumber: guess.guessedNumber.toString(),
  hasGuessed: guess.hasGuessed
});
var CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
var PROVIDER = new import_ethers.ethers.JsonRpcProvider(process.env.ETHEREUM_NODE_URL);
app.get("/api/game/status/:address", async (req, res) => {
  if (!CONTRACT_ADDRESS) {
    return res.status(500).json({
      error: "Contract address not configured"
    });
  }
  try {
    const contract = new import_ethers.ethers.Contract(
      CONTRACT_ADDRESS,
      ["function guesses(address) view returns (address player, uint256 amount, uint256 guessedNumber, bool hasGuessed)"],
      PROVIDER
    );
    const guess = await contract.guesses(req.params.address);
    console.log(guess);
    res.json({ guess: serializeGuess(guess) });
  } catch (error) {
    console.error("Error fetching game status:", error);
    res.status(500).json({
      error: "Failed to fetch game status",
      details: error.message
    });
  }
});
var PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Contract address: ${CONTRACT_ADDRESS}`);
  console.log(`Ethereum node URL: ${process.env.ETHEREUM_NODE_URL}`);
});
