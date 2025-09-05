import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { usePublicClient, useWatchContractEvent, useChainId } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import CodexEvent from "../components/CodexEvent";
import { getMawAddress, getCosmeticsAddress } from "../sdk/addresses";

// —— Minimal ABIs: events only (adjust if your contract names differ)
const RITUALS_ABI = [
  // event AttemptedAscension(uint256 indexed raccoonId, address indexed owner, bool success, uint8 demonTier, uint256[] relicIds, uint256[] relicAmts);
  {
    type: "event",
    name: "AttemptedAscension",
    inputs: [
      { indexed: true,  name: "raccoonId", type: "uint256" },
      { indexed: true,  name: "owner",     type: "address" },
      { indexed: false, name: "success",   type: "bool"    },
      { indexed: false, name: "demonTier", type: "uint8"   },
      { indexed: false, name: "relicIds",  type: "uint256[]" },
      { indexed: false, name: "relicAmts", type: "uint256[]" }
    ]
  },
  // event JoinedCult(uint256 indexed raccoonId, address indexed owner);
  {
    type: "event",
    name: "JoinedCult",
    inputs: [
      { indexed: true,  name: "raccoonId", type: "uint256" },
      { indexed: true,  name: "owner",     type: "address" }
    ]
  }
];

const MAW_ABI = [
  // event Sacrificed(address indexed caller, uint8[] tokenTypes, uint256[] tokenIds, uint256[] amounts);
  {
    type: "event",
    name: "Sacrificed",
    inputs: [
      { indexed: true,  name: "caller",     type: "address" },
      { indexed: false, name: "tokenTypes", type: "uint8[]" },
      { indexed: false, name: "tokenIds",   type: "uint256[]" },
      { indexed: false, name: "amounts",    type: "uint256[]" }
    ]
  },
  // event WheelSpun(address indexed caller, uint256 rewardId);
  {
    type: "event",
    name: "WheelSpun",
    inputs: [
      { indexed: true,  name: "caller",   type: "address" },
      { indexed: false, name: "rewardId", type: "uint256" }
    ]
  }
];

const COSMETICS_V2_ABI = [
  // event CosmeticEquipped(address indexed user, uint256 indexed raccoonId, uint256 cosmeticId, uint8 slot, uint8 rarity);
  {
    type: "event",
    name: "CosmeticEquipped",
    inputs: [
      { indexed: true,  name: "user",       type: "address" },
      { indexed: true,  name: "raccoonId",  type: "uint256" },
      { indexed: false, name: "cosmeticId", type: "uint256" },
      { indexed: false, name: "slot",       type: "uint8" },
      { indexed: false, name: "rarity",     type: "uint8" }
    ]
  },
  // event CosmeticUnequipped(address indexed user, uint256 indexed raccoonId, uint256 cosmeticId, uint8 slot);
  {
    type: "event",
    name: "CosmeticUnequipped",
    inputs: [
      { indexed: true,  name: "user",       type: "address" },
      { indexed: true,  name: "raccoonId",  type: "uint256" },
      { indexed: false, name: "cosmeticId", type: "uint256" },
      { indexed: false, name: "slot",       type: "uint8" }
    ]
  },
  // event OutfitBound(address indexed user, uint256 indexed raccoonId, uint256[] cosmeticIds);
  {
    type: "event",
    name: "OutfitBound",
    inputs: [
      { indexed: true,  name: "user",        type: "address" },
      { indexed: true,  name: "raccoonId",   type: "uint256" },
      { indexed: false, name: "cosmeticIds", type: "uint256[]" }
    ]
  }
];

// —— Small helpers
const short = (addr) => addr ? addr.slice(0,6) + "…" + addr.slice(-4) : "";
const prettyTier = (t) => (t === 0 ? "—" : (t === 1 ? "Common" : (t === 2 ? "Rare" : "Mythic")));
const asNum = (v) => (typeof v === "bigint" ? Number(v) : v);

