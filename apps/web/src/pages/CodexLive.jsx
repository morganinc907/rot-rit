import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import useCodexEvents from "../hooks/useCodexEvents";
import CodexEvent from "../components/CodexEvent"; // ✅ Use full cards now
import "../styles/Codex.css";

export default function CodexLive() {
  const { events, connected, socket } = useCodexEvents();

  return (
    <div className="codex-container relative min-h-screen bg-black text-gray-200 overflow-hidden">
      {/* Cinematic Layered Background */}
      <div className="codex-background" />

      {/* Ritual Particle Layer */}
      <div className="codex-particles" />

      {/* Central Wrapper */}
      <div className="relative z-10 max-w-5xl mx-auto p-6">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <h1 className="codex-title text-6xl font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-red-500 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,180,100,0.6)]">
            The Living Codex
          </h1>
          <p className="text-gray-400 text-lg mt-3 max-w-xl mx-auto">
            A grimoire of rituals, sacrifices, and forbidden awakenings — recorded in real time.
          </p>

          {/* Connection Status */}
          <div className={`inline-flex items-center gap-2 px-5 py-2.5 mt-4 rounded-full border transition-all duration-500 ${connected 
            ? "bg-green-900/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            : "bg-red-900/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-sm font-medium tracking-wide">
              {connected ? "Connected to ritual feed" : "Scrying ritual network..."}
            </span>
          </div>
        </motion.div>

        {/* Ritual Feed */}
        <div className="space-y-4 relative z-20">
          <AnimatePresence mode="popLayout">
            {events.length === 0 && connected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 opacity-60"
              >
                <p className="text-2xl tracking-wider font-semibold">
                  The Codex awaits the first ritual...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Secrets will manifest here when the veil trembles.
                </p>
              </motion.div>
            )}

            {!connected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="codex-loader" />
                <p className="text-gray-400 mt-4">Divining the ritual stream...</p>
              </motion.div>
            )}

            {events.map((event, index) => (
              <CodexEvent
                key={`${event.tx}-${event.kind}-${event.time}-${index}`}
                event={event}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {events.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-14 text-sm text-gray-500"
          >
            Showing the last {events.length} ritual{events.length !== 1 ? "s" : ""}  
            <span className="block text-xs mt-1 opacity-70">Live updates • No refresh required</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}