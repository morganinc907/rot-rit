// Debug event monitoring for the new contract events
import { useWatchContractEvent, useChainId } from "wagmi";
import { getMawAddress } from "./addresses";

const debugAbi = [
  {
    name: 'DebugRevert',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'where', type: 'string', indexed: false },
      { name: 'data', type: 'bytes', indexed: false }
    ]
  },
  {
    name: 'DebugCaller',
    type: 'event', 
    anonymous: false,
    inputs: [
      { name: 'caller', type: 'address', indexed: false }
    ]
  }
] as const;

export function useMawDebugEvents() {
  const chainId = useChainId();
  const address = getMawAddress(chainId);
  
  useWatchContractEvent({
    address,
    abi: debugAbi,
    eventName: "DebugRevert",
    onLogs(logs) {
      for (const l of logs) {
        const [where, data] = l.args as [string, `0x${string}`];
        console.warn("🐛 Maw DebugRevert:", where, data);
        // Could also show a toast notification here
      }
    },
  });

  useWatchContractEvent({
    address,
    abi: debugAbi,
    eventName: "DebugCaller",
    onLogs(logs) {
      for (const l of logs) {
        const [caller] = l.args as [`0x${string}`];
        console.log("🔍 Maw DebugCaller:", caller);
      }
    },
  });
}