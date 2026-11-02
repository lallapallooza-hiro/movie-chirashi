import { useState, useRef, useCallback, useEffect, useMemo } from "react"

// ================================================================
// 型定義
// ================================================================

type Orientation = "portrait" | "landscape"  // 縦向き / 横向き

type FoldType =
  | "single"    // 折りなし（表のみ、または表+裏）
  | "bifold"    // 2つ折り（表・裏・中面×2）
  | "trifold"   // 3つ折り（表・裏・中面×3）
  | "quadfold"  // 4つ折り（表・裏・中面×4）

type ChirashiPanel = {
  url: string
  label: string        // 例: "表面" "裏面" "中面A" "中面B"
  orientation: Orientation  // パネルごとに縦/横を個別設定できる
}

type Chirashi = {
  id: string
  title: string
  titleKana: string
  year: number
  genre: string
  director: string
  cast: string[]
  foldType: FoldType
  panels: ChirashiPanel[]  // 画像パネル
  addedAt: string          // 登録日
  affiliateUrl1?: string
  affiliateUrl2?: string
}

type ChirashiGroup = {
  key: string
  title: string
  representative: Chirashi
  versions: Chirashi[]
}

function frontOrientation(c: Chirashi): Orientation {
  return c.panels[0]?.orientation ?? "portrait"
}

function optimizeCloudinaryUrl(url: string): string {
  const uploadPath = "/image/upload/"
  const optimizedUploadPath = `${uploadPath}f_auto,q_auto/`
  if (!url.includes(uploadPath) || url.includes(optimizedUploadPath)) return url
  return url.replace(uploadPath, optimizedUploadPath)
}

const japaneseCollator = new Intl.Collator("ja", { numeric: true, sensitivity: "base" })

function dateValue(value: string): number {
  const match = value.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (!match) return 0
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function formatDate(value: string): string {
  const match = value.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  return match ? `${match[1]}年${Number(match[2])}月${Number(match[3])}日` : value
}

function sortChirashi(items: Chirashi[]): Chirashi[] {
  return [...items].sort((a, b) =>
    b.year - a.year
    || japaneseCollator.compare(a.titleKana, b.titleKana)
    || japaneseCollator.compare(a.title, b.title)
    || japaneseCollator.compare(a.id, b.id)
  )
}

function groupChirashi(items: Chirashi[]): ChirashiGroup[] {
  const groups = new Map<string, Chirashi[]>()
  for (const item of sortChirashi(items)) {
    const key = `${item.title}\u0000${item.year}`
    const versions = groups.get(key)
    if (versions) versions.push(item)
    else groups.set(key, [item])
  }

  return Array.from(groups, ([key, versions]) => {
    const sortedVersions = [...versions].sort((a, b) =>
      dateValue(b.addedAt) - dateValue(a.addedAt) || japaneseCollator.compare(b.id, a.id)
    )
    return {
      key,
      title: sortedVersions[0].title,
      versions: sortedVersions,
      representative: sortedVersions[0],
    }
  }).sort((a, b) =>
    b.representative.year - a.representative.year
    || japaneseCollator.compare(a.representative.titleKana, b.representative.titleKana)
    || japaneseCollator.compare(a.title, b.title)
  )
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ja")
    .replace(/[\u30a1-\u30f6]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0x60)
    )
    .replace(/[・.=＝\s]+/g, "")
}

type Page =
  | { type: "main" }
  | { type: "tab"; kana: string; pageNum: number }
  | { type: "detail"; id: string; back: Page }

function p(url: string, label: string, orientation: Orientation = "portrait"): ChirashiPanel {
  const size = orientation === "landscape" ? "w=560&h=400" : "w=280&h=400"
  const fullUrl = url.includes("?") ? url.replace(/w=\d+&h=\d+/, size) : `${url}?${size}&fit=crop&auto=format`
  return { url: fullUrl, label, orientation }
}

