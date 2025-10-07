import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Ritual Chamber', shortLabel: 'Rituals' },
    { path: '/mint', label: 'Mint Raccoons', shortLabel: 'Mint' },
    { path: '/maw', label: 'The Maw', shortLabel: 'Maw' },
    { path: '/store', label: 'Cap Shop', shortLabel: 'Shop' }
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <span className="logo-text">
            <span className="logo-word">Rot</span>
            <span className="logo-ampersand">&</span>
            <span className="logo-word">Ritual</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="nav-links desktop-nav">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-label">{item.label}</span>
              {location.pathname === item.path && (
                <motion.div 
                  className="nav-indicator"
                  layoutId="navbar-indicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Hamburger Button */}
        <div className="hamburger-container">
          <button 
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <div className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></div>
            <div className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></div>
            <div className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></div>
          </button>
          <span className="hamburger-label">MENU</span>
        </div>

        {/* Wallet Connection */}
        <div className="nav-wallet">
          <ConnectButton 
            showBalance={false}
            chainStatus="icon"
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <motion.div 
          className="mobile-menu-overlay"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mobile-menu">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      <style>{`
        @font-face {
          font-family: 'Kings Cross';
          src: url('/fonts/KingsCross.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }

        @font-face {
          font-family: 'Gothic Pixel';
          src: url('/fonts/gothic_pixel.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }

        .navbar {
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 2px solid #4a3958;
          padding: 0;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
        }

        .nav-logo {
          font-family: 'Kings Cross', sans-serif !important;
          font-size: 36px;
          font-weight: 400;
          color: #8a2be2;
          text-shadow: 0 0 15px rgba(138, 43, 226, 0.6), 0 0 30px rgba(255, 0, 255, 0.3);
          letter-spacing: 2px;
          text-decoration: none;
          position: relative;
          transition: all 0.3s ease;
        }

        .nav-logo:hover {
          text-shadow: 0 0 20px rgba(138, 43, 226, 0.8), 0 0 40px rgba(255, 0, 255, 0.5);
          transform: scale(1.02);
        }

        .logo-text {
          font-family: 'Kings Cross', sans-serif !important;
          display: flex;
          align-items: center;
          gap: 0;
        }

        .logo-word {
          font-family: 'Kings Cross', sans-serif !important;
          background: linear-gradient(45deg, #8a2be2, #ff00ff, #8a2be2);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 3s ease-in-out infinite;
        }

        .logo-ampersand {
          font-family: 'Kings Cross', sans-serif !important;
          font-size: 46px;
          margin: 0 -4px;
          background: linear-gradient(45deg, #ff00ff, #8a2be2, #ff00ff);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 3s ease-in-out infinite;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .nav-links {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          color: #a89bb0;
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.2s;
          position: relative;
          font-family: 'Gothic Pixel', monospace;
          font-size: 16px;
          font-weight: normal;
          text-transform: uppercase;
          letter-spacing: 1px;
          image-rendering: pixelated;
          -webkit-font-smoothing: none;
          font-smooth: never;
        }

        .nav-link:hover {
          color: #d4c5db;
          background: rgba(74, 57, 88, 0.3);
        }

        .nav-link.active {
          color: #fff;
          background: rgba(138, 43, 226, 0.2);
        }

        .hamburger-container {
          display: none;
          align-items: center;
          gap: 8px;
        }

        .hamburger-btn {
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }

        .hamburger-label {
          font-family: 'Gothic Pixel', monospace;
          color: #a89bb0;
          font-size: 16px;
          font-weight: normal;
          text-transform: uppercase;
          letter-spacing: 1px;
          image-rendering: pixelated;
          -webkit-font-smoothing: none;
          font-smooth: never;
        }

        .hamburger-line {
          width: 100%;
          height: 2px;
          background: #a89bb0;
          margin: 2px 0;
          transition: all 0.3s ease;
          border-radius: 1px;
        }

        .hamburger-line.open:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .hamburger-line.open:nth-child(2) {
          opacity: 0;
        }

        .hamburger-line.open:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }

        .mobile-menu-overlay {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(10, 10, 10, 0.98);
          backdrop-filter: blur(10px);
          border-bottom: 2px solid #4a3958;
          z-index: 999;
        }

        .mobile-menu {
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mobile-nav-link {
          font-family: 'Gothic Pixel', monospace;
          color: #a89bb0;
          text-decoration: none;
          padding: 12px 16px;
          border-radius: 6px;
          transition: all 0.2s;
          font-size: 16px;
          font-weight: normal;
          text-transform: uppercase;
          letter-spacing: 1px;
          image-rendering: pixelated;
          -webkit-font-smoothing: none;
          font-smooth: never;
        }

        .mobile-nav-link:hover {
          color: #d4c5db;
          background: rgba(74, 57, 88, 0.3);
        }

        .mobile-nav-link.active {
          color: #fff;
          background: rgba(138, 43, 226, 0.2);
        }

        .nav-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #8a2be2, #ff00ff);
          border-radius: 1px;
        }

        .nav-wallet {
          display: flex;
          align-items: center;
        }

        @media (max-width: 768px) {
          .desktop-nav {
            display: none;
          }
          
          .hamburger-container {
            display: flex;
          }
          
          .nav-container {
            padding: 12px 20px;
          }
        }
      `}</style>
    </nav>
  );
}