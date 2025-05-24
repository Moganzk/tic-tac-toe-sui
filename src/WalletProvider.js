import { WalletProvider as SuietWalletProvider, ConnectButton, useWallet } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';

// Optionally, you can wrap SuietWalletProvider to allow for custom configuration later
export function WalletProvider({ children }) {
  return <SuietWalletProvider>{children}</SuietWalletProvider>;
}

export { ConnectButton, useWallet };