const SAMPLE: Chirashi[] = [
  {
    id: "C-001",
    title: "夜霧の追跡者",
    titleKana: "ヤ",
    year: 1974, genre: "アクション", director: "鈴木 一郎", cast: ["田中 健", "山田 花子"],
    foldType: "single",
    panels: [
      p("https://unsplash.com", "表面", "portrait"),
      p("https://unsplash.com?crop=entropy", "裏面", "portrait"),
    ],
    addedAt: "2024-06-10",
  },
  {
    id: "C-002",
    title: "明日へのタンゴ",
    titleKana: "ア",
    year: 1988, genre: "ロマンス", director: "佐藤 美恵", cast: ["木村 太郎", "伊藤 京子"],
    foldType: "bifold",
    panels: [
      p("https://unsplash.com", "表面", "portrait"),
      p("https://unsplash.com", "裏面", "landscape"),
      p("https://unsplash.com", "中面A", "portrait"),
      p("https://unsplash.com", "中面B", "portrait"),
    ],
    addedAt: "2024-06-08",
  },
]

const ITEMS_PER_PAGE = 20

const DAKUTEN_MAP: Record<string, string> = {
  ガ:"カ", ギ:"キ", グ:"ク", ゲ:"ケ", ゴ:"コ",
  ザ:"サ", ジ:"シ", ズ:"ス", ゼ:"セ", ゾ:"ソ",
  ダ:"タ", ヂ:"チ", ヅ:"ツ", デ:"テ", ド:"ト",
  バ:"ハ", ビ:"ヒ", ブ:"フ", ベ:"ヘ", ボ:"ホ",
  パ:"ハ", ピ:"ヒ", プ:"フ", ペ:"ヘ", ポ:"ホ",
  ヴ:"ウ",
}

function normalizeKana(kana: string): string {
  return DAKUTEN_MAP[kana] ?? kana
}

const ALPHA_INDEX = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
const DIGIT_INDEX = "0123456789".split("")
const KANA_ONLY = [
  "ア","イ","ウ","エ","オ",
  "カ","キ","ク","ケ","コ",
  "サ","シ","ス","セ","ソ",
  "タ","チ","ツ","テ","ト",
  "ナ","ニ","ヌ","ネ","ノ",
  "ハ","ヒ","フ","ヘ","ホ",
  "マ","ミ","ム","メ","モ",
  "ヤ","ユ","ヨ",
  "ラ","リ","ル","レ","ロ",
  "ワ","ヲ","ン",
]

const FOLD_LABEL: Record<FoldType, string> = {
  single: "折りなし",
  bifold: "2つ折り",
  trifold: "3つ折り",
  quadfold: "4つ折り",
}

const MAX_PANELS = 6

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = "" }
    else { current += ch }
  }
  result.push(current.trim())
  return result
}

