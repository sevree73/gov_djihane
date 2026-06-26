'use client'

import { useState } from 'react'

export type PATViewData = {
  id: string
  name: string
  avancement: number
  programmees: number
  achevees: number
  enCours: number
  enRetard: number
  IAP: number
  scorePAT: number
  niveauDeRisque: 'FAIBLE' | 'MOYEN' | 'ÉLEVÉ'
}

const PAT_COLORS = ['#0d9488', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#059669', '#0891b2', '#9333ea']

const RISK_STYLE = {
  FAIBLE: 'bg-emerald-100 text-emerald-700',
  MOYEN:  'bg-amber-100 text-amber-700',
  ÉLEVÉ:  'bg-red-100 text-red-600',
}

// Decorative territory polygon — illustrative, not geographically accurate
const TERRITORY_POINTS = '85,65 230,28 385,48 455,145 440,300 310,375 145,360 55,250 75,135'

function WilayaSVG({
  pats,
  wilayaName,
  selectedIdx,
  onSelect,
}: {
  pats: PATViewData[]
  wilayaName: string
  selectedIdx: number | null
  onSelect: (i: number) => void
}) {
  const cx = 248
  const cy = 205

  const positions = pats.map((_, i) => {
    const n = pats.length
    const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2
    // Slightly vary radii so dots don't stack on a perfect circle
    const rx = 95 + (i % 3) * 12
    const ry = 70 + (i % 2) * 14
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) }
  })

  return (
    <svg viewBox="0 0 500 410" className="w-full h-full">
      {/* Sandy background */}
      <rect width="500" height="410" fill="#f2ece0" rx="14" />

      {/* Territory polygon */}
      <polygon
        points={TERRITORY_POINTS}
        fill="#e8e0d0"
        stroke="#bfad94"
        strokeWidth="1.8"
        strokeDasharray="5,3"
      />

      {/* Lines from center to PAT dots */}
      {positions.map((pos, i) => (
        <line
          key={`l${i}`}
          x1={cx} y1={cy}
          x2={pos.x} y2={pos.y}
          stroke="#7a1f1f"
          strokeWidth={selectedIdx === i ? 2 : 1.5}
          strokeOpacity={selectedIdx === null || selectedIdx === i ? 0.65 : 0.2}
        />
      ))}

      {/* Wilaya capital dot */}
      <circle cx={cx} cy={cy} r={13} fill="#111827" stroke="white" strokeWidth="3" />
      <text x={cx + 18} y={cy - 6} fontSize="11" fontWeight="700" fill="#1f2937" fontFamily="sans-serif">
        {wilayaName}
      </text>
      <text x={cx + 18} y={cy + 7} fontSize="9" fill="#6b7280" fontFamily="sans-serif">
        wilaya
      </text>

      {/* PAT dots */}
      {positions.map((pos, i) => {
        const color = PAT_COLORS[i % PAT_COLORS.length]
        const selected = selectedIdx === i
        const label = pats[i].name.length > 12 ? pats[i].name.slice(0, 11) + '…' : pats[i].name
        return (
          <g key={`p${i}`} onClick={() => onSelect(i)} style={{ cursor: 'pointer' }}>
            {/* Glow ring when selected */}
            {selected && (
              <circle cx={pos.x} cy={pos.y} r={20} fill={color} opacity="0.2" />
            )}
            <circle
              cx={pos.x} cy={pos.y}
              r={selected ? 13 : 10}
              fill={color}
              stroke="white"
              strokeWidth={selected ? 3 : 2}
              opacity={selectedIdx !== null && !selected ? 0.45 : 1}
            />
            {/* PAT number inside dot */}
            <text
              x={pos.x} y={pos.y + 4}
              fontSize="9" fontWeight="700" fill="white"
              textAnchor="middle" fontFamily="sans-serif"
              style={{ pointerEvents: 'none' }}
            >
              {i + 1}
            </text>
            {/* Label below dot */}
            <text
              x={pos.x}
              y={pos.y + (selected ? 28 : 25)}
              fontSize="10"
              fontWeight={selected ? '600' : '500'}
              fill={selected ? '#111827' : '#4b5563'}
              textAnchor="middle"
              fontFamily="sans-serif"
              style={{ pointerEvents: 'none' }}
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

interface Props {
  pats: PATViewData[]
  wilayaName: string | null
}

export default function PATWilayaView({ pats, wilayaName }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(pats.length > 0 ? 0 : null)
  const selected = selectedIdx !== null ? pats[selectedIdx] : null
  const color = selectedIdx !== null ? PAT_COLORS[selectedIdx % PAT_COLORS.length] : '#6b7280'

  if (pats.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 py-12 text-center">
        <p className="text-sm text-gray-400">Aucun PAT associé à ce projet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_290px] gap-4 items-start">
      {/* SVG illustration */}
      <div className="rounded-2xl overflow-hidden border border-[#d4c9b0] shadow-sm" style={{ aspectRatio: '5/4' }}>
        <WilayaSVG
          pats={pats}
          wilayaName={wilayaName ?? 'Wilaya'}
          selectedIdx={selectedIdx}
          onSelect={setSelectedIdx}
        />
      </div>

      {/* Fiche rapide */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fiche rapide</p>

        {selected ? (
          <>
            {/* PAT name with color indicator */}
            <div className="flex items-start gap-3">
              <div className="mt-1 w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">PAT {(selectedIdx ?? 0) + 1}</p>
                <h3 className="font-bold text-gray-900 text-base leading-snug">{selected.name}</h3>
              </div>
            </div>

            {/* Avancement */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Avancement</span>
                <span className="font-bold text-gray-800">{selected.avancement}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${selected.avancement}%`, background: color }} />
              </div>
            </div>

            {/* Actions grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p className="text-lg font-bold text-gray-900">{selected.programmees}</p>
                <p className="text-xs text-gray-500">Programmées</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                <p className="text-lg font-bold text-emerald-700">{selected.achevees}</p>
                <p className="text-xs text-emerald-600">Achevées</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                <p className="text-lg font-bold text-blue-700">{selected.enCours}</p>
                <p className="text-xs text-blue-600">En cours</p>
              </div>
              <div className={`rounded-xl p-2.5 text-center ${selected.enRetard > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <p className={`text-lg font-bold ${selected.enRetard > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {selected.enRetard}
                </p>
                <p className={`text-xs ${selected.enRetard > 0 ? 'text-red-500' : 'text-gray-400'}`}>En retard</p>
              </div>
            </div>

            {/* Indicateurs */}
            <div className="border-t border-gray-100 pt-3 space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">IAP</span>
                <span className="font-semibold text-gray-900">{selected.IAP.toFixed(3)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Score PAT</span>
                <span className="font-semibold text-gray-900">
                  {selected.scorePAT}
                  <span className="text-gray-400 text-xs font-normal"> /5</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Niveau de risque</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${RISK_STYLE[selected.niveauDeRisque]}`}>
                  {selected.niveauDeRisque}
                </span>
              </div>
            </div>

            {/* PAT selector pills */}
            {pats.length > 1 && (
              <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-1.5">
                {pats.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedIdx(i)}
                    className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                    style={
                      i === selectedIdx
                        ? { background: PAT_COLORS[i % PAT_COLORS.length], color: 'white' }
                        : { background: '#f3f4f6', color: '#6b7280' }
                    }
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400">Sélectionnez un PAT sur la carte.</p>
        )}
      </div>
    </div>
  )
}
