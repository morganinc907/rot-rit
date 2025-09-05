import React, { useEffect, useMemo, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { createCosmeticsReader, createAggregatorReader } from '../lib/typedClient'
import { useMawSacrifice } from '../hooks/useMawSacrifice'
import { RewardModal } from '../components/RewardModal'

const SLOT_NAMES = ['Head', 'Face', 'Body', 'Color', 'Background']

export default function MawPage({ baseUrl, user, relicIds = [1,2,3,4,5,8] }: { baseUrl: string; user: `0x${string}`; relicIds?: number[] }) {
  const client = usePublicClient()
  const [raccoonIds, setRaccoonIds] = useState<bigint[]>([1n])
  const [equip, setEquip] = useState<Record<string, { bounds: bigint[]; bases: bigint[]; idx: bigint[] }>>({})
  const [relicBalances, setRelicBalances] = useState<Record<number, bigint>>({})

  const { ready, isLoading, error, lastTxHash, rewards, sacrificeForCosmetic, reset } = useMawSacrifice({ baseUrl, chainId: client?.chain?.id })
  const [rewardOpen, setRewardOpen] = useState(false)
  const bgUrl = useMemo(() => '/images/maw-bg.jpg', [])

  useEffect(() => {
    if (!client) return
    ;(async () => {
      const cosmetics = await createCosmeticsReader({ client, chainId: client.chain?.id, baseUrl })
      const agg = await createAggregatorReader({ client, chainId: client.chain?.id, baseUrl })
      const nextEquip: Record<string, any> = {}; for (const id of raccoonIds) nextEquip[String(id)] = await cosmetics.getEquippedPacked(id); setEquip(nextEquip)
      const { balances } = await agg.batchEverythingPacked(user, raccoonIds, relicIds.map(BigInt))
      const rb: Record<number, bigint> = {}; relicIds.forEach((rid, i) => rb[rid] = balances[i]); setRelicBalances(rb)
    })().catch(console.error)
  }, [client, baseUrl, user, JSON.stringify(raccoonIds), JSON.stringify(relicIds)])

  useEffect(() => { if (rewards) setRewardOpen(true) }, [rewards])
  const onFinalSacrifice = async () => { try { await sacrificeForCosmetic(2n, 1n) } catch (e) { console.error(e) } }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', background: `center/cover no-repeat url(${bgUrl})` }}>
      <aside style={styles.leftRail}>
        <h3 style={styles.railTitle}>Cosmetics</h3>
        {SLOT_NAMES.map((name) => (<div key={name} style={styles.slotItem}><span>{name}</span></div>))}
      </aside>
      <footer style={styles.bottomRail}>
        {relicIds.map((rid) => (<div key={rid} style={styles.relicPill}><div>Relic #{rid}</div><div style={{ fontWeight: 600 }}>{String(relicBalances[rid] ?? 0n)}</div></div>))}
        <button style={styles.sacBtn} disabled={!ready || isLoading} onClick={onFinalSacrifice}>{isLoading ? 'Sacrificing…' : 'Final Sacrifice'}</button>
        {error && <div style={{ color: '#ff9aa2', marginLeft: 12, fontSize: 12 }}>{error}</div>}
      </footer>
      <main style={styles.center}>
        <div style={styles.card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Raccoon #{String(raccoonIds[0])}</div>
          <pre style={styles.pre}>{equip[String(raccoonIds[0])] ? JSON.stringify(equip[String(raccoonIds[0])], null, 2) : 'Loading...'}</pre>
        </div>
      </main>
      <RewardModal open={rewardOpen} onClose={() => { setRewardOpen(false); reset(); }} rewards={rewards as any} txHash={lastTxHash as any} />
    </div>
  )
}
const styles: Record<string, React.CSSProperties> = {
  leftRail: { position: 'fixed', left: 8, top: 8, bottom: 80, width: 280, backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: 12, color: '#fff', overflowY: 'auto' },
  railTitle: { margin: '4px 0 12px 0', opacity: 0.9 },
  slotItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', marginBottom: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 10 },
  bottomRail: { position: 'fixed', left: 8, right: 8, bottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: 10, color: '#fff' },
  relicPill: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.10)' },
  sacBtn: { marginLeft: 'auto', padding: '10px 14px', borderRadius: 10, background: '#ff2d55', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  card: { marginTop: 40, marginLeft: 320, marginRight: 20, width: 'min(720px, 90vw)', background: 'rgba(0,0,0,0.35)', color: '#fff', borderRadius: 16, padding: 16, backdropFilter: 'blur(4px)' },
  pre: { whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.3 }
}
