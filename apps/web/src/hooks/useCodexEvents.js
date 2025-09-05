// src/hooks/useCodexEvents.js
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

const WS_URL = import.meta.env.VITE_CODEX_WS || "ws://localhost:8080";

export default function useCodexEvents() {
  const ws = useRef(null);
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const reconnectRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const handleEvent = (data) => {
    setEvents((prev) => [data, ...prev].slice(0, 50)); // Keep last 50 events

    // High-value toast notifications
    switch (data.type || data.kind) {
      case "demon_summoned":
        toast.success(`🔥 A demon has been summoned by ${shortAddr(data.owner)}!`, {
          duration: 4000,
          style: {
            background: '#1a0000',
            color: '#ff006e',
            border: '1px solid #ff006e'
          }
        });
        break;
      case "sacrifice":
      case "raccoon_sacrifice_failed":
        if (!data.success) {
          toast.error(`⚠️ Sacrifice failed for ${shortAddr(data.owner)}`, {
            duration: 3000,
            style: {
              background: '#1a0000',
              color: '#ff4444',
              border: '1px solid #ff4444'
            }
          });
        }
        break;
      case "cosmetic_reward":
        toast.success(`✨ ${shortAddr(data.owner)} received a cosmetic!`, {
          duration: 3000,
          style: {
            background: '#0a001a',
            color: '#9147ff',
            border: '1px solid #9147ff'
          }
        });
        break;
      case "relic_reward":
        toast(`🪙 ${shortAddr(data.owner)} found a relic!`, {
          duration: 3000,
          style: {
            background: '#001a1a',
            color: '#00c2ff',
            border: '1px solid #00c2ff'
          }
        });
        break;
      case "equip":
      case "cosmetic_equipped":
        // Only show for high rarity items
        if (data.data?.rarity >= 3) {
          toast(`🎭 ${shortAddr(data.owner)} equipped epic cosmetic!`, {
            duration: 2000,
            style: {
              background: '#001a0a',
              color: '#36fba1',
              border: '1px solid #36fba1'
            }
          });
        }
        break;
      case "raccoon_minted":
        toast.success(`🦝 ${shortAddr(data.owner)} summoned Raccoon #${data.tokenId}!`, {
          duration: 3000,
          style: {
            background: '#0a1a0a',
            color: '#36fba1',
            border: '1px solid #36fba1'
          }
        });
        break;
      case "raccoon_transferred":
        // Only show transfers to avoid spam from mints
        if (!data.isMint) {
          toast(`🔄 Raccoon #${data.tokenId} found a new owner!`, {
            duration: 2000,
            style: {
              background: '#1a1a0a',
              color: '#fbbf24',
              border: '1px solid #fbbf24'
            }
          });
        }
        break;
      default:
        break;
    }
  };

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    
    console.log(`🔮 Connecting to Codex WebSocket: ${WS_URL}`);
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log("✅ Connected to Codex WebSocket");
      setConnected(true);
      reconnectAttempts.current = 0;
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      
      toast.success('🔮 Connected to ritual feed', {
        duration: 2000,
        style: {
          background: '#0a0a1a',
          color: '#36fba1',
          border: '1px solid #36fba1'
        }
      });
    };

    ws.current.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        
        // Handle different message types
        if (data.type === 'connection_success') {
          console.log('🎉 Codex connection established');
          return;
        }
        
        if (data.type === 'history' && data.events) {
          setEvents(prev => [...data.events, ...prev].slice(0, 50));
          return;
        }
        
        // Handle regular events
        handleEvent(data);
      } catch (e) {
        console.error("❌ Bad WebSocket message:", msg.data, e);
      }
    };

    ws.current.onclose = (event) => {
      console.warn("❌ Codex WebSocket disconnected:", event.code, event.reason);
      setConnected(false);
      
      // Auto-reconnect with exponential backoff
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
        
        reconnectRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      } else {
        toast.error('Lost connection to ritual feed', {
          duration: 5000,
          style: {
            background: '#1a0000',
            color: '#ff4444',
            border: '1px solid #ff4444'
          }
        });
      }
    };

    ws.current.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      setConnected(false);
    };
  };

  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
      if (ws.current) {
        ws.current.close(1000, 'Component unmounting');
      }
    };
  }, []);

  // Public methods
  const reconnect = () => {
    reconnectAttempts.current = 0;
    connect();
  };

  const disconnect = () => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
    }
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
    }
    setConnected(false);
  };

  return {
    events,
    connected,
    reconnect,
    disconnect,
    socket: ws.current // Expose WebSocket instance for ritual overlay
  };
}

// Helper: shorten wallet addresses for UI
const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'Unknown';