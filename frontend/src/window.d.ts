export { };

declare global {
  interface Window {
    ethereum?: import('web3').provider;
  }
}