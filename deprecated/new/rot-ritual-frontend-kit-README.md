# Rot Ritual Frontend Kit

All-in-one helpers to wire your dapp UI to multiple contracts cleanly — with **runtime ABI/address loading**, **caching + retry**, **SSR-safety**, **typed readers**, and a **sacrifice flow** (wagmi write + reward modal).

## Quick Start

```bash
npm i wagmi viem
# copy ./src/* into your app
```

Render the example page:
```tsx
import MawPage from './src/pages/MawPage'

export default function App() {
  return (
    <MawPage
      baseUrl="https://<you>.github.io/<repo>"
      user="0xYourAddress"
      relicIds={[1,2,3,4,5,8]}
    />
  )
}
```

---

## Folder Map

```
src/
  lib/
    caching.ts            # memory + localStorage cache + retry + versioning
    ssr.ts                # SSR-safe guards for localStorage/fetch
    ritualContracts.ts    # fetchDeployments/fetch ABI + createRitualContract()
    addressRegistry.ts    # loadDeployments(), getAddress(), getAllAddresses()
    typedClient.ts        # small typed readers (CosmeticsV2, RitualReadAggregator)
  hooks/
    useMawSacrifice.ts    # wagmi write + receipt parsing for rewards
  components/
    RewardModal.tsx       # popup to show rewards
  pages/
    MawPage.tsx           # example UI wiring (background + rails + popup)
```

---

## Configure Sources for ABIs & Addresses

### Option A) GitHub Pages (runtime fetch)
Your CI publishes these to `https://<you>.github.io/<repo>/`:
- `deploy.output.json` (flat or per-chain map)
- `abis/*.abi.json` (one per contract)
- `index.json` with `{ "ts": <timestamp> }` to version-bust cache

### Option B) npm package (local import fallback)
Publish `@<scope>/abis` that contains the two files above. You can teach `createRitualContract()` to use `fallback: () => import('@<scope>/abis/...' )` for local bundling in CI or tests.

---

## Caching + Retry

- **Cache key** = URL + `version` (timestamp loaded from `index.json`)
- Defaults: **5 min TTL**, **2 retries** with jitter, **10s** request timeout
- Manual bust:
```ts
import { invalidateCache } from './lib/caching'
invalidateCache('rr')                               // clear all
invalidateCache('rr', '/deploy.output.json')        // target one URL family
```

---

## Contracts & Readers

Create a contract instance whenever you need it (auto-fetch ABI+address):
```ts
import { createRitualContract } from './lib/ritualContracts'
const maw = await createRitualContract({ name: 'MawSacrificeV2', client, chainId, baseUrl })
const res = await maw.read.someView([arg1, arg2])
```

Use the typed readers for common flows:
```ts
import { createCosmeticsReader, createAggregatorReader } from './lib/typedClient'

const cosmetics = await createCosmeticsReader({ client, chainId, baseUrl })
const eq = await cosmetics.getEquippedPacked(1n) // { bounds, bases, idx }

const agg = await createAggregatorReader({ client, chainId, baseUrl })
const { balances } = await agg.batchEverythingPacked('0xUser', [1n,2n], [1n,2n,3n])
```

### Address Registry Helpers
```ts
import { loadDeployments, getAddress, getAllAddresses } from './lib/addressRegistry'

const deployments = await loadDeployments({ baseUrl: 'https://<you>.github.io/<repo>' })
const maw = getAddress(deployments, 'MawSacrificeV2', 8453) // per-chain or flat map
```

**Per-chain example**
```json
{
  "8453": { "MawSacrificeV2": "0x...", "CosmeticsV2": "0x..." },
  "1":    { "MawSacrificeV2": "0x..." }
}
```
**Flat example**
```json
{ "MawSacrificeV2": "0x...", "CosmeticsV2": "0x..." }
```

---

## Sacrifice Flow (wagmi write + rewards)

