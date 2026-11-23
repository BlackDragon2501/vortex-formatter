// Vortex Formatter - Caja de herramientas para devs: JSON, Base64, URL,
// hashes MD5 (propio) y SHA (Web Crypto). 100% local en el navegador.

// ---------- utilidades ----------

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export async function copyText(s: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(s)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = s
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

// ---------- JSON ----------

export type JsonResult =
  | { ok: true; value: unknown; count: number }
  | { ok: false; error: string }

export interface JsonStats {
  keys: number
  arrays: number
  objects: number
  strings: number
  numbers: number
  nulls: number
  booleans: number
  depth: number
}

/** valida y parsea JSON devolviendo estadísticas básicas */
export function parseJson(text: string): JsonResult {
  if (!text.trim()) return { ok: false, error: 'El texto está vacío.' }
  try {
    const value = JSON.parse(text) as unknown
    return { ok: true, value, count: text.length }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'JSON inválido'
    const m = msg.match(/position (\d+)/)
    if (m) {
      const pos = parseInt(m[1], 10)
      const ctx = text.slice(Math.max(0, pos - 30), pos + 30)
      return { ok: false, error: `${msg}\nContexto: …${ctx}…` }
    }
    return { ok: false, error: msg }
  }
}

/** recorre el JSON y cuenta tipos y profundidad máxima */
export function jsonStats(value: unknown): JsonStats {
  const stats: JsonStats = { keys: 0, arrays: 0, objects: 0, strings: 0, numbers: 0, nulls: 0, booleans: 0, depth: 0 }
  const walk = (v: unknown, d: number) => {
    if (d > stats.depth) stats.depth = d
    if (Array.isArray(v)) {
      stats.arrays++
      for (const item of v) walk(item, d + 1)
      return
    }
    if (v !== null && typeof v === 'object') {
      stats.objects++
      for (const [k, item] of Object.entries(v as Record<string, unknown>)) {
        stats.keys++
        void k
        walk(item, d + 1)
      }
      return
    }
    if (typeof v === 'string') stats.strings++
    else if (typeof v === 'number') stats.numbers++
    else if (typeof v === 'boolean') stats.booleans++
    else if (v === null) stats.nulls++
  }
  walk(value, 1)
  return stats
}

/** formatea JSON con indentación elegida; sortKeys ordena alfabéticamente */
export function stringifyJson(value: unknown, indent: 2 | 4 | 0, sortKeys = false): string {
  const seen = new WeakSet()
  return JSON.stringify(
    value,
    (_k, v: unknown) => {
      if (v !== null && typeof v === 'object') {
        if (seen.has(v)) return '[Circular]'
        seen.add(v)
        if (sortKeys && !Array.isArray(v)) {
          return Object.fromEntries(
            Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
          )
        }
      }
      return v
    },
    indent
  )
}

/** convierte JSON a una versión compacta de una línea */
export function minifyJson(text: string): string {
  const res = parseJson(text)
  if (!res.ok) return ''
  return JSON.stringify(res.value)
}

// ---------- codificaciones ----------

export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export function fromBase64(b64: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    const clean = b64.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
    const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4)
    const bin = atob(padded)
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return { ok: true, text: new TextDecoder().decode(bytes) }
  } catch {
    return { ok: false, error: 'No es Base64 válido (revisa caracteres o relleno).' }
  }
}

export function toBase64Url(text: string): string {
  return toBase64(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function encodeUrl(text: string, component = true): string {
  return component ? encodeURIComponent(text) : encodeURI(text)
}

export function decodeUrl(text: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    return { ok: true, text: decodeURIComponent(text.replace(/\+/g, ' ')) }
  } catch {
    return { ok: false, error: 'Secuencia de escape inválida.' }
  }
}

/** JWT: decodifica cabecera y payload sin verificar firma (solo inspección) */
export function decodeJwt(token: string): { header: string; payload: string; error?: string } {
  const parts = token.trim().split('.')
  if (parts.length < 2) return { header: '', payload: '', error: 'Un JWT tiene 3 partes separadas por punto.' }
  const h = fromBase64(parts[0])
  const p = fromBase64(parts[1])
  if (!h.ok || !p.ok) return { header: '', payload: '', error: 'Las partes no son Base64-URL válidas.' }
  return { header: h.text, payload: p.text }
}

// ---------- hashes ----------

const HEX = '0123456789abcdef'
function toHex(data: Uint8Array): string {
  let out = ''
  for (const b of data) {
    out += HEX[b >> 4] + HEX[b & 15]
  }
  return out
}

/** MD5 puro en TypeScript (Web Crypto no lo trae) */
export function md5(text: string): string {
  const msg = new TextEncoder().encode(text)
  return md5Bytes(msg)
}

export function md5Bytes(msg: Uint8Array): string {
  // padding PKCS-style estándar de MD5
  const len = msg.length
  const bitLenLo = (len * 8) & 0xffffffff
  const bitLenHi = Math.floor((len * 8) / 0x100000000)
  const totalLen = (((len + 8) >> 6) + 1) << 6
  const buf = new Uint8Array(totalLen)
  buf.set(msg)
  buf[len] = 0x80
  const dv = new DataView(buf.buffer)
  dv.setUint32(totalLen - 8, bitLenLo, true)
  dv.setUint32(totalLen - 4, bitLenHi, true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]
  const K = new Uint32Array(64)
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000)

  const M = new Uint32Array(16)
  for (let chunk = 0; chunk < totalLen; chunk += 64) {
    for (let i = 0; i < 16; i++) M[i] = dv.getUint32(chunk + i * 4, true)
    let A = a0, B = b0, C = c0, D = d0
    for (let i = 0; i < 64; i++) {
      let F: number, g: number
      if (i < 16) { F = (B & C) | (~B & D); g = i }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16 }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16 }
      else { F = C ^ (B | ~D); g = (7 * i) % 16 }
      F = (F + A + K[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0
    }
    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }
  const out = new Uint8Array(16)
  const odv = new DataView(out.buffer)
  odv.setUint32(0, a0, true)
  odv.setUint32(4, b0, true)
  odv.setUint32(8, c0, true)
  odv.setUint32(12, d0, true)
  return toHex(out)
}

export type ShaAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

/** hash SHA con la Web Crypto nativa */
export async function shaHex(text: string, algo: ShaAlgo): Promise<string> {
  const digest = await crypto.subtle.digest(algo, new TextEncoder().encode(text))
  return toHex(new Uint8Array(digest))
}

export async function shaFile(buf: ArrayBuffer, algo: ShaAlgo): Promise<string> {
  const digest = await crypto.subtle.digest(algo, buf)
  return toHex(new Uint8Array(digest))
}
