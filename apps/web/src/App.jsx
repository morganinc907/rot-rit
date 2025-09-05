import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, base, hardhat } from 'wagmi/chains';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

// Pages
import Rituals from './pages/Rituals';
import MawNew from './pages/MawNew';
import MawMobileOptimized from './pages/MawMobileOptimized';
import MawResponsive from './pages/MawResponsive';
import TestMobile from './pages/TestMobile';
import AutoRitualOverlay from './components/AutoRitualOverlay';
import Store from './pages/Store';
import StoreDebug from './pages/StoreDebug';
import RaccoonGallery from './pages/RaccoonGallery';
import RaccoonDetail from './pages/RaccoonDetail';
import Mint from './pages/Mint';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ContractErrorBoundary from './components/ContractErrorBoundary';
import ContractAddressGuard from './components/ContractAddressGuard';

// Styles
import '@rainbow-me/rainbowkit/styles.css';
import './App.css';

// Configure chains
const chains = [baseSepolia, base, hardhat];

const config = getDefaultConfig({
  appName: 'Rot & Ritual',
  projectId: import.meta.env.VITE_WALLETCONNECT_ID || '00000000000000000000000000000000',
  chains,
  ssr: false,
});

const queryClient = new QueryClient();

function App() {
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ContractErrorBoundary>
            <ContractAddressGuard>
              <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="app">
                <Navbar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Rituals />} />
                    <Route path="/crypt" element={<Rituals />} />
                    <Route path="/maw" element={<MawResponsive />} />
                    <Route path="/maw-desktop" element={<MawNew />} />
                    <Route path="/maw-mobile" element={<MawMobileOptimized />} />
                    <Route path="/test-mobile" element={<TestMobile />} />
                    <Route path="/rituals" element={<Rituals />} />
                    <Route path="/store" element={<Store />} />
                    <Route path="/store-debug" element={<StoreDebug />} />
                    <Route path="/mint" element={<Mint />} />
                    {/* Raccoon routes - temporarily disabled
                    <Route path="/raccoons" element={<RaccoonGallery />} />
                    <Route path="/raccoons/:id" element={<RaccoonDetail />} />
                    */}
                  </Routes>
                </main>
                <Footer />
                
                {/* Auto-triggering Ritual Overlay for Demon Summons */}
                <AutoRitualOverlay />
                
                <Toaster 
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: '#1a1320',
                    color: '#d4c5db',
                    border: '1px solid #4a3958'
                  }
                }}
                />
              </div>
              </Router>
            </ContractAddressGuard>
          </ContractErrorBoundary>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;