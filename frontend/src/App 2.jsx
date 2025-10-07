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
import MawResponsive from './pages/MawResponsive'; // Now just exports the unified responsive MawNew
// import MawHero from './pages/MawHero'; // New hero layout design - temporarily disabled due to JSX error
import MawHeroStyled from './pages/MawHero.styled.noheader'; // ChatGPT styled version
import TestMobile from './pages/TestMobile';
import AutoRitualOverlay from './components/AutoRitualOverlay';
import Store from './pages/Store';
import StoreDebug from './pages/StoreDebug';
import RaccoonGallery from './pages/RaccoonGallery';
import RaccoonDetail from './pages/RaccoonDetail';
import Mint from './pages/Mint';
import Admin from './pages/Admin';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ContractErrorBoundary from './components/ContractErrorBoundary';
import ContractGuardWrapper from './components/ContractGuardWrapper';

// Styles
import '@rainbow-me/rainbowkit/styles.css';
import './App.css';

// Configure chains
const chains = [baseSepolia, base, hardhat];

const config = getDefaultConfig({
  appName: 'Rot & Ritual',
  projectId: import.meta.env.VITE_WALLETCONNECT_ID || 'e6e4d4c2f3f4e5b6a7c8d9e0f1a2b3c4', // Better placeholder
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
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="app">
                <Navbar />
                <main className="main-content">
                  <Routes>
                    {/* Admin route - bypasses ContractGuardWrapper for independent operation */}
                    <Route path="/admin" element={<Admin />} />
                    
                    {/* All other routes - wrapped in ContractGuardWrapper */}
                    <Route path="/*" element={
                      <ContractGuardWrapper>
                        <Routes>
                          <Route path="/" element={<Rituals />} />
                          <Route path="/crypt" element={<Rituals />} />
                          <Route path="/maw" element={<MawHeroStyled />} />
                          <Route path="/maw-desktop" element={<MawHeroStyled />} />
                          <Route path="/maw-mobile" element={<MawHeroStyled />} />
                          {/* <Route path="/maw-hero" element={<MawHero />} /> */}
                          <Route path="/maw-styled" element={<MawHeroStyled />} />
                          <Route path="/maw-responsive" element={<MawResponsive />} />
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
                      </ContractGuardWrapper>
                    } />
                  </Routes>
                </main>
                <Footer />
                
                {/* Auto-triggering Ritual Overlay for Demon Summons */}
                <AutoRitualOverlay />
                
                <Toaster
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1a1320',
                    color: '#d4c5db',
                    border: '2px solid #4a3958',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                    zIndex: 9999
                  },
                  success: {
                    style: {
                      background: 'linear-gradient(135deg, #065f46, #047857)',
                      color: '#ffffff',
                      border: '2px solid #10b981',
                      boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
                    },
                    duration: 5000
                  },
                  error: {
                    style: {
                      background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
                      color: '#ffffff',
                      border: '2px solid #ef4444',
                      boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
                    },
                    duration: 6000
                  }
                }}
                />
              </div>
            </Router>
          </ContractErrorBoundary>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;