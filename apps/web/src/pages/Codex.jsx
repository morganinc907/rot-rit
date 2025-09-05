import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { usePublicClient, useWatchContractEvent, useChainId } from "wagmi";
import { getMawAddress } from "../sdk/addresses";

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

// —— Small helpers
const short = (addr) => addr ? addr.slice(0,6) + "…" + addr.slice(-4) : "";
const prettyTier = (t) => (t === 0 ? "—" : (t === 1 ? "Common" : (t === 2 ? "Rare" : "Mythic")));
const asNum = (v) => (typeof v === "bigint" ? Number(v) : v);

export default function Codex() {
  const client = usePublicClient();
  const chainId = useChainId();
  const RITUALS_ADDRESS = getMawAddress(chainId); // Rituals and Maw are the same contract
  const MAW_ADDRESS = getMawAddress(chainId);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Filter chips state
  const [kindFilters, setKindFilters] = useState({
    join: true,
    ascend: true,
    sacrifice: true,
    wheel: true,
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

  // Initial backfill: pull ~10k blocks history per contract (adjust window as needed)
  useEffect(() => {
    // Mock data for preview without contracts
    if (RITUALS_ADDRESS === "0xYourRitualsAddress") {
      setLoading(false);
      setItems([
        {kind: "join", time: Date.now() - 300000, tx: "0x123", owner: "0x1234567890123456789012345678901234567890", raccoonId: 1, blockNumber: 12345},
        {kind: "ascend", time: Date.now() - 600000, tx: "0x456", owner: "0x2345678901234567890123456789012345678901", raccoonId: 2, success: true, demonTier: 2, relicIds: [1,8], relicAmts: [2,1], blockNumber: 12344},
        {kind: "sacrifice", time: Date.now() - 900000, tx: "0x789", owner: "0x3456789012345678901234567890123456789012", tokenTypes: [0,2], tokenIds: [3,1], amounts: [1,3], blockNumber: 12343},
        {kind: "wheel", time: Date.now() - 1200000, tx: "0xabc", owner: "0x4567890123456789012345678901234567890123", rewardId: 42, blockNumber: 12342}
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

        const [ascLogs, joinLogs, sacLogs, spinLogs] = await Promise.all([
          client.getLogs({ address: RITUALS_ADDRESS, abi: RITUALS_ABI, eventName: "AttemptedAscension", fromBlock, toBlock }),
          client.getLogs({ address: RITUALS_ADDRESS, abi: RITUALS_ABI, eventName: "JoinedCult",        fromBlock, toBlock }),
          client.getLogs({ address: MAW_ADDRESS,     abi: MAW_ABI,     eventName: "Sacrificed",        fromBlock, toBlock }),
          client.getLogs({ address: MAW_ADDRESS,     abi: MAW_ABI,     eventName: "WheelSpun",         fromBlock, toBlock }),
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
      className={`px-3 py-1 rounded-full text-xs border mr-2 mb-2 ${active ? "bg-red-600 border-red-500" : "bg-zinc-800 border-zinc-700"}`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-gray-200 p-6">
      <h1 className="text-4xl font-bold text-center mb-6">📜 Cult Codex — Live Activity</h1>
      <p className="text-center opacity-75 mb-6">
        Every offering, ascension, and spin — recorded for the faithful.
      </p>

      {/* Search + Filters */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="max-w-lg mx-auto mb-4">
          <input
            type="text"
            placeholder="Search by wallet, raccoon ID, action, reward, or relic…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-y-1 mb-2">
          <Chip active={kindFilters.join} onClick={() => toggleKind("join")}>Join</Chip>
          <Chip active={kindFilters.ascend} onClick={() => toggleKind("ascend")}>Ascend</Chip>
          <Chip active={kindFilters.sacrifice} onClick={() => toggleKind("sacrifice")}>Sacrifice</Chip>
          <Chip active={kindFilters.wheel} onClick={() => toggleKind("wheel")}>Wheel</Chip>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-y-1 mb-8">
          <Chip active={resultFilters.success} onClick={() => toggleResult("success")}>Success</Chip>
          <Chip active={resultFilters.fail} onClick={() => toggleResult("fail")}>Fail</Chip>
        </div>
      </div>

      {loading && <div className="text-center">Indexing recent rituals…</div>}

      <div className="max-w-5xl mx-auto grid gap-3">
        {filtered.length === 0 && !loading && (
          <div className="text-center opacity-70">No results found.</div>
        )}
        {filtered.map((it, idx) => (
          <div key={idx} className="grid grid-cols-[110px_1fr_140px] items-start gap-3 bg-zinc-900/60 rounded-lg p-3 border border-zinc-800">
            <div className="text-xs opacity-70">
              <div>{it.blockNumber ? `#${it.blockNumber}` : ""}</div>
              <div>{format(new Date(it.time), "MMM d, HH:mm")}</div>
            </div>
            <div className="text-sm">
              {it.kind === "join" && (
                <span>🕯️ <b>{short(it.owner)}</b> joined the cult with Raccoon <b>#{it.raccoonId}</b></span>
              )}
              {it.kind === "ascend" && (
                <span>
                  🔮 <b>{short(it.owner)}</b> attempted ascension for Raccoon <b>#{it.raccoonId}</b> —{" "}
                  {it.success ? <b className="text-green-400">SUCCESS</b> : <b className="text-red-400">FAIL</b>}
                  {it.success && <span> → Demon tier: <b>{prettyTier(it.demonTier)}</b></span>}
                  {(it.relicIds?.length) ? (
                    <span> · Relics: {it.relicIds.map((id, i) => `${id}×${it.relicAmts?.[i] ?? 1}`).join(", ")}</span>
                  ) : null}
                </span>
              )}
              {it.kind === "sacrifice" && (
                <span>
                  🩸 <b>{short(it.owner)}</b> sacrificed{" "}
                  {it.tokenIds?.length ? it.tokenIds.map((id, i) => `#${id}×${it.amounts?.[i] ?? 1}`).join(", ") : "offerings"}
                </span>
              )}
              {it.kind === "wheel" && (
                <span>🎡 <b>{short(it.owner)}</b> spun the Wheel of Maw → reward <b>ID {it.rewardId}</b></span>
              )}
            </div>
            <div className="text-right text-xs opacity-70 break-all">
              <a className="underline" href={`https://basescan.org/tx/${it.tx}`} target="_blank" rel="noreferrer">view tx</a>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      `}</style>
    </div>
  );
}