function parseCsv(text: string): { data: Chirashi[]; errors: string[] } {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim())
  const errors: string[] = []
  if (lines.length < 2) return { data: [], errors: ["データ行がありません"] }
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s/g, ""))
  const required = ["id", "title", "titlekana", "year", "genre", "director", "cast"]
  const missing = required.filter((r) => !headers.includes(r))
  if (missing.length > 0) return { data: [], errors: [`列が不足: ${missing.join(", ")}`] }
  const idx = (name: string) => headers.indexOf(name)
  const data: Chirashi[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const year = parseInt(cols[idx("year")])
    if (isNaN(year)) { errors.push(`${i + 1}行目: yearが数字ではありません`); continue }

    const panels: ChirashiPanel[] = []
    for (let n = 1; n <= MAX_PANELS; n++) {
      const urlCol = idx(`panel${n}_url`)
      const labelCol = idx(`panel${n}_label`)
      const orientCol = idx(`panel${n}_orient`)
      const url = urlCol >= 0 ? (cols[urlCol] || "") : ""
      if (!url) break
      const defaultLabels = ["表面", "裏面", "中面A", "中面B", "中面C", "中面D"]
      const label = labelCol >= 0 ? (cols[labelCol] || defaultLabels[n - 1]) : defaultLabels[n - 1]
      const orient = (orientCol >= 0 ? cols[orientCol] : "") as Orientation
      panels.push({ url, label, orientation: orient === "landscape" ? "landscape" : "portrait" })
    }
    if (panels.length === 0) continue

    data.push({
      id: cols[idx("id")] || `ROW-${i}`,
      title: cols[idx("title")] || "",
      titleKana: cols[idx("titlekana")] || "",
      year,
      genre: cols[idx("genre")] || "",
      director: cols[idx("director")] || "",
      cast: (cols[idx("cast")] || "").split("/").map((s) => s.trim()).filter(Boolean),
      foldType: (cols[idx("foldtype")] as FoldType) || "single",
      panels,
      addedAt: cols[idx("addedat")] || "",
      affiliateUrl1: idx("affiliate_url1") >= 0 ? cols[idx("affiliate_url1")] || "" : "",
      affiliateUrl2: idx("affiliate_url2") >= 0 ? cols[idx("affiliate_url2")] || "" : "",
    })
  }
  return { data, errors }
}
// ================================================================
// チラシカードコンポーネント（メイン・タブ画面共通）
// ================================================================
function ChirashiCard({ c, versionCount, onClick }: {
  c: Chirashi
  versionCount: number
  onClick: () => void
}) {
  const isLandscape = frontOrientation(c) === "landscape"
  const front = c.panels[0]

  return (
    <div className={`cursor-pointer group ${isLandscape ? "col-span-2" : ""}`} onClick={onClick}>
      <div className="relative overflow-hidden" style={{ aspectRatio: isLandscape ? "4/3" : "2/3", background: "#e8e0d4" }}>
        {front?.url ? (
          <img src={optimizeCloudinaryUrl(front.url)} alt={c.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
            <span className="font-serif text-2xl" style={{ color: "var(--border)" }}>映</span>
            <p className="font-serif text-[10px] text-center leading-snug" style={{ color: "var(--muted)" }}>{c.title}</p>
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 flex gap-1">
          {isLandscape && <span className="font-mono text-[8px] px-1 py-0.5 bg-black/60 text-white">横</span>}
          {c.foldType !== "single" && <span className="font-mono text-[8px] px-1 py-0.5 bg-black/60 text-white">{FOLD_LABEL[c.foldType]}</span>}
        </div>
        {versionCount > 1 && (
          <div className="absolute top-1.5 right-1.5">
            <span className="font-mono text-[9px] px-2 py-1 text-white shadow-sm" style={{ background: "var(--accent)" }}>全{versionCount}種類</span>
          </div>
        )}
        {c.panels.length > 1 && (
          <div className="absolute bottom-1.5 right-1.5">
            <span className="font-mono text-[8px] px-1.5 py-0.5 text-white" style={{ background: "var(--accent)" }}>{c.panels.length}面</span>
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="font-serif text-xs font-semibold leading-snug" style={{ color: "var(--fg)" }}>{c.title}</p>
        <p className="font-mono text-[9px] mt-0.5" style={{ color: "var(--muted)" }}>{c.year}年{versionCount > 1 ? ` · ${versionCount}種類` : ""}</p>
      </div>
    </div>
  )
}

// ================================================================
// ライトボックス（拡大表示モーダル）
// ================================================================
type LightboxState = { url: string; label: string; orientation: Orientation } | null
const ZOOM_MIN = 0.5
const ZOOM_MAX = 5
const ZOOM_STEP = 0.25

function Lightbox({ state, title, affiliateUrl2, onClose }: {
  state: LightboxState; title?: string; affiliateUrl1?: string; affiliateUrl2?: string; onClose: () => void
}) {
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (state) { setZoom(1); setOffset({ x: 0, y: 0 }) } }, [state])

  useEffect(() => {
    if (!state) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))
      if (e.key === "-") setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))
      if (e.key === "0") { setZoom(1); setOffset({ x: 0, y: 0 }) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [state, onClose])

  useEffect(() => {
    document.body.style.overflow = state ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [state])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(z + delta).toFixed(2))))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y }
    e.preventDefault()
  }, [zoom, offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.startX),
      y: dragRef.current.oy + (e.clientY - dragRef.current.startY),
    })
  }, [])

  const handleMouseUp = useCallback(() => { dragRef.current = null }, [])
  const changeZoom = (delta: number) => {
    setZoom((z) => {
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(z + delta).toFixed(2)))
      if (next <= 1) setOffset({ x: 0, y: 0 })
      return next
    })
  }

  if (!state) return null
  const isLandscape = state.orientation === "landscape"
  const isDragging = zoom > 1

  const safeTitle = title?.trim()
  const amazonUrl = safeTitle ? "https://amazon.co.jp/s?k=" + encodeURIComponent(safeTitle + " DVD") + "&tag=bqe07751-22" : ""
  const mercariUrl = affiliateUrl2?.trim() || (safeTitle ? "https://mercari.com" + encodeURIComponent(safeTitle + " チラシ") : "")
  return (
    <div className="lightbox-modal fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.92)" }} onContextMenu={(e) => e.preventDefault()}>
      <div className="w-full flex items-center justify-between px-6 py-3 flex-shrink-0" style={{ background: "rgba(0,0,0,0.4)" }}>
        <div className="flex items-center gap-3">
          <span className="font-serif text-white text-sm font-semibold">{state.label}</span>
          <span className="font-mono text-[10px] px-2 py-0.5 border border-white/20 text-white/40">{isLandscape ? "横向き" : "縦向き"}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => changeZoom(-ZOOM_STEP)} disabled={zoom <= ZOOM_MIN} className="w-8 h-8 font-mono text-lg flex items-center justify-center text-white/70 hover:text-white">−</button>
          <span className="font-mono text-xs px-3 text-white/70 text-center min-w-[4rem]">{Math.round(zoom * 100)}%</span>
          <button onClick={() => changeZoom(ZOOM_STEP)} disabled={zoom >= ZOOM_MAX} className="w-8 h-8 font-mono text-lg flex items-center justify-center text-white/70 hover:text-white">＋</button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white font-mono text-xl ml-4">×</button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 w-full flex items-center justify-center overflow-hidden" style={{ cursor: isDragging ? "grab" : "default" }} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={(e) => { if (dragRef.current === null && e.target === e.currentTarget) onClose() }}>
        <div style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: "center center", transition: dragRef.current ? "none" : "transform 0.15s ease", userSelect: "none" }}>
          <img src={optimizeCloudinaryUrl(state.url)} alt={state.label} draggable={false} style={{ maxWidth: isLandscape ? "80vw" : "50vw", maxHeight: "75vh", objectFit: "contain", display: "block" }} />
        </div>
      </div>

      <div className="w-full border-t border-white/10 px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 flex-shrink-0" style={{ background: "rgba(0,0,0,0.72)" }}>
        {safeTitle ? (
          <a href={amazonUrl} target="_blank" rel="noopener noreferrer" className="min-h-11 sm:min-w-64 px-5 py-3 flex items-center justify-center text-center text-sm font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-colors">
            Amazonでこの映画をチェック
          </a>
        ) : (
          <span className="min-h-11 sm:min-w-64 px-5 py-3 flex items-center justify-center text-center text-sm font-bold text-neutral-950 bg-amber-400 opacity-50 pointer-events-none transition-colors">
            Amazonでこの映画をチェック
          </span>
        )}
        <a href={mercariUrl} target="_blank" rel="noopener noreferrer sponsored" className="min-h-11 sm:min-w-64 px-5 py-3 flex items-center justify-center text-center text-sm font-bold text-white border border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/50 transition-colors">
          メルカリ・他でチェック
        </a>
      </div>
    </div>
  )
}

