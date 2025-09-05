import React from 'react'
export type Reward = { kind: 'COSMETIC'; typeId: bigint } | { kind: 'RELIC'; tokenId: bigint; amount: bigint } | { kind: 'UNKNOWN'; details?: any }
export function RewardModal({ open, onClose, rewards, txHash } : { open: boolean; onClose: () => void; rewards: Reward[] | null; txHash?: `0x${string}` | null }) {
  if (!open) return null
  return (<div style={styles.backdrop} onClick={onClose}>
    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
      <h3 style={{ marginTop: 0 }}>Sacrifice Results</h3>
      {txHash && <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.8 }}>tx: <code>{txHash}</code></div>}
      {!rewards?.length && <div>No on-chain reward logs detected.</div>}
      {rewards?.length ? (<ul style={{ margin: 0, paddingLeft: 18 }}>{rewards.map((r, i) => (<li key={i}>
        {r.kind === 'COSMETIC' && <>Cosmetic typeId: <b>{String(r.typeId)}</b></>}
        {r.kind === 'RELIC' && <>Relic tokenId: <b>{String(r.tokenId)}</b> × <b>{String(r.amount)}</b></>}
        {r.kind === 'UNKNOWN' && <>Unknown reward (check logs)</>}
      </li>))}</ul>) : null}
      <div style={{ textAlign: 'right', marginTop: 14 }}><button onClick={onClose} style={styles.btn}>Close</button></div>
    </div></div>)
}
const styles: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { width: 'min(520px, 92vw)', background: '#121212', color: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' },
  btn: { background: '#ff2d55', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }
}
