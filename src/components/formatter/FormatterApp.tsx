'use client'

// Vortex Formatter - JSON, codificaciones y hashes para developers.
// Nada sale del navegador: parser propio, Web Crypto y MD5 local.

import { useMemo, useState } from 'react'
import {
  Braces,
  Binary,
  Link2,
  Hash,
  Copy,
  Check,
  FileWarning,
  ArrowRightLeft,
  Wand2,
  KeyRound,
} from 'lucide-react'
import {
  copyText,
  decodeJwt,
  decodeUrl,
  encodeUrl,
  fmtBytes,
  fromBase64,
  jsonStats,
  md5,
  parseJson,
  shaHex,
  stringifyJson,
  toBase64,
  toBase64Url,
  type ShaAlgo,
} from '@/lib/formatter'

const SUPPORT_EMAIL = 'vortexmusic.soporte.app@gmail.com'
const ACCENT = '#60a5fa'
const ACCENT2 = '#93c5fd'

function VortexLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="10" fill="#161616" />
      <circle cx="24" cy="24" r="17" fill="none" stroke={ACCENT} strokeWidth="3.5" />
      <path d="M24 10a14 14 0 1 1-9.9 4.1" fill="none" stroke={ACCENT2} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M24 17a7 7 0 1 0 7 7" fill="none" stroke={ACCENT2} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M18 19l-5 5 5 5M30 19l5 5-5 5" fill="none" stroke={ACCENT2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-[#2b2b31] bg-[#141416] px-6 py-4">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 text-center">
        <p className="text-[11px] text-[#9b9ba4]">
          Vórtex Formatter · Derechos Reservados © 2026 Vortex Company ·{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#93c5fd] hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
        <p className="text-[11px] text-[#9b9ba4]">Gratis · Sin anuncios · 100% local en tu navegador</p>
      </div>
    </footer>
  )
}

const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#2b2b31] bg-[#1e1e22] px-3 py-2 text-xs font-medium text-[#ececf1] hover:bg-[#26262b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors'

const btnAccent =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#0f0f10] transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#60a5fa] hover:bg-[#93c5fd]'

const ta =
  'w-full resize-y rounded-xl border border-[#2b2b31] bg-[#0f0f10] px-3 py-2.5 font-mono text-xs leading-relaxed outline-none focus:border-[#60a5fa]'

type Tab = 'json' | 'b64' | 'url' | 'hash'

function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      className={`${btn} px-2 py-1.5`}
      title={label ?? 'Copiar'}
      onClick={async () => {
        if (await copyText(value)) {
          setOk(true)
          setTimeout(() => setOk(false), 1200)
        }
      }}
    >
      {ok ? <Check className="h-3.5 w-3.5 text-[#22c55e]" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#7f1d1d] bg-[#1a1214] px-3 py-2.5 text-xs text-[#f87171]">
      <FileWarning className="mt-0.5 h-4 w-4 shrink-0" /> <span className="whitespace-pre-wrap">{msg}</span>
    </div>
  )
}

