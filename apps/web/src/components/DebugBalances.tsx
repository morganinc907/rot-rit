import React from "react";
import { useChainId, useAccount, useReadContract } from "wagmi";
import { getRelicsAddress } from "../sdk/contracts";
import { TOKENS, TOKEN_LABELS } from "../sdk/tokens";
import { getABI, CONTRACT_NAMES } from "../utils/canonical-abis";

export function DebugBalances() {
  const { address } = useAccount();
  const chainId = useChainId();
  const relics = getRelicsAddress(chainId) as `0x${string}`;

  const ids = Object.values(TOKENS);
  // Also check Token ID 1 to debug confusion
  const allIds = [...ids, 1n];  
  const owners = address ? Array(allIds.length).fill(address) : [];

  const { data, error, isLoading, isSuccess } = useReadContract({
    address: relics,
    abi: getABI(CONTRACT_NAMES.RELICS),
    functionName: "balanceOfBatch",
    args: [owners, allIds],
    query: { enabled: !!address },
  });

  // Debug logging
  console.log("[DebugBalances] State:", { 
    address, chainId, relics, 
    owners: owners.length, 
    tokenIds: allIds.map(id => id.toString()), 
    officialIds: ids.map(id => id.toString()),
    data, error: error?.message, 
    isLoading, isSuccess 
  });

  return (
    <div style={{
      padding: 12, 
      border: "1px dashed #888", 
      marginTop: 12,
      backgroundColor: "rgba(0,0,0,0.1)",
      fontFamily: "monospace",
      fontSize: "12px"
    }}>
      <div style={{fontWeight: "bold", marginBottom: 8}}>🔍 Debug Balances</div>
      <div>Chain: {chainId}</div>
      <div>Account: {address}</div>
      <div>Relics: {relics}</div>
      <div>Status: {isLoading ? "Loading..." : isSuccess ? "Success" : "Error"}</div>
      {error && <div style={{color: "red"}}>Error: {error.message}</div>}
      <div style={{marginTop: 8}}>
        <div style={{fontWeight: "bold"}}>Token Balances:</div>
        {Array.isArray(data) ? (
          <ul style={{margin: "4px 0", paddingLeft: 16}}>
            {allIds.map((id, i) => {
              const balance = BigInt(data[i] as any);
              const label = TOKEN_LABELS[id] || `Token ${id}`;
              const isOfficialToken = ids.includes(id);
              return (
                <li key={String(id)} style={{
                  color: balance > 0n ? "green" : "#666",
                  fontWeight: balance > 0n ? "bold" : "normal",
                  backgroundColor: id === 1n && balance > 0n ? "rgba(255,255,0,0.2)" : "transparent"
                }}>
                  {label} (ID {id.toString()}): {balance.toString()}
                  {id === TOKENS.RUSTED_CAP && balance > 0n && " ← FOR SACRIFICE"}
                  {id === 1n && balance > 0n && " ⚠️ OLD TOKEN - NOT USED BY NEW SYSTEM"}
                  {!isOfficialToken && " [DEBUG ONLY]"}
                </li>
              );
            })}
          </ul>
        ) : (
          <div style={{color: "#666"}}>Loading...</div>
        )}
      </div>
      <div style={{marginTop: 8, padding: 4, backgroundColor: "rgba(255,255,0,0.1)"}}>
        <div style={{fontSize: "10px", fontWeight: "bold"}}>Token ID 0 (Rusted Caps) is what you sacrifice</div>
        <div style={{fontSize: "10px"}}>Convert 5 Glass Shards → 1 Rusted Cap</div>
      </div>
    </div>
  );
}