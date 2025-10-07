import React, { useMemo, useState } from 'react';
import './CosmeticsGrid.css';

/**
 * CosmeticsGrid
 * Props:
 *  - cosmetics: [{ id, name, image, slot, rarity }]
 *  - selectedSlot: 'HEAD' | 'FACE' | 'BODY' | 'FUR' | 'BACKGROUND' | null
 *  - equippedCosmetics: { HEAD?: cosmetic, FACE?: cosmetic, ... }
 *  - onCosmeticSelect(cosmetic)
 *  - onCosmeticHover(cosmetic | null)
 */
const SLOT_TO_NAME = ['HEAD', 'FACE', 'BODY', 'FUR', 'BACKGROUND'];

export default function CosmeticsGrid({
  cosmetics = [],
  selectedSlot = null,
  equippedCosmetics = {},
  onCosmeticSelect,
  onCosmeticHover,
}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('recent'); // 'recent' | 'name' | 'rarity'
  const [limit, setLimit] = useState(60);     // basic pagination

  const filtered = useMemo(() => {
    let list = cosmetics;
    if (selectedSlot != null) {
      const idx = SLOT_TO_NAME.indexOf(selectedSlot);
      if (idx >= 0) list = list.filter(c => c.slot === idx);
    }
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      list = list.filter(c =>
        String(c.id).includes(t) ||
        (c.name || '').toLowerCase().includes(t)
      );
    }
    switch (sort) {
      case 'name':
        list = [...list].sort((a,b) => (a.name||'').localeCompare(b.name||'')); break;
      case 'rarity':
        list = [...list].sort((a,b) => (rarityRank(a.rarity) - rarityRank(b.rarity)) || a.id - b.id); break;
      default:
        list = [...list].sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0) || b.id - a.id);
    }
    return list;
  }, [cosmetics, selectedSlot, q, sort]);

  const page = filtered.slice(0, limit);
  const hasMore = filtered.length > limit;

  return (
    <div className="cosmetics-grid-wrap">
      <div className="grid-toolbar">
        <input
          type="search"
          placeholder="Search name or #id…"
          value={q}
          onChange={(e)=> setQ(e.target.value)}
          onFocus={()=> onCosmeticHover?.(null)}
        />
        <select value={sort} onChange={(e)=> setSort(e.target.value)}>
          <option value="recent">Recent</option>
          <option value="name">Name</option>
          <option value="rarity">Rarity</option>
        </select>
        {/* Quick slot chips (optional helper, not affecting external selectedSlot) */}
        {SLOT_TO_NAME.map((s, i) => (
          <button
            key={s}
            type="button"
            className={`chip ${selectedSlot === s ? 'active' : ''}`}
            onClick={()=> {/* parent controls selectedSlot; leave as display-only */}}
            title={s}
          >{s[0]}</button>
        ))}
      </div>

      {page.length === 0 ? (
        <div className="empty-state">No cosmetics found.</div>
      ) : (
        <div className="cosmetics-grid">
          {page.map(c => {
            const equippedHere = equippedCosmetics[SLOT_TO_NAME[c.slot]]?.id === c.id;
            return (
              <div
                key={c.id}
                className="cos-card"
                onMouseEnter={()=> onCosmeticHover?.(c)}
                onMouseLeave={()=> onCosmeticHover?.(null)}
                onClick={()=> onCosmeticSelect?.(c)}
                role="button"
                tabIndex={0}
                onKeyDown={(e)=> (e.key === 'Enter' ? onCosmeticSelect?.(c) : null)}
                aria-label={`Cosmetic ${c.name || '#'+c.id}`}
              >
                <div className="cos-thumb">
                  <img loading="lazy" src={c.image} alt={c.name || `#${c.id}`} />
                </div>
                <div className="cos-meta">
                  <div className="cos-name">{c.name || `#${c.id}`}</div>
                  <div className="badges">
                    <span className={`badge rarity-${(c.rarity||'common').toLowerCase()}`}>{c.rarity || 'Common'}</span>
                    <span className="badge">{SLOT_TO_NAME[c.slot] || '?'}</span>
                  </div>
                </div>
                {equippedHere && <div className="selected-outline" />}
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <button className="load-more" onClick={()=> setLimit(l => l + 60)}>
          Load more ({filtered.length - page.length} more)
        </button>
      )}
    </div>
  );
}

function rarityRank(r) {
  switch ((r||'').toLowerCase()) {
    case 'legendary': return 1;
    case 'epic': return 2;
    case 'rare': return 3;
    default: return 4;
  }
}