export default function FormatterApp() {
  const [tab, setTab] = useState<Tab>('json')

  // ----- JSON -----
  const [jsonIn, setJsonIn] = useState('')
  const [jsonOut, setJsonOut] = useState('')
  const [jsonErr, setJsonErr] = useState('')
  const [indent, setIndent] = useState<2 | 4>(2)
  const [sortKeys, setSortKeys] = useState(false)

  const runJson = (mode: 'pretty' | 'minify') => {
    const res = parseJson(jsonIn)
    if (!res.ok) {
      setJsonErr(res.error)
      setJsonOut('')
      return
    }
    setJsonErr('')
    setJsonOut(mode === 'minify' ? stringifyJson(res.value, 0) : stringifyJson(res.value, indent, sortKeys))
  }

  const stats = useMemo(() => {
    const res = parseJson(jsonIn)
    return res.ok ? jsonStats(res.value) : null
  }, [jsonIn])

  // ----- Base64 -----
  const [b64Text, setB64Text] = useState('')
  const [b64Out, setB64Out] = useState('')
  const [b64Err, setB64Err] = useState('')

  const runB64 = (dir: 'enc' | 'dec') => {
    setB64Err('')
    if (dir === 'enc') {
      setB64Out(toBase64(b64Text))
      return
    }
    const res = fromBase64(b64Text)
    if (res.ok) setB64Out(res.text)
    else {
      setB64Err(res.error)
      setB64Out('')
    }
  }

  // ----- URL / JWT -----
  const [urlText, setUrlText] = useState('')
  const [urlOut, setUrlOut] = useState('')
  const [urlErr, setUrlErr] = useState('')
  const [jwtOut, setJwtOut] = useState('')

  const runUrl = (dir: 'enc' | 'dec') => {
    setUrlErr('')
    setJwtOut('')
    if (dir === 'enc') setUrlOut(encodeUrl(urlText))
    else {
      const res = decodeUrl(urlText)
      if (res.ok) setUrlOut(res.text)
      else {
        setUrlErr(res.error)
        setUrlOut('')
      }
    }
  }

  const runJwt = () => {
    setUrlErr('')
    const res = decodeJwt(urlText)
    if (res.error) {
      setUrlErr(res.error)
      setJwtOut('')
      return
    }
    setJwtOut(JSON.stringify({ header: JSON.parse(res.header || '{}'), payload: JSON.parse(res.payload || '{}') }, null, 2))
  }

  // ----- hashes -----
  const [hashIn, setHashIn] = useState('')
  const [hashes, setHashes] = useState<Record<string, string>>({})

  const runHashes = async () => {
    const algos: ShaAlgo[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']
    const entries: [string, string][] = [['MD5', md5(hashIn)]]
    for (const a of algos) entries.push([a, await shaHex(hashIn, a)])
    setHashes(Object.fromEntries(entries))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[#2b2b31] bg-[#141416] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <VortexLogo className="w-9 h-9" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight">
              Vórtex Formatter <span className="font-normal text-[#9b9ba4]">· Herramientas de dev, sin límites</span>
            </h1>
            <p className="text-[11px] text-[#9b9ba4]">JSON, Base64, URL, JWT y hashes · todo se calcula en tu equipo</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {/* pestañas */}
        <div className="mb-4 flex gap-1 rounded-xl border border-[#2b2b31] bg-[#17171a] p-1">
          {(
            [
              { id: 'json', label: 'JSON', icon: Braces },
              { id: 'b64', label: 'Base64', icon: Binary },
              { id: 'url', label: 'URL / JWT', icon: Link2 },
              { id: 'hash', label: 'Hashes', icon: Hash },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                tab === t.id ? 'bg-[#26262b] text-[#ececf1]' : 'text-[#9b9ba4] hover:text-[#ececf1]'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'json' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#2b2b31] bg-[#17171a] p-5">
              <p className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#9b9ba4]">
                <span className="flex items-center gap-2"><Braces className="h-3.5 w-3.5" /> Entrada</span>
                {jsonIn && <span className="font-normal normal-case">{fmtBytes(jsonIn.length)}</span>}
              </p>
              <textarea value={jsonIn} onChange={(e) => setJsonIn(e.target.value)} rows={8} placeholder='{"hola": "mundo"}' className={ta} />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button className={btnAccent} onClick={() => runJson('pretty')} disabled={!jsonIn.trim()}>
                  <Wand2 className="h-3.5 w-3.5" /> Formatear
                </button>
                <button className={btn} onClick={() => runJson('minify')} disabled={!jsonIn.trim()}>
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Minificar
                </button>
                <label className="flex items-center gap-1.5 text-xs text-[#ececf1]">
                  <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} className="accent-[#60a5fa]" /> ordenar claves
                </label>
                <label className="flex items-center gap-2 text-xs text-[#9b9ba4]">
                  indentación
                  <select value={indent} onChange={(e) => setIndent(parseInt(e.target.value, 10) as 2 | 4)} className="rounded-md border border-[#2b2b31] bg-[#0f0f10] px-2 py-1 text-xs text-[#ececf1] outline-none">
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                  </select>
                </label>
              </div>
              {jsonErr && <ErrorBox msg={jsonErr} />}
            </div>

            {stats && (
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#2b2b31] bg-[#17171a] p-5 sm:grid-cols-4">
                {(
                  [
                    ['claves', stats.keys],
                    ['objetos', stats.objects],
                    ['arreglos', stats.arrays],
                    ['profundidad', stats.depth],
                    ['cadenas', stats.strings],
                    ['números', stats.numbers],
                    ['booleanos', stats.booleans],
                    ['nulos', stats.nulls],
                  ] as const
                ).map(([label, n]) => (
                  <div key={label} className="rounded-xl border border-[#2b2b31] bg-[#0f0f10] px-3 py-2 text-center">
                    <p className="text-sm font-bold text-[#93c5fd]">{n}</p>
                    <p className="text-[10px] uppercase tracking-wide text-[#9b9ba4]">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {jsonOut && (
              <div className="rounded-2xl border border-[#2b2b31] bg-[#17171a] p-5">
                <p className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#9b9ba4]">
                  <span>Salida</span>
                  <span className="font-normal normal-case">{fmtBytes(jsonOut.length)}</span>
                </p>
                <textarea readOnly value={jsonOut} rows={10} className={ta} />
                <div className="mt-3 flex gap-2">
                  <CopyBtn value={jsonOut} label="Copiar salida" />
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'b64' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#2b2b31] bg-[#17171a] p-5">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9b9ba4]">
                <Binary className="h-3.5 w-3.5" /> Texto / Base64
              </p>
              <textarea value={b64Text} onChange={(e) => setB64Text(e.target.value)} rows={5} placeholder="Pega texto plano o Base64…" className={ta} />
              <div className="mt-3 flex flex-wrap gap-2">
                <button className={btnAccent} onClick={() => runB64('enc')} disabled={!b64Text.trim()}>
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Texto → Base64
                </button>
                <button className={btn} onClick={() => runB64('dec')} disabled={!b64Text.trim()}>
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Base64 → Texto
                </button>
                <button className={btn} onClick={() => setB64Out(toBase64Url(b64Text))} disabled={!b64Text.trim()}>
                  <KeyRound className="h-3.5 w-3.5" /> Base64-URL
                </button>
              </div>
              {b64Err && <ErrorBox msg={b64Err} />}
              {b64Out && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-[#9b9ba4]">Resultado</p>
                  <textarea readOnly value={b64Out} rows={5} className={ta} />
                  <div className="mt-2"><CopyBtn value={b64Out} label="Copiar resultado" /></div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'url' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#2b2b31] bg-[#17171a] p-5">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9b9ba4]">
                <Link2 className="h-3.5 w-3.5" /> URL / JWT
              </p>
              <textarea value={urlText} onChange={(e) => setUrlText(e.target.value)} rows={4} placeholder="Texto con %20, un enlace o un JWT eyJ…" className={ta} />
              <div className="mt-3 flex flex-wrap gap-2">
                <button className={btnAccent} onClick={() => runUrl('enc')} disabled={!urlText.trim()}>
                  Codificar
                </button>
                <button className={btn} onClick={() => runUrl('dec')} disabled={!urlText.trim()}>
                  Decodificar
                </button>
                <button className={btn} onClick={runJwt} disabled={!urlText.trim()}>
                  <KeyRound className="h-3.5 w-3.5" /> Decodificar JWT
                </button>
              </div>
              {urlErr && <ErrorBox msg={urlErr} />}
              {urlOut && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-[#9b9ba4]">Resultado</p>
                  <textarea readOnly value={urlOut} rows={4} className={ta} />
                  <div className="mt-2"><CopyBtn value={urlOut} /></div>
                </div>
              )}
              {jwtOut && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-[#9b9ba4]">JWT decodificado (la firma no se verifica: esto es solo inspección local)</p>
                  <textarea readOnly value={jwtOut} rows={8} className={ta} />
                  <div className="mt-2"><CopyBtn value={jwtOut} /></div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'hash' && (
          <div className="rounded-2xl border border-[#2b2b31] bg-[#17171a] p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9b9ba4]">
              <Hash className="h-3.5 w-3.5" /> Hash de texto (MD5 propio + SHA nativo)
            </p>
            <textarea value={hashIn} onChange={(e) => setHashIn(e.target.value)} rows={4} placeholder="Pega el texto…" className={ta} />
            <div className="mt-3">
              <button className={btnAccent} onClick={runHashes} disabled={!hashIn}>
                <Hash className="h-3.5 w-3.5" /> Calcular MD5 y SHA
              </button>
            </div>
            {Object.keys(hashes).length > 0 && (
              <div className="mt-4 space-y-2">
                {Object.entries(hashes).map(([algo, hex]) => (
                  <div key={algo} className="flex items-center gap-2 rounded-lg border border-[#2b2b31] bg-[#0f0f10] px-3 py-2">
                    <span className="w-16 shrink-0 text-[11px] font-bold text-[#93c5fd]">{algo}</span>
                    <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#ececf1]" title={hex}>{hex}</code>
                    <CopyBtn value={hex} label={`Copiar ${algo}`} />
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-[#9b9ba4]">
              MD5 se calcula con una implementación propia en el navegador (Web Crypto no lo incluye). Para verificar
              archivos grandes, usa Vórtex HashPass, que los lee por trozos.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