Hook:
```ts
const { ready, isLoading, error, lastTxHash, rewards, sacrificeForCosmetic, reset } =
  useMawSacrifice({ baseUrl: 'https://<you>.github.io/<repo>', chainId: client?.chain?.id })

await sacrificeForCosmetic(2n, 1n) // rarity=2, count=1
// rewards => [{ kind: 'COSMETIC', typeId }, { kind: 'RELIC', tokenId, amount }, ...]
```

The hook:
- Calls `MawSacrificeV2.sacrificeForCosmetic(rarity, count)`
- Waits for the receipt with `publicClient.waitForTransactionReceipt`
- Parses **ERC1155 `TransferSingle`** logs to detect rewards from **CosmeticsV2** and **Relics** (to the user)

**Reward Modal**
```tsx
<RewardModal open={open} onClose={() => setOpen(false)} rewards={rewards} txHash={lastTxHash} />
```

> If your contracts emit a custom `SacrificeComplete(...)` event, add the event ABI and a decoder for richer UI. I can extend the hook to parse it.

---

## Example Page (Maw)

`src/pages/MawPage.tsx` shows:
- Big background image
- Left rail (cosmetic slots)
- Bottom rail (relic balances) + **Final Sacrifice** button
- Center card showing equipped data
- Reward popup when the tx confirms

It uses the typed readers + the sacrifice hook, and is SSR-safe.

---

## SSR / Next.js Notes

- All helpers use guards (`safeLocalStorage`, `isBrowser`)
- Do reads/writes inside `useEffect` or client components
- For server code paths, prefer `memoryOnly` caching or pass `fetchFn`

---

## Troubleshooting

- **“No address for X (chainId=Y)”**  
  Your `deploy.output.json` doesn’t include that mapping. Re-run CI or re-publish gh-pages.

- **Stale ABI/address**  
  Ensure `index.json` has a fresh timestamp. Or call `invalidateCache('rr')`.

- **Tx confirmed but no rewards**  
  Verify rewards are minted as ERC1155 to the **user** in the same tx (Cosmetics/Relics). If it’s a different event, add a decoder.

- **SSR crash referencing `window`**  
  Ensure you only call readers/hook in client-side contexts or guard with `isBrowser`.

---

## Extending Reward Decoders

If you have something like:
```solidity
event SacrificeComplete(address indexed user, uint8 rarity, uint256[] cosmeticTypeIds, uint256[] relicIds, uint256[] amounts);
```
Add the event ABI to the hook and parse it from the receipt (before/alongside ERC1155 logs) for exact results.

---

## Performance Tips

- **Batch reads** via Aggregator wherever possible
- **Cache** ABI/address + reader results (short TTL) to smooth UI
- Use **RetryOpts** for unreliable hosts (mobile networks)
- Coalesce state updates (compute offscreen then set state once)
- Lazy-load heavy images (background) with `loading="lazy"` or CSS

---

## Security / UX Best Practices

- Always show **chain + address** to the user on transaction screens
- Check **allowances/approvals** before writes; prompt with clear copy
- Post-receipt, **re-fetch** balances/equipped data to avoid UI drift
- Show **pending** UI with a cancel link to the explorer
- Use EIP-712 structured data for signatures (where applicable)

---

## TypeScript Hints

- Treat on-chain IDs as `bigint` end-to-end (no implicit `Number()`)
- Narrow return types in readers and keep decode ABI arrays in sync
- Consider `as const` for ABIs and event signatures to keep types tight

---

## Versioning & CI

- On **push to main**: publish `deploy.output.json`, `abis/*.abi.json`, and `index.json` to **gh-pages**.
- On **tagged release**: publish the same to **npm** for offline bundling.
- Bump the **timestamp** in `index.json` to invalidate caches automatically.

---

## What to Customize Next

- Add wallet-owned raccoon listing and selection
- Load cosmetic metadata for **item art** in `RewardModal`
- Implement **equip/unequip** UI with optimistic updates
- Add **sacrifice recipes** UI with validation (relic costs, rarity gating)
- Internationalize text and add accessibility (labels, focus states)

---

**Have other events or contracts to integrate?** Drop their ABIs and the runtime address map; we’ll add typed readers and decoders so everything is plug-and-play.
