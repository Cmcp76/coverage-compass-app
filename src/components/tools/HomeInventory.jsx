import { useState } from 'react'

const defaultRooms = [
  'Living Room',
  'Bedroom(s)',
  'Kitchen',
  'Garage / Storage',
  'Home Office',
]

let idCounter = 0
function nextId() {
  idCounter += 1
  return `item-${idCounter}`
}

export default function HomeInventory() {
  const [openRoom, setOpenRoom] = useState(defaultRooms[0])
  const [items, setItems] = useState({})
  const [draft, setDraft] = useState({ name: '', value: '', date: '' })

  function addItem(room) {
    if (!draft.name.trim()) return
    setItems((prev) => ({
      ...prev,
      [room]: [
        ...(prev[room] || []),
        { id: nextId(), name: draft.name, value: parseFloat(draft.value) || 0, date: draft.date },
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
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
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
      <h2 className="font-display text-lg font-semibold text-compass-navy">
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
            onClick={() => setOpenRoom(room)}
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
                  ${item.value.toLocaleString()}
                </span>
                <button
                  onClick={() => removeItem(openRoom, item.id)}
                  className="text-xs text-compass-slate hover:text-compass-amber"
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

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <input
            type="text"
            placeholder="Item name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="rounded-lg border border-compass-line px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            type="number"
            placeholder="Estimated value"
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
            className="rounded-lg border border-compass-line px-3 py-2 text-sm"
          />
          <button
            onClick={() => addItem(openRoom)}
            className="btn-secondary justify-center"
          >
            Add Item
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-compass-ink">
          Total estimated value: <strong>${total.toLocaleString()}</strong>
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
