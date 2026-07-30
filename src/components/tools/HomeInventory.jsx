import { useEffect, useState } from 'react'

const defaultRooms = [
  'Living Room',
  'Bedroom(s)',
  'Kitchen',
  'Garage / Storage',
  'Home Office',
]

const STORAGE_KEY = 'coverage-compass-home-inventory'

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function nextId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function HomeInventory() {
  const [openRoom, setOpenRoom] = useState(defaultRooms[0])
  const [items, setItems] = useState(loadItems)
  const [draft, setDraft] = useState({ name: '', value: '', date: '' })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage full or unavailable, the inventory still works for this
      // session, it just won't survive a reload.
    }
  }, [items])

  function addItem(room) {
    if (!draft.name.trim()) return
    setItems((prev) => ({
      ...prev,
      [room]: [
        ...(prev[room] || []),
        { id: nextId(), name: draft.name, value: Math.max(0, parseFloat(draft.value) || 0), date: draft.date },
      ],
    }))
    setDraft({ name: '', value: '', date: '' })
  }

  function removeItem(room, id) {
    setItems((prev) => ({
      ...prev,
      [room]: (prev[room] || []).filter((i) => i.id !== id),
    }))
  }

  const total = Object.values(items)
    .flat()
    .reduce((sum, i) => sum + i.value, 0)

  function downloadCsv() {
    const rows = [['Room', 'Item', 'Estimated Value', 'Purchase Date']]
    Object.entries(items).forEach(([room, roomItems]) => {
      roomItems.forEach((i) => rows.push([room, i.name, i.value, i.date || '']))
    })
    // A cell starting with =, +, -, or @ can be interpreted as a formula by
    // Excel/Sheets/LibreOffice on open (CSV formula injection). Item names
    // are free text, so prefix those with a leading apostrophe to force
    // spreadsheet apps to treat the cell as plain text.
    const csv = rows
      .map((r) =>
        r
          .map((c) => {
            const str = String(c)
            const safe = /^[=+\-@]/.test(str) ? `'${str}` : str
            return `"${safe.replace(/"/g, '""')}"`
          })
          .join(','),
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'home-inventory.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <h2 className="font-display text-lg font-semibold text-compass-heading">
        Home Inventory Checklist
      </h2>
      <p className="mt-1 text-sm text-compass-slate">
        Document what you own, room by room, so you're prepared if you ever need to
        file a claim.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {defaultRooms.map((room) => (
          <button
            key={room}
            onClick={() => {
              // Switching rooms without submitting used to leave the
              // in-progress draft attached to whichever room you add next,
              // silently filing an item under the wrong room.
              setOpenRoom(room)
              setDraft({ name: '', value: '', date: '' })
            }}
            aria-pressed={openRoom === room}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              openRoom === room
                ? 'bg-compass-blue text-white'
                : 'bg-compass-paper text-compass-slate hover:bg-compass-skyblue'
            }`}
          >
            {room}
            {items[room]?.length ? ` (${items[room].length})` : ''}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-compass-line p-4">
        <p className="mb-3 text-sm font-medium text-compass-ink">{openRoom}</p>

        <div className="space-y-2">
          {(items[openRoom] || []).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md bg-compass-paper px-3 py-2 text-sm"
            >
              <span className="text-compass-ink">{item.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-compass-slate">
                  ${Math.round(item.value).toLocaleString()}
                </span>
                <button
                  onClick={() => removeItem(openRoom, item.id)}
                  className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-compass-slate hover:text-compass-amber"
                  aria-label={`Remove ${item.name}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {!(items[openRoom] || []).length && (
            <p className="text-xs text-compass-slate">No items added yet.</p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
          <input
            type="text"
            aria-label="Item name"
            placeholder="Item name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="rounded-lg border border-compass-line px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            type="number"
            min="0"
            aria-label="Estimated value"
            placeholder="Estimated value"
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
            className="rounded-lg border border-compass-line px-3 py-2 text-sm"
          />
          <input
            type="date"
            aria-label="Purchase date"
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            className="rounded-lg border border-compass-line px-3 py-2 text-sm text-compass-slate"
          />
          <button
            onClick={() => addItem(openRoom)}
            disabled={!draft.name.trim()}
            title={!draft.name.trim() ? 'Enter an item name to add it' : undefined}
            className="btn-secondary justify-center disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Item
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-compass-ink">
          Total estimated value: <strong>${Math.round(total).toLocaleString()}</strong>
        </p>
        <button onClick={downloadCsv} className="btn-secondary">
          Download My Inventory (CSV)
        </button>
      </div>

      <p className="disclaimer mt-4">
        This inventory is for your own records and to support a potential claim. It
        does not automatically update your policy's personal property coverage
        limits, review your limits with your insurance professional if your
        inventory's value has changed significantly.
      </p>
    </div>
  )
}