function PanelItem({ panel, size = 140, onOpenLightbox }: {
  panel: ChirashiPanel; size?: number; onOpenLightbox?: (state: LightboxState) => void
}) {
  const isLandscape = panel.orientation === "landscape"
  const width = isLandscape ? size * 2 : size
  const canExpand = !!panel.url && !!onOpenLightbox

  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <div className={`overflow-hidden shadow-md relative group ${canExpand ? "cursor-zoom-in" : ""}`} style={{ width: `${width}px`, aspectRatio: isLandscape ? "4/3" : "2/3", background: "#e8e0d4", outline: "1px solid var(--border)" }} onClick={() => canExpand && onOpenLightbox!({ url: panel.url, label: panel.label, orientation: panel.orientation })}>
        {panel.url ? (
          <>
            <img src={optimizeCloudinaryUrl(panel.url)} alt={panel.label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            {canExpand && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: "rgba(0,0,0,0.35)" }}><span className="text-white text-2xl">⊕</span></div>}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center font-serif text-2xl" style={{ color: "var(--border)" }}>映</div>
        )}
      </div>
      <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{panel.label}</span>
    </div>
  )
}

function PanelDisplay({ c }: { c: Chirashi }) {
  const [lightbox, setLightbox] = useState<LightboxState>(null)
  const frontBack = c.panels.filter((p) => p.label === "表面" || p.label === "裏面")
  const insides = c.panels.filter((p) => p.label !== "表面" && p.label !== "裏面")

  return (
    <>
      <Lightbox state={lightbox} title={c.title} affiliateUrl1={c.affiliateUrl1} affiliateUrl2={c.affiliateUrl2} onClose={() => setLightbox(null)} />
      <div className="space-y-8">
        {frontBack.length > 0 && (
          <div>
            <p className="font-mono text-[10px] mb-4 tracking-widest" style={{ color: "var(--muted)" }}>外面 <span className="ml-3 text-[9px]">画像をクリックで拡大</span></p>
            <div className="flex gap-6 flex-wrap items-start">
              {frontBack.map((panel) => <PanelItem key={panel.label} panel={panel} size={140} onOpenLightbox={setLightbox} />)}
            </div>
          </div>
        )}
        {insides.length > 0 && (
          <div>
            <p className="font-mono text-[10px] mb-4 tracking-widest" style={{ color: "var(--muted)" }}>中面（{FOLD_LABEL[c.foldType]}） <span className="ml-3 text-[9px]">画像をクリックで拡大</span></p>
            <div className="flex gap-px items-start flex-wrap">
              {insides.map((panel, i) => <PanelItem key={i} panel={panel} size={120} onOpenLightbox={setLightbox} />)}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function Header({ chirashiList, page, onNavigate }: { chirashiList: Chirashi[]; page: Page; onNavigate: (p: Page) => void }) {
  return (
    <header style={{ background: "var(--header-bg)" }} className="text-white flex-shrink-0">
      <div className="px-6 py-3 flex items-center justify-between border-b border-white/10">
        <button onClick={() => onNavigate({ type: "main" })} className="flex items-center gap-3 hover:opacity-80">
          <div className="w-7 h-7 flex items-center justify-center font-serif font-bold" style={{ background: "var(--accent)" }}>映</div>
          <div className="text-left">
            <div className="font-serif text-base font-bold tracking-wider leading-none">映画チラシ・コレクション</div>
            <div className="font-mono text-[9px] text-white/40 mt-0.5">MOVIE CHIRASHI DATABASE</div>
          </div>
        </button>
        <span className="font-mono text-xs text-white/40"><span className="text-white font-bold">{chirashiList.length}</span> 件</span>
      </div>
      <div className="px-6 py-1.5 flex items-center gap-px flex-wrap border-b border-white/10">
        {KANA_ONLY.map((kana) => {
          const count = chirashiList.filter((c) => normalizeKana(c.titleKana) === kana).length
          return (
            <button key={kana} disabled={count === 0} onClick={() => onNavigate({ type: "tab", kana, pageNum: 1 })} className={`px-2 py-1 font-serif text-xs ${count === 0 ? "text-white/15" : "text-white/60 hover:text-white"}`}>{kana}</button>
          )
        })}
      </div>
    </header>
  )
}
function BrowseControls({ query, onQueryChange, decade, onDecadeChange, years, resultCount, totalCount }: {
  query: string; onQueryChange: (v: string) => void; decade: string; onDecadeChange: (v: string) => void; year: string; onYearChange: (v: string) => void; years: number[]; resultCount: number; totalCount: number
}) {
  const decades = Array.from(new Set(years.map((y) => Math.floor(y / 10) * 10))).sort((a, b) => b - a)
  return (
    <section className="border-b px-4 py-4 sm:px-6" style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <input type="search" value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="タイトル・監督から検索" className="border p-2 text-sm flex-1" style={{ background: "var(--bg)", borderColor: "var(--border)" }} />
        <select value={decade} onChange={(e) => onDecadeChange(e.target.value)} className="border p-2 text-sm" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
          <option value="all">すべての年代</option>
          {decades.map((d) => <option key={d} value={d}>{d}年代</option>)}
        </select>
        <span className="font-mono text-xs sm:ml-auto">{resultCount} / {totalCount}件</span>
      </div>
    </section>
  )
}

function Pagination({ pageNum, totalPages, onChange }: { pageNum: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <nav className="mt-10 flex items-center justify-center gap-3">
      <button onClick={() => onChange(pageNum - 1)} disabled={pageNum === 1} className="border px-4 py-2 text-xs disabled:opacity-30">← 前へ</button>
      <span className="font-mono text-xs">{pageNum} / {totalPages}</span>
      <button onClick={() => onChange(pageNum + 1)} disabled={pageNum === totalPages} className="border px-4 py-2 text-xs disabled:opacity-30">次へ →</button>
    </nav>
  )
}

function MainView({ chirashiList, filterActive, onNavigate }: { chirashiList: Chirashi[]; filterActive: boolean; onNavigate: (p: Page) => void }) {
  const groups = groupChirashi(chirashiList)
  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-serif text-xl font-bold mb-4">{filterActive ? "検索結果" : "登録チラシ一覧"}</h1>
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        {groups.map((g) => <ChirashiCard key={g.key} c={g.representative} versionCount={g.versions.length} onClick={() => onNavigate({ type: "detail", id: g.representative.id, back: { type: "main" } })} />)}
      </div>
    </div>
  )
}

function TabView({ chirashiList, kana, pageNum, onNavigate }: { chirashiList: Chirashi[]; kana: string; pageNum: number; onNavigate: (p: Page) => void }) {
  const items = chirashiList.filter((c) => normalizeKana(c.titleKana) === kana)
  const groups = groupChirashi(items)
  return (
    <div className="p-6">
      <h1 className="font-serif text-xl font-bold mb-4">【{kana}】のチラシ</h1>
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        {groups.map((g) => <ChirashiCard key={g.key} c={g.representative} versionCount={g.versions.length} onClick={() => onNavigate({ type: "detail", id: g.representative.id, back: { type: "tab", kana, pageNum } })} />)}
      </div>
    </div>
  )
}

function DetailView({ chirashiList, id, back, onNavigate }: { chirashiList: Chirashi[]; id: string; back: Page; onNavigate: (p: Page) => void }) {
  const c = chirashiList.find((item) => item.id === id)
  if (!c) return <div className="p-10 text-center">見つかりませんでした</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button onClick={() => onNavigate(back)} className="text-xs mb-6 block text-left">← 戻る</button>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-3">{c.title}</h1>
        <p className="text-sm">{c.year}年 · 監督: {c.director} · 出演: {c.cast.join(", ")}</p>
      </div>
      <PanelDisplay c={c} />
    </div>
  )
}

export default function App() {
  const [chirashiList, setChirashiList] = useState<Chirashi[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState<Page>({ type: "main" })
  const [query, setQuery] = useState("")
  const [decade, setDecade] = useState("all")
  const [year, setYear] = useState("all")

  useEffect(() => {
    fetch("/chirashi-data.csv")
      .then((res) => res.text())
      .then((text) => {
        const { data } = parseCsv(text)
        setChirashiList(data.length > 0 ? data : SAMPLE)
      })
      .catch(() => setChirashiList(SAMPLE))
      .finally(() => setLoading(false))
  }, [])

  const years = useMemo(() => Array.from(new Set(chirashiList.map((item) => item.year))).sort((a, b) => b - a), [chirashiList])
  const filteredList = useMemo(() => {
    const needle = normalizeSearchText(query)
    return chirashiList.filter((item) => {
      const matchesQuery = !needle || normalizeSearchText(item.title).includes(needle)
      const matchesDecade = decade === "all" || Math.floor(item.year / 10) * 10 === Number(decade)
      return matchesQuery && matchesDecade
    })
  }, [chirashiList, query, decade])

  if (loading) return <div className="min-h-screen flex items-center justify-center font-serif">読み込み中...</div>

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <Header chirashiList={chirashiList} page={page} onNavigate={setPage} />
      {page.type !== "detail" && <BrowseControls query={query} onQueryChange={setQuery} decade={decade} onDecadeChange={setDecade} year={year} onYearChange={setYear} years={years} resultCount={filteredList.length} totalCount={chirashiList.length} />}
      <main className="flex-1">
        {page.type === "main" && <MainView chirashiList={filteredList} filterActive={Boolean(query || decade !== "all")} onNavigate={setPage} />}
        {page.type === "tab" && <TabView chirashiList={filteredList} kana={page.kana} pageNum={page.pageNum} onNavigate={setPage} />}
        {page.type === "detail" && <DetailView chirashiList={chirashiList} id={page.id} back={page.back} onNavigate={setPage} />}
      </main>
    </div>
  )
}
