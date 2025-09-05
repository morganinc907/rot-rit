// Test component to verify the address guard system
import React from 'react';
import { useAddressSanityCheck, useMawAddress } from '../sdk/maw';
import { useMawDebugEvents } from '../sdk/debugEvents';

export function AddressTest() {
  const { mismatch, maw, relics, onChainMaw } = useAddressSanityCheck();
  const mawAddr = useMawAddress(); // This will log to console
  
  // Enable debug event monitoring
  useMawDebugEvents();
  
  if (mismatch) {
    return (
      <div style={{ padding: 16, background: '#ffebee', color: '#c62828', border: '2px solid #f44336' }}>
        <h3>⚠️ Config/Chain Mismatch Detected!</h3>
        <div><strong>Frontend Maw:</strong> {maw}</div>
        <div><strong>Relics.mawSacrifice():</strong> {String(onChainMaw)}</div>
        <p>The frontend configuration doesn't match what's on-chain. Please fix this before proceeding.</p>
      </div>
    );
  }
  
  return (
    <div style={{ padding: 16, background: '#e8f5e8', color: '#2e7d32', border: '2px solid #4caf50' }}>
      <h3>✅ Address System Status</h3>
      <div><strong>MawSacrifice Address:</strong> {mawAddr}</div>
      <div><strong>Relics Address:</strong> {relics}</div>
      <div><strong>On-Chain Maw:</strong> {String(onChainMaw)}</div>
      <p>✅ All address checks passed!</p>
      <p>🔍 Check browser console for address logs and debug events.</p>
    </div>
  );
}