export default function CodexEnhanced() {
  const client = usePublicClient();
  const chainId = useChainId();
  const RITUALS_ADDRESS = getMawAddress(chainId); // Rituals and Maw are the same contract
  const MAW_ADDRESS = getMawAddress(chainId);
  const COSMETICS_V2_ADDRESS = getCosmeticsAddress(chainId);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Filter chips state
  const [kindFilters, setKindFilters] = useState({
    join: true,
    ascend: true,
    sacrifice: true,
    wheel: true,
    equip: true,
    unequip: true,
    outfit: true,
    demon_summoned: true,
    relic_reward: true,
    cosmetic_reward: true,
  });
  const [resultFilters, setResultFilters] = useState({
    success: true,
    fail: true,
  });

  const toggleKind = (k) => setKindFilters(f => ({ ...f, [k]: !f[k] }));
  const toggleResult = (r) => setResultFilters(f => ({ ...f, [r]: !f[r] }));

  // Subscribe live
  useWatchContractEvent({
    address: RITUALS_ADDRESS,
    abi: RITUALS_ABI,
    eventName: "JoinedCult",
    onLogs: (logs) => {
      const mapped = logs.map((l) => ({
        kind: "join",
        time: Date.now(),
        tx: l.transactionHash,
        owner: l.args.owner,
        raccoonId: asNum(l.args.raccoonId),
      }));
      setItems((prev) => [...mapped, ...prev].slice(0, 300));
    }
  });

  useWatchContractEvent({
    address: RITUALS_ADDRESS,
    abi: RITUALS_ABI,
    eventName: "AttemptedAscension",
    onLogs: (logs) => {
      const mapped = logs.map((l) => ({
        kind: "ascend",
        time: Date.now(),
        tx: l.transactionHash,
        owner: l.args.owner,
        raccoonId: asNum(l.args.raccoonId),
        success: l.args.success,
        demonTier: asNum(l.args.demonTier),
        relicIds: (l.args.relicIds || []).map(asNum),
        relicAmts: (l.args.relicAmts || []).map(asNum),
      }));
      setItems((prev) => [...mapped, ...prev].slice(0, 300));
    }
  });

  useWatchContractEvent({
    address: MAW_ADDRESS,
    abi: MAW_ABI,
    eventName: "Sacrificed",
    onLogs: (logs) => {
      const mapped = logs.map((l) => ({
        kind: "sacrifice",
        time: Date.now(),
        tx: l.transactionHash,
        owner: l.args.caller,
        tokenTypes: (l.args.tokenTypes || []).map(asNum),
        tokenIds: (l.args.tokenIds || []).map(asNum),
        amounts: (l.args.amounts || []).map(asNum),
      }));
      setItems((prev) => [...mapped, ...prev].slice(0, 300));
    }
  });

  useWatchContractEvent({
    address: MAW_ADDRESS,
    abi: MAW_ABI,
    eventName: "WheelSpun",
    onLogs: (logs) => {
      const mapped = logs.map((l) => ({
        kind: "wheel",
        time: Date.now(),
        tx: l.transactionHash,
        owner: l.args.caller,
        rewardId: asNum(l.args.rewardId),
      }));
      setItems((prev) => [...mapped, ...prev].slice(0, 300));
    }
  });

  // Cosmetic Events
  useWatchContractEvent({
    address: COSMETICS_V2_ADDRESS,
    abi: COSMETICS_V2_ABI,
    eventName: "CosmeticEquipped",
    onLogs: (logs) => {
      const mapped = logs.map((l) => ({
        kind: "equip",
        time: Date.now(),
        tx: l.transactionHash,
        owner: l.args.user,
        data: {
          raccoonId: asNum(l.args.raccoonId),
          cosmeticId: asNum(l.args.cosmeticId),
          slot: asNum(l.args.slot),
          rarity: asNum(l.args.rarity),
        }
      }));
      setItems((prev) => [...mapped, ...prev].slice(0, 300));
    }
  });

  useWatchContractEvent({
    address: COSMETICS_V2_ADDRESS,
    abi: COSMETICS_V2_ABI,
    eventName: "CosmeticUnequipped",
    onLogs: (logs) => {
      const mapped = logs.map((l) => ({
        kind: "unequip",
        time: Date.now(),
        tx: l.transactionHash,
        owner: l.args.user,
        data: {
          raccoonId: asNum(l.args.raccoonId),
          cosmeticId: asNum(l.args.cosmeticId),
          slot: asNum(l.args.slot),
        }
      }));
      setItems((prev) => [...mapped, ...prev].slice(0, 300));
    }
  });

  useWatchContractEvent({
    address: COSMETICS_V2_ADDRESS,
    abi: COSMETICS_V2_ABI,
    eventName: "OutfitBound",
    onLogs: (logs) => {
      const mapped = logs.map((l) => ({
        kind: "outfit",
        time: Date.now(),
        tx: l.transactionHash,
        owner: l.args.user,
        data: {
          raccoonId: asNum(l.args.raccoonId),
          cosmeticIds: (l.args.cosmeticIds || []).map(asNum),
        }
      }));
      setItems((prev) => [...mapped, ...prev].slice(0, 300));
    }
  });

  // Initial backfill: pull ~10k blocks history per contract (adjust window as needed)
  useEffect(() => {
    // Mock data for preview without contracts
    if (RITUALS_ADDRESS === "0xYourRitualsAddress") {
      setLoading(false);
      setItems([
        {kind: "join", time: Date.now() - 300000, tx: "0x123", owner: "0x1234567890123456789012345678901234567890", raccoonId: 1, blockNumber: 12345},
        {kind: "ascend", time: Date.now() - 600000, tx: "0x456", owner: "0x2345678901234567890123456789012345678901", raccoonId: 2, success: true, demonTier: 2, relicIds: [1,8], relicAmts: [2,1], blockNumber: 12344},
        {kind: "sacrifice", time: Date.now() - 900000, tx: "0x789", owner: "0x3456789012345678901234567890123456789012", tokenTypes: [0,2], tokenIds: [3,1], amounts: [1,3], blockNumber: 12343},
        {kind: "wheel", time: Date.now() - 1200000, tx: "0xabc", owner: "0x4567890123456789012345678901234567890123", rewardId: 42, blockNumber: 12342},
        {kind: "equip", time: Date.now() - 150000, tx: "0xdef", owner: "0x5678901234567890123456789012345678901234", data: {raccoonId: 3, cosmeticId: 15, slot: 1, rarity: 3}, blockNumber: 12346},
        {kind: "outfit", time: Date.now() - 450000, tx: "0xghi", owner: "0x6789012345678901234567890123456789012345", data: {raccoonId: 4, cosmeticIds: [12, 8, 21, 5, 18]}, blockNumber: 12345}
      ]);
      return;
    }
    
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const latest = await client.getBlockNumber();
        const window = 10_000n;
        const fromBlock = latest > window ? latest - window : 0n;
        const toBlock = latest;

        const [ascLogs, joinLogs, sacLogs, spinLogs, equipLogs, unequipLogs, outfitLogs] = await Promise.all([
          client.getLogs({ address: RITUALS_ADDRESS, abi: RITUALS_ABI, eventName: "AttemptedAscension", fromBlock, toBlock }),
          client.getLogs({ address: RITUALS_ADDRESS, abi: RITUALS_ABI, eventName: "JoinedCult",        fromBlock, toBlock }),
          client.getLogs({ address: MAW_ADDRESS,     abi: MAW_ABI,     eventName: "Sacrificed",        fromBlock, toBlock }),
          client.getLogs({ address: MAW_ADDRESS,     abi: MAW_ABI,     eventName: "WheelSpun",         fromBlock, toBlock }),
          client.getLogs({ address: COSMETICS_V2_ADDRESS, abi: COSMETICS_V2_ABI, eventName: "CosmeticEquipped", fromBlock, toBlock }).catch(() => []),
          client.getLogs({ address: COSMETICS_V2_ADDRESS, abi: COSMETICS_V2_ABI, eventName: "CosmeticUnequipped", fromBlock, toBlock }).catch(() => []),
          client.getLogs({ address: COSMETICS_V2_ADDRESS, abi: COSMETICS_V2_ABI, eventName: "OutfitBound", fromBlock, toBlock }).catch(() => []),
        ]);

        const mapped = [
          ...ascLogs.map((l) => ({
            kind: "ascend",
            time: Number(l.blockNumber) * 1000,
            tx: l.transactionHash,
            owner: l.args.owner,
            raccoonId: asNum(l.args.raccoonId),
            success: l.args.success,
            demonTier: asNum(l.args.demonTier),
            relicIds: (l.args.relicIds || []).map(asNum),
            relicAmts: (l.args.relicAmts || []).map(asNum),
            blockNumber: Number(l.blockNumber),
          })),
          ...joinLogs.map((l) => ({
            kind: "join",
            time: Number(l.blockNumber) * 1000,
            tx: l.transactionHash,
            owner: l.args.owner,
            raccoonId: asNum(l.args.raccoonId),
            blockNumber: Number(l.blockNumber),
          })),
          ...sacLogs.map((l) => ({
            kind: "sacrifice",
            time: Number(l.blockNumber) * 1000,
            tx: l.transactionHash,
            owner: l.args.caller,
            tokenTypes: (l.args.tokenTypes || []).map(asNum),
            tokenIds: (l.args.tokenIds || []).map(asNum),
            amounts: (l.args.amounts || []).map(asNum),
            blockNumber: Number(l.blockNumber),
          })),
          ...spinLogs.map((l) => ({
            kind: "wheel",
            time: Number(l.blockNumber) * 1000,
            tx: l.transactionHash,
            owner: l.args.caller,
            rewardId: asNum(l.args.rewardId),
            blockNumber: Number(l.blockNumber),
          })),
          ...equipLogs.map((l) => ({
            kind: "equip",
            time: Number(l.blockNumber) * 1000,
            tx: l.transactionHash,
            owner: l.args.user,
            data: {
              raccoonId: asNum(l.args.raccoonId),
              cosmeticId: asNum(l.args.cosmeticId),
              slot: asNum(l.args.slot),
              rarity: asNum(l.args.rarity),
            },
            blockNumber: Number(l.blockNumber),
          })),
          ...unequipLogs.map((l) => ({
            kind: "unequip",
            time: Number(l.blockNumber) * 1000,
            tx: l.transactionHash,
            owner: l.args.user,
            data: {
              raccoonId: asNum(l.args.raccoonId),
              cosmeticId: asNum(l.args.cosmeticId),
              slot: asNum(l.args.slot),
            },
            blockNumber: Number(l.blockNumber),
          })),
          ...outfitLogs.map((l) => ({
            kind: "outfit",
            time: Number(l.blockNumber) * 1000,
            tx: l.transactionHash,
            owner: l.args.user,
            data: {
              raccoonId: asNum(l.args.raccoonId),
              cosmeticIds: (l.args.cosmeticIds || []).map(asNum),
            },
            blockNumber: Number(l.blockNumber),
          })),
        ];

        // sort newest first
        mapped.sort((a,b) => (b.blockNumber ?? 0) - (a.blockNumber ?? 0));

        if (mounted) setItems(mapped.slice(0, 500));
      } catch (err) {
        console.error("Codex backfill failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [client]);

  // —— Filtered list (search + chips)
  const filtered = useMemo(() => {
    let base = items;

    // Kind chips
    base = base.filter(it => kindFilters[it.kind]);

    // Result chips (only apply to 'ascend' kinds)
    base = base.filter(it => {
      if (it.kind !== "ascend") return true;
      if (it.success && !resultFilters.success) return true === false;
      if (!it.success && !resultFilters.fail) return true === false;
      return true;
    });

    // Search query
    if (!query) return base;
    const q = query.toLowerCase().trim();
    return base.filter((it) => {
      const owner = (it.owner || "").toLowerCase();
      const raccoonId = it.raccoonId ? String(it.raccoonId) : "";
      const kind = (it.kind || "").toLowerCase();
      const reward = it.rewardId ? String(it.rewardId) : "";
      const relics = (it.relicIds || []).join(",");

      return (
        owner.includes(q) ||
        raccoonId.includes(q) ||
        kind.includes(q) ||
        reward.includes(q) ||
        relics.includes(q)
      );
    });
  }, [items, query, kindFilters, resultFilters]);

  const Chip = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border mr-2 mb-2 transition-all duration-200 hover:scale-105 ${
        active 
          ? "bg-gradient-to-r from-amber-600 to-orange-600 border-amber-500 text-white shadow-lg shadow-amber-500/25" 
          : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-700/50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-gray-200 p-6 relative overflow-hidden">
      {/* Grimoire Background Effects */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
            📜 The Codex Mysticum
          </h1>
          <p className="text-lg opacity-75 max-w-2xl mx-auto">
            A living grimoire recording every ritual, sacrifice, and arcane transformation across the realm.
            <span className="block text-sm mt-2 text-amber-400">✨ Updated in real-time as cultists perform their dark arts ✨</span>
          </p>
        </motion.div>

        {/* Search + Filters */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="max-w-lg mx-auto mb-4">
            <input
              type="text"
              placeholder="Search by wallet, raccoon ID, action, reward, or relic…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-y-1 mb-2">
            <Chip active={kindFilters.join} onClick={() => toggleKind("join")}>🕯️ Join</Chip>
            <Chip active={kindFilters.ascend} onClick={() => toggleKind("ascend")}>🔥 Ascend</Chip>
            <Chip active={kindFilters.sacrifice} onClick={() => toggleKind("sacrifice")}>🩸 Sacrifice</Chip>
            <Chip active={kindFilters.wheel} onClick={() => toggleKind("wheel")}>🎡 Wheel</Chip>
            <Chip active={kindFilters.equip} onClick={() => toggleKind("equip")}>✨ Equip</Chip>
            <Chip active={kindFilters.unequip} onClick={() => toggleKind("unequip")}>⚡ Unequip</Chip>
            <Chip active={kindFilters.outfit} onClick={() => toggleKind("outfit")}>🎭 Outfit</Chip>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-y-1 mb-8">
            <Chip active={resultFilters.success} onClick={() => toggleResult("success")}>✅ Success</Chip>
            <Chip active={resultFilters.fail} onClick={() => toggleResult("fail")}>❌ Fail</Chip>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center opacity-70 py-12"
              >
                <div className="text-6xl mb-4">📜</div>
                <p className="text-lg">The codex awaits your first ritual...</p>
              </motion.div>
            )}
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="text-4xl mb-4 animate-spin">🔮</div>
                <p>Scrying the blockchain for ancient rituals...</p>
              </motion.div>
            )}
            
            <div className="space-y-4">
              {filtered.map((event, index) => (
                <CodexEvent
                  key={`${event.tx}-${event.kind}-${index}`}
                  event={event}
                  index={index}
                />
              ))}
            </div>
          </AnimatePresence>
        </div>
      </div>

      <style jsx>{`
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        
        /* Grimoire scroll effect */
        body {
          background-image: radial-gradient(circle at 25% 25%, rgba(251, 191, 36, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
        }
      `}</style>
    </div>
  );
}