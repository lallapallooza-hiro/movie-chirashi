import { useState, useRef, useCallback, useEffect, useMemo } from "react"

// ================================================================
// 型定義
// ================================================================

type Orientation = "portrait" | "landscape"  // 縦向き / 横向き

// 折り種類 → 表示するパネル数が変わる
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
  panels: ChirashiPanel[]  // 画像パネル（表面が panels[0]）
  addedAt: string          // 登録日（メイン画面のソートに使用）
  affiliateUrl1?: string
  affiliateUrl2?: string
}

type ChirashiGroup = {
  key: string
  title: string
  representative: Chirashi
  versions: Chirashi[]
}

// グリッド表示用：表面パネルの向きを返す
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

// ページ遷移の状態
type Page =
  | { type: "main" }
  | { type: "tab"; kana: string; pageNum: number }
  | { type: "detail"; id: string; back: Page }

// ================================================================
// サンプルデータ
// ================================================================

// パネルを作るヘルパー（向きごとにURLサイズを自動調整）
function p(url: string, label: string, orientation: Orientation = "portrait"): ChirashiPanel {
  const size = orientation === "landscape" ? "w=560&h=400" : "w=280&h=400"
  const fullUrl = url.includes("?") ? url.replace(/w=\d+&h=\d+/, size) : `${url}?${size}&fit=crop&auto=format`
  return { url: fullUrl, label, orientation }
}

const SAMPLE: Chirashi[] = [
  // ── 縦縦パターン（表:縦 / 裏:縦）──────────────────────────
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
  // ── 縦横パターン（表:縦 / 裏:横）──────────────────────────
  {
    id: "C-002",
    title: "明日へのタンゴ",
    titleKana: "ア",
    year: 1988, genre: "ロマンス", director: "佐藤 美恵", cast: ["木村 太郎", "伊藤 京子"],
    foldType: "bifold",
    panels: [
      p("https://unsplash.com", "表面", "portrait"),  // 縦
      p("https://unsplash.com", "裏面", "landscape"), // 横
      p("https://unsplash.com", "中面A", "portrait"),
      p("https://unsplash.com", "中面B", "portrait"),
    ],
    addedAt: "2024-06-08",
  },
  // ── 横横パターン（表:横 / 裏:横）──────────────────────────
  {
    id: "C-003",
    title: "深海の宴",
    titleKana: "シ",
    year: 1963, genre: "ホラー", director: "渡辺 剛", cast: ["高橋 恵子", "中村 光"],
    foldType: "single",
    panels: [
      p("https://unsplash.com", "表面", "landscape"),
      p("https://unsplash.com?crop=entropy", "裏面", "landscape"),
    ],
    addedAt: "2024-06-07",
  },
  // ── 横縦パターン（表:横 / 裏:縦）──────────────────────────
  {
    id: "C-004",
    title: "遥かなる峠",
    titleKana: "ハ",
    year: 1952, genre: "ドラマ", director: "小林 正道", cast: ["吉田 義男", "松本 千代"],
    foldType: "quadfold",
    panels: [
      p("https://unsplash.com", "表面", "landscape"), // 横
      p("https://unsplash.com?crop=entropy", "裏面", "portrait"), // 縦
      p("https://unsplash.com", "中面A", "portrait"),
      p("https://unsplash.com", "中面B", "portrait"),
      p("https://unsplash.com", "中面C", "portrait"),
      p("https://unsplash.com", "中面D", "portrait"),
    ],
    addedAt: "2024-06-05",
  },
  {
    id: "C-005",
    title: "紅い風の季節",
    titleKana: "ア",
    year: 1971, genre: "ドラマ", director: "加藤 順子", cast: ["前田 誠", "坂本 麻衣"],
    foldType: "single",
    panels: [p("https://unsplash.com", "表面", "portrait")],
    addedAt: "2024-06-04",
  },
  {
    id: "C-006",
    title: "Galaxy Express",
    titleKana: "G",
    year: 1982, genre: "SF", director: "藤田 隆", cast: ["西村 洋介", "林 美穂"],
    foldType: "bifold",
    panels: [
      p("https://unsplash.com", "表面", "landscape"),
      p("https://unsplash.com?crop=entropy", "裏面", "landscape"),
      p("https://unsplash.com", "中面（展開）", "landscape"),
    ],
    addedAt: "2024-06-03",
  },
  {
    id: "C-007",
    title: "笑えない天才",
    titleKana: "ワ",
    year: 1995, genre: "コメディ", director: "石田 幸一", cast: ["岡田 達也", "吉川 恵理"],
    foldType: "trifold",
    panels: [
      p("https://unsplash.com", "表面", "portrait"),
      p("https://unsplash.com?crop=entropy", "裏面", "portrait"),
      p("https://unsplash.com", "中面A", "portrait"),
      p("https://unsplash.com", "中面B", "portrait"),
      p("https://unsplash.com", "中面C", "portrait"),
    ],
    addedAt: "2024-06-02",
  },
  {
    id: "C-008",
    title: "黒い太陽",
    titleKana: "ク",
    year: 1966, genre: "アクション", director: "中島 清二", cast: ["斎藤 武", "田村 静"],
    foldType: "single",
    panels: [
      p("https://unsplash.com", "表面", "portrait"),
      p("https://unsplash.com?crop=entropy", "裏面", "portrait"),
    ],
    addedAt: "2024-05-30",
  },
  {
    id: "C-009",
    title: "東京漂流",
    titleKana: "ト",
    year: 2003, genre: "ドラマ", director: "村田 信一", cast: ["大塚 美里", "小川 健"],
    foldType: "bifold",
    panels: [
      p("https://unsplash.com", "表面", "portrait"),
      p("https://unsplash.com?crop=entropy", "裏面", "portrait"),
      p("https://unsplash.com", "中面A", "portrait"),
      p("https://unsplash.com", "中面B", "portrait"),
    ],
    addedAt: "2024-05-28",
  },
  {
    id: "C-010",
    title: "Midnight Rain",
    titleKana: "M",
    year: 1979, genre: "ロマンス", director: "安田 豊", cast: ["山本 敦子", "清水 隆"],
    foldType: "single",
    panels: [p("https://unsplash.com", "表面", "landscape")],
    addedAt: "2024-05-25",
  },
  {
    id: "C-011",
    title: "真夜中の証人",
    titleKana: "マ",
    year: 1958, genre: "ドラマ", director: "橋本 義雄", cast: ["三浦 源次郎", "川本 葉子"],
    foldType: "single",
    panels: [
      p("https://unsplash.com", "表面", "portrait"),
      p("https://unsplash.com?crop=entropy", "裏面", "portrait"),
    ],
    addedAt: "2024-05-20",
  },
  {
    id: "C-012",
    title: "炎の道場",
    titleKana: "ホ",
    year: 1985, genre: "アクション", director: "黒田 勝男", cast: ["松田 勇二", "大野 さやか"],
    foldType: "bifold",
    panels: [
      p("https://unsplash.com", "表面", "portrait"),
コードは注意してご使用ください。
p("unsplash.com", "裏面", "portrait"),
p("unsplash.com", "中面A", "portrait"),
p("unsplash.com", "中面B", "portrait"),
],
addedAt: "2024-05-18",
},
]
// ================================================================
// 定数
// ================================================================
const ITEMS_PER_PAGE = 20
// ================================================================
// 濁音・半濁音 → 清音に正規化するマップ
// 例: プ→フ、ガ→カ、バ→ハ
// titleKana に「プ」と入力されていても「フ」行に表示される
// ================================================================
const DAKUTEN_MAP: Record<string, string> = {
// ガ行 → カ行
ガ:"カ", ギ:"キ", グ:"ク", ゲ:"ケ", ゴ:"コ",
// ザ行 → サ行
ザ:"サ", ジ:"シ", ズ:"ス", ゼ:"セ", ゾ:"ソ",
// ダ行 → タ行
ダ:"タ", ヂ:"チ", ヅ:"ツ", デ:"テ", ド:"ト",
// バ行 → ハ行
バ:"ハ", ビ:"ヒ", ブ:"フ", ベ:"ヘ", ボ:"ホ",
// パ行（半濁音）→ ハ行
パ:"ハ", ピ:"ヒ", プ:"フ", ペ:"ヘ", ポ:"ホ",
// ヴ → ア行（ウ）
ヴ:"ウ",
}
// titleKana を五十音インデックスの基本文字に変換する
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
// ================================================================
// CSVユーティリティ
// ================================================================
// CSV列の仕様（パネルは最大6面まで対応）
// id, title, titleKana, year, genre, director, cast, foldType, addedAt,
// panel1_url, panel1_label, panel1_orient,
// panel2_url, panel2_label, panel2_orient,
// panel3_url, panel3_label, panel3_orient,
// panel4_url, panel4_label, panel4_orient,
// panel5_url, panel5_label, panel5_orient,
// panel6_url, panel6_label, panel6_orient,
// affiliate_url1, affiliate_url2
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
if (missing.length > 0) return { data: [], errors: [列が不足: ${missing.join(", ")}] }
const idx = (name: string) => headers.indexOf(name)
const data: Chirashi[] = []
for (let i = 1; i < lines.length; i++) {
const cols = parseCsvLine(lines[i])
const year = parseInt(cols[idx("year")])
if (isNaN(year)) { errors.push(${i + 1}行目: yearが数字ではありません); continue }
// パネル列を読み取る（panel1_url〜panel6_url）
const panels: ChirashiPanel[] = []
for (let n = 1; n <= MAX_PANELS; n++) {
const urlCol = idx(panel${n}_url)
const labelCol = idx(panel${n}_label)
const orientCol = idx(panel${n}_orient)
const url = urlCol >= 0 ? (cols[urlCol] || "") : ""
if (!url) break  // URLが空なら以降のパネルはスキップ
const defaultLabels = ["表面", "裏面", "中面A", "中面B", "中面C", "中面D"]
const label = labelCol >= 0 ? (cols[labelCol] || defaultLabels[n - 1]) : defaultLabels[n - 1]
const orient = (orientCol >= 0 ? cols[orientCol] : "") as Orientation
panels.push({ url, label, orientation: orient === "landscape" ? "landscape" : "portrait" })
}
if (panels.length === 0) {
errors.push(${i + 1}行目: panel1_urlが空です（スキップ）)
continue
}
data.push({
id: cols[idx("id")] || ROW-${i},
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
// 横向きは2列分（col-span-2）、高さは縦向きと統一
<div
className={cursor-pointer group ${isLandscape ? "col-span-2" : ""}}
onClick={onClick}
>
<div
className="relative overflow-hidden"
style={{
// 縦向き: 2:3、横向き: 4:3（2列分の幅に合わせた比率）
aspectRatio: isLandscape ? "4/3" : "2/3",
background: "#e8e0d4",
}}
>
{front?.url ? (

) : (

<span className="font-serif text-2xl" style={{ color: "var(--border)" }}>映
<p className="font-serif text-[10px] text-center leading-snug" style={{ color: "var(--muted)" }}>{c.title}

)}
{/* バッジ類 /}

{isLandscape && (
横
)}
{c.foldType !== "single" && (

{FOLD_LABEL[c.foldType]}

)}

{versionCount > 1 && (

<span className="font-mono text-[9px] px-2 py-1 text-white shadow-sm" style={{ background: "var(--accent)" }}>
全{versionCount}種類


)}
{/ パネル枚数バッジ /}
{c.panels.length > 1 && (

<span className="font-mono text-[8px] px-1.5 py-0.5 text-white" style={{ background: "var(--accent)" }}>
{c.panels.length}面


)}
{/ ホバー時タイトル */}

{c.title}



<p className="font-serif text-xs font-semibold leading-snug" style={{ color: "var(--fg)" }}>{c.title}
<p className="font-mono text-[9px] mt-0.5" style={{ color: "var(--muted)" }}>
{c.year}年
{versionCount > 1 ?  · ${versionCount}種類 : ""}



)
}
// ================================================================
// 個別画面のパネル表示
// ================================================================
// ================================================================
// ライトボックス（拡大表示モーダル）
// ================================================================
type LightboxState = { url: string; label: string; orientation: Orientation } | null
const ZOOM_MIN = 0.5
const ZOOM_MAX = 5
const ZOOM_STEP = 0.25
function Lightbox({
state,
title,
affiliateUrl1,
affiliateUrl2,
onClose,
}: {
state: LightboxState
title: string
affiliateUrl1?: string
affiliateUrl2?: string
onClose: () => void
}) {
const [zoom, setZoom] = useState(1)
const [offset, setOffset] = useState({ x: 0, y: 0 })
const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)
const containerRef = useRef(null)
// 開くたびにズーム・位置をリセット
useEffect(() => {
if (state) { setZoom(1); setOffset({ x: 0, y: 0 }) }
}, [state])
// Esc で閉じる、+/- でズーム
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
// スクロール抑止
useEffect(() => {
document.body.style.overflow = state ? "hidden" : ""
return () => { document.body.style.overflow = "" }
}, [state])
// マウスホイールでズーム
const handleWheel = useCallback((e: React.WheelEvent) => {
e.preventDefault()
const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(z + delta).toFixed(2))))
}, [])
// ドラッグで移動（ズーム時のみ有効）
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
// ズームアウトして1倍以下になったら位置リセット
if (next <= 1) setOffset({ x: 0, y: 0 })
return next
})
}
const resetZoom = () => { setZoom(1); setOffset({ x: 0, y: 0 }) }
if (!state) return null
const isLandscape = state.orientation === "landscape";
const isDragging = zoom > 1;
// 安全な1行でURLを生成（Amazonの仕様に完璧に準拠、検索用パスもしっかり組み込み済み）
const amazonUrl = title ? "amazon.co.jp" + encodeURIComponent(title) + "&tag=bqe07751-22" : "";
const mercariUrl = affiliateUrl2?.trim() || "mercari.com" + encodeURIComponent(title + " チラシ");
return (
<div
className="lightbox-modal fixed inset-0 z-50 flex flex-col items-center justify-center"
style={{ background: "rgba(0,0,0,0.92)" }}
onContextMenu={(e) => e.preventDefault()}
>
{/* 上部バー */}
<div className="w-full flex items-center justify-between px-6 py-3 flex-shrink-0"
style={{ background: "rgba(0,0,0,0.4)" }}>

{state.label}

{isLandscape ? "横向き" : "縦向き"}

参照専用
{/* ズームコントロール */}

<button
onClick={() => changeZoom(-ZOOM_STEP)}
disabled={zoom <= ZOOM_MIN}
className="w-8 h-8 font-mono text-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-25 disabled:cursor-default"
>−
{Math.round(zoom * 100)}%
<button
onClick={() => changeZoom(ZOOM_STEP)}
disabled={zoom >= ZOOM_MAX}
className="w-8 h-8 font-mono text-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-25 disabled:cursor-default"
>＋
{/* ズームバー */}
<input
type="range"
min={ZOOM_MIN}
max={ZOOM_MAX}
step={ZOOM_STEP}
value={zoom}
onChange={(e) => {
const next = parseFloat(e.target.value)
setZoom(next)
if (next <= 1) setOffset({ x: 0, y: 0 })
}}
className="w-28 accent-white cursor-pointer"
/>
×

{/* 画像エリア（ホイールズーム・ドラッグ移動） */}
<div
ref={containerRef}
className="flex-1 w-full flex items-center justify-center overflow-hidden"
style={{ cursor: isDragging ? "grab" : "default" }}
onWheel={handleWheel}
onMouseDown={handleMouseDown}
onMouseMove={handleMouseMove}
onMouseUp={handleMouseUp}
onMouseLeave={handleMouseUp}
onClick={(e) => {
if (dragRef.current === null && e.target === e.currentTarget) onClose()
}}
>
<div
style={{
transform: translate(${offset.x}px, ${offset.y}px) scale(${zoom}),
transformOrigin: "center center",
transition: dragRef.current ? "none" : "transform 0.15s ease",
userSelect: "none",
WebkitUserSelect: "none",
}}
onContextMenu={(e) => e.preventDefault()}
>
<img
src={optimizeCloudinaryUrl(state.url)}
alt={state.label}
draggable={false}
style={{
maxWidth: isLandscape ? "80vw" : "50vw",
maxHeight: "75vh",
objectFit: "contain",
display: "block",
pointerEvents: "none",
}}
/>

{/* 関連商品リンク（三項演算子を中括弧 {} で正しく囲って構文エラーを完全修正しました） */}
<div className="w-full border-t border-white/10 px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 flex-shrink-0"
style={{ background: "rgba(0,0,0,0.72)" }}>
{title ? (

Amazonでこの映画をチェック

) : (

Amazonでこの映画をチェック

)}

メルカリ・他でチェック

{/* 下部ヒント */}
<div className="hidden sm:flex w-full py-2 items-center justify-center gap-6 flex-shrink-0"
style={{ background: "rgba(0,0,0,0.4)" }}>
{[
["ホイール", "ズーム"],
["+  /  −", "ズーム"],
["0キー", "リセット"],
["ドラッグ", "移動（拡大時）"],
["Esc", "閉じる"],
].map(([key, desc]) => (

{key} {desc}

))}


)
}
// パネル1枚の表示（向きに応じてサイズが変わる）
function PanelItem({ panel, size = 140, onOpenLightbox }: {
panel: ChirashiPanel
size?: number
onOpenLightbox?: (state: LightboxState) => void
}) {
const isLandscape = panel.orientation === "landscape"
const width = isLandscape ? size * 2 : size
const canExpand = !!panel.url && !!onOpenLightbox
return (

<div
className={overflow-hidden shadow-md relative group ${canExpand ? "cursor-zoom-in" : ""}}
style={{
width: ${width}px,
aspectRatio: isLandscape ? "4/3" : "2/3",
background: "#e8e0d4",
outline: "1px solid var(--border)",
}}
onClick={() => canExpand && onOpenLightbox!({ url: panel.url, label: panel.label, orientation: panel.orientation })}
>
{panel.url ? (
<>

{/* ホバー時に拡大アイコン /}
{canExpand && (
<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
style={{ background: "rgba(0,0,0,0.35)" }}>
⊕

)}
</>
) : (
<div className="w-full h-full flex items-center justify-center font-serif text-2xl" style={{ color: "var(--border)" }}>映
)}

<span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{panel.label}
{/ 向きバッジ */}
<span className="font-mono text-[8px] px-1.5 py-0.5 border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
{panel.orientation === "landscape" ? "横向き" : "縦向き"}


)
}
function PanelDisplay({ c }: { c: Chirashi }) {
const [lightbox, setLightbox] = useState(null)
const frontBack = c.panels.filter((panel) => panel.label === "表面" || panel.label === "裏面")
const insides = c.panels.filter((panel) => panel.label !== "表面" && panel.label !== "裏面")
return (
<>
<Lightbox
state={lightbox}
title={c.title}
affiliateUrl1={c.affiliateUrl1}
affiliateUrl2={c.affiliateUrl2}
onClose={() => setLightbox(null)}
/>
{/* 外面（表面・裏面） */}
{frontBack.length > 0 && (

<p className="font-mono text-[10px] mb-4 tracking-widest" style={{ color: "var(--muted)" }}>
外面
{frontBack.length === 2 && (
<span className="ml-2 px-2 py-0.5 border text-[9px]" style={{ borderColor: "var(--border)" }}>
{frontBack[0].orientation === "portrait" ? "縦" : "横"}
・
{frontBack[1].orientation === "portrait" ? "縦" : "横"}
パターン

)}
<span className="ml-3 text-[9px]" style={{ color: "var(--muted)" }}>画像をクリックで拡大


{frontBack.map((panel) => (

))}


)}
{/* 中面 */}
{insides.length > 0 && (

<p className="font-mono text-[10px] mb-4 tracking-widest" style={{ color: "var(--muted)" }}>
中面（{FOLD_LABEL[c.foldType]}・展開）
画像をクリックで拡大


{insides.map((panel, i) => (

))}


)}

</>
)
}
// ================================================================
// 各コンポーネント
// ================================================================
function Header({
chirashiList,
page,
onNavigate,
}: {
chirashiList: Chirashi[]
page: Page
onNavigate: (p: Page) => void
}) {
return (
{/* タイトル行 */}

<button
onClick={() => onNavigate({ type: "main" })}
className="flex items-center gap-3 hover:opacity-80 transition-opacity"
>
<div className="w-7 h-7 flex items-center justify-center font-serif font-bold" style={{ background: "var(--accent)" }}>映

映画チラシ・コレクション
MOVIE CHIRASHI DATABASE

{/* パンくずリスト */}

<button onClick={() => onNavigate({ type: "main" })} className="hover:text-white transition-colors">メイン
{page.type === "tab" && (
<>/【{page.kana}】</>
)}
{page.type === "detail" && (
<>
{page.back.type === "tab" && (
<>/<button onClick={() => onNavigate(page.back)} className="hover:text-white transition-colors">【{page.back.kana}】</>
)}
/

{chirashiList.find((c) => c.id === page.id)?.title}

</>
)}
{chirashiList.length} 件

{/* 五十音インデックス /}

{/ A–Z / 0–9 /}

A–Z
{ALPHA_INDEX.map((ch) => {
const count = chirashiList.filter((c) => normalizeKana(c.titleKana) === ch).length
return (
<button key={ch} disabled={count === 0}
onClick={() => onNavigate({ type: "tab", kana: ch, pageNum: 1 })}
className={w-6 py-1 font-mono text-[11px] transition-colors text-center ${count === 0 ? "text-white/15 cursor-default" : page.type === "tab" && page.kana === ch ? "text-white bg-white/10 border border-white/30" : "text-white/60 hover:text-white"}}>
{ch}

)
})}
|
0–9
{DIGIT_INDEX.map((ch) => {
const count = chirashiList.filter((c) => normalizeKana(c.titleKana) === ch).length
return (
<button key={ch} disabled={count === 0}
onClick={() => onNavigate({ type: "tab", kana: ch, pageNum: 1 })}
className={w-6 py-1 font-mono text-[11px] transition-colors text-center ${count === 0 ? "text-white/15 cursor-default" : page.type === "tab" && page.kana === ch ? "text-white bg-white/10 border border-white/30" : "text-white/60 hover:text-white"}}>
{ch}

)
})}

{/ 五十音 /}

五十音
{/ メイン（全）ボタン */}
<button
onClick={() => onNavigate({ type: "main" })}
className={px-3 py-1 font-mono text-xs transition-colors ${page.type === "main" ? "text-white bg-white/10 border border-white/30" : "text-white/50 hover:text-white"}}
>
メイン

{KANA_ONLY.map((kana) => {
const count = chirashiList.filter((c) => normalizeKana(c.titleKana) === kana).length
return (
<button key={kana} disabled={count === 0}
onClick={() => onNavigate({ type: "tab", kana, pageNum: 1 })}
className={px-2 py-1 font-serif text-xs transition-colors ${count === 0 ? "text-white/15 cursor-default" : page.type === "tab" && page.kana === kana ? "text-white bg-white/10 border border-white/30" : "text-white/60 hover:text-white"}}>
{kana}

)
})}



)
}
// ================================================================
// 検索・年代フィルター
// ================================================================
function BrowseControls({
query,
onQueryChange,
decade,
onDecadeChange,
year,
onYearChange,
years,
resultCount,
totalCount,
}: {
query: string
onQueryChange: (value: string) => void
decade: string
onDecadeChange: (value: string) => void
year: string
onYearChange: (value: string) => void
years: number[]
resultCount: number
totalCount: number
}) {
const decades = Array.from(new Set(years.map((value) => Math.floor(value / 10) * 10))).sort((a, b) => b - a)
const visibleYears = decade === "all"
? years
: years.filter((value) => Math.floor(value / 10) * 10 === Number(decade))
const hasFilter = query.trim() || decade !== "all" || year !== "all"
return (
<span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
<strong className="text-sm" style={{ color: "var(--fg)" }}>{resultCount} / {totalCount}件

{hasFilter && (
<button
onClick={() => {
onQueryChange("")
onDecadeChange("all")
onYearChange("all")
}}
className="font-mono text-[10px] underline underline-offset-4 hover:opacity-60"
style={{ color: "var(--accent)" }}
>
条件をクリア

)}



)
}
function Pagination({ pageNum, totalPages, onChange }: {
pageNum: number
totalPages: number
onChange: (page: number) => void
}) {
if (totalPages <= 1) return null
return (

<button
onClick={() => onChange(pageNum - 1)}
disabled={pageNum === 1}
className="border px-4 py-2 font-mono text-xs transition-colors hover:bg-[#1a1410] hover:text-white disabled:cursor-default disabled:opacity-30"
style={{ borderColor: "var(--border)" }}
>
← 前へ

<span className="min-w-24 text-center font-mono text-xs" style={{ color: "var(--muted)" }}>
{pageNum} / {totalPages}

<button
onClick={() => onChange(pageNum + 1)}
disabled={pageNum === totalPages}
className="border px-4 py-2 font-mono text-xs transition-colors hover:bg-[#1a1410] hover:text-white disabled:cursor-default disabled:opacity-30"
style={{ borderColor: "var(--border)" }}
>
次へ →


)
}
// ================================================================
// メイン画面（通常時は登録日の最新1日、検索時は該当作品）
// ================================================================
function MainView({
chirashiList,
filterActive,
filterKey,
onNavigate,
}: {
chirashiList: Chirashi[]
filterActive: boolean
filterKey: string
onNavigate: (p: Page) => void
}) {
const [pageNum, setPageNum] = useState(1)
useEffect(() => setPageNum(1), [filterKey])
const latestItem = [...chirashiList]
.filter((item) => dateValue(item.addedAt) > 0)
.sort((a, b) => dateValue(b.addedAt) - dateValue(a.addedAt))[0]
const latestDate = latestItem?.addedAt ?? ""
const latestDateValue = dateValue(latestDate)
const visibleItems = filterActive
? chirashiList
: latestDate
? chirashiList.filter((item) => dateValue(item.addedAt) === latestDateValue)
: []
const groups = groupChirashi(visibleItems)
const totalPages = Math.max(1, Math.ceil(groups.length / ITEMS_PER_PAGE))
const safePage = Math.min(pageNum, totalPages)
const pageGroups = groups.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)
return (


{filterActive ? "検索結果" : "最新登録チラシ"}
<span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
{filterActive
? ${groups.length}作品 · 製作年・公開年の新しい順
: latestDate
? ${formatDate(latestDate)}に登録 · ${groups.length}作品
: "addedAtが入力された作品はまだありません"}

{groups.length === 0 ? (
<div className="flex min-h-64 flex-col items-center justify-center gap-3 border border-dashed px-6 text-center" style={{ borderColor: "var(--border)" }}>
<div className="font-serif text-4xl" style={{ color: "var(--border)" }}>無
<p className="text-sm" style={{ color: "var(--muted)" }}>
{filterActive
? "条件に一致する作品がありません"
: "最新表示にはCSVのaddedAt列へ登録日（例: 2026-03-08）を入力してください"}


) : (
<>
<div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
{pageGroups.map((group) => (
<ChirashiCard
key={group.key}
c={group.representative}
versionCount={group.versions.length}
onClick={() => onNavigate({ type: "detail", id: group.representative.id, back: { type: "main" } })}
/>
))}


</>
)}

)
}
// ================================================================
// タブ画面（かな別 / ページネーション）
// ================================================================
function TabView({
chirashiList,
kana,
pageNum,
onNavigate,
}: {
chirashiList: Chirashi[]
kana: string
pageNum: number
onNavigate: (p: Page) => void
}) {
const items = chirashiList.filter((c) => normalizeKana(c.titleKana) === kana)
const groups = groupChirashi(items)
const totalPages = Math.max(1, Math.ceil(groups.length / ITEMS_PER_PAGE))
const safePage = Math.min(pageNum, totalPages)
const pageGroups = groups.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)
return (


【{kana}】のチラシ
<span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
{groups.length}作品 · {items.length}種類 · {safePage}/{totalPages}ページ

{items.length === 0 ? (

<div className="font-serif text-5xl" style={{ color: "var(--border)" }}>無
<p className="text-sm" style={{ color: "var(--muted)" }}>該当するチラシがありません

) : (
<>
<div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
{pageGroups.map((group) => (
<ChirashiCard
key={group.key}
c={group.representative}
versionCount={group.versions.length}
onClick={() => onNavigate({ type: "detail", id: group.representative.id, back: { type: "tab", kana, pageNum: safePage } })}
/>
))}

<Pagination
pageNum={safePage}
totalPages={totalPages}
onChange={(nextPage) => onNavigate({ type: "tab", kana, pageNum: nextPage })}
/>
</>
)}

)
}
// ================================================================
// 個別画面
// ================================================================
function DetailView({
chirashiList,
id,
back,
onNavigate,
}: {
chirashiList: Chirashi[]
id: string
back: Page
onNavigate: (p: Page) => void
}) {
const selected = chirashiList.find((item) => item.id === id)
const versions = useMemo(
() => selected
? chirashiList
.filter((item) => item.title === selected.title && item.year === selected.year)
.sort((a, b) => dateValue(b.addedAt) - dateValue(a.addedAt) || japaneseCollator.compare(b.id, a.id))
: [],
[chirashiList, selected?.title, selected?.year],
)
const [activeId, setActiveId] = useState(id)
useEffect(() => setActiveId(id), [id])
const c = versions.find((item) => item.id === activeId) ?? selected
if (!c) return (

<p style={{ color: "var(--muted)" }}>チラシが見つかりませんでした
<button onClick={() => onNavigate(back)} className="mt-4 font-mono text-xs underline" style={{ color: "var(--accent)" }}>戻る

)
return (

{/* 戻るボタン */}
<button
onClick={() => onNavigate(back)}
className="font-mono text-[10px] mb-6 flex items-center gap-2 hover:opacity-60 transition-opacity"
style={{ color: "var(--muted)" }}
>
← {back.type === "main" ? "メインに戻る" : 【${(back as { type: "tab"; kana: string; pageNum: number }).kana}】に戻る}
{/* タイトル・基本情報 */}

<div className="font-mono text-[10px] mb-1 flex items-center gap-2" style={{ color: "var(--muted)" }}>
{c.id}
·
表面: {frontOrientation(c) === "landscape" ? "横向き" : "縦向き"}
·
{FOLD_LABEL[c.foldType]}
·
{c.panels.length}面
{versions.length > 1 && (
<>
·
全{versions.length}種類
</>
)}

{c.title}

<span className="font-mono text-[10px] mr-1.5" style={{ color: "var(--muted)" }}>製作年・公開年{c.year}年
<span className="font-mono text-[10px] mr-1.5" style={{ color: "var(--muted)" }}>監督{c.director}
<span className="font-mono text-[10px] mr-1.5" style={{ color: "var(--muted)" }}>出演{c.cast.join("、")}

{versions.length > 1 && (
<div className="mb-8 border-y py-4" style={{ borderColor: "var(--border)" }}>

<p className="font-mono text-[10px] tracking-widest" style={{ color: "var(--muted)" }}>
チラシの種類を切り替える

<span className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>
{versions.findIndex((item) => item.id === c.id) + 1} / {versions.length}



{versions.map((version, index) => (
<button
key={version.id}
onClick={() => setActiveId(version.id)}
className="min-w-32 flex-shrink-0 border px-3 py-2.5 text-left transition-colors"
style={{
borderColor: version.id === c.id ? "var(--fg)" : "var(--border)",
background: version.id === c.id ? "var(--fg)" : "var(--card-bg)",
color: version.id === c.id ? "white" : "var(--fg)",
}}
>
種類 {index + 1}

{version.id}{version.addedAt ?  · ${version.addedAt} : ""}


{version.panels.length}面 · {FOLD_LABEL[version.foldType]}


))}


)}
{/* 画像パネル表示 */}
<div className="border-t pt-8" style={{ borderColor: "var(--border)" }}>

{/* 前後のチラシへのナビ */}
{back.type === "tab" && (() => {
const siblings = groupChirashi(
chirashiList.filter((item) => normalizeKana(item.titleKana) === back.kana)
)
const idx = siblings.findIndex(
(group) => group.title === c.title && group.representative.year === c.year
)
const prev = siblings[idx - 1]?.representative
const next = siblings[idx + 1]?.representative
return (
<div className="flex justify-between mt-12 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
{prev ? (
<button onClick={() => onNavigate({ type: "detail", id: prev.id, back })}
className="text-left group">
<p className="font-mono text-[9px] mb-1" style={{ color: "var(--muted)" }}>← 前の作品
{prev.title}

) : }
{next ? (
<button onClick={() => onNavigate({ type: "detail", id: next.id, back })}
className="text-right group">
<p className="font-mono text-[9px] mb-1" style={{ color: "var(--muted)" }}>次の作品 →
{next.title}

) : }

)
})()}

)
}
// ================================================================
// アプリ本体
// ================================================================
// ================================================================
// マスターデータの読み込み
// ================================================================
// データの管理方法：
//   public/chirashi-data.csv を編集して GitHub にプッシュするだけで
//   Vercel が自動的に再デプロイし、世界中の誰でも最新データを見られる。
// ================================================================
export default function App() {
const [chirashiList, setChirashiList] = useState<Chirashi[]>([])
const [loading, setLoading] = useState(true)
const [loadError, setLoadError] = useState<string | null>(null)
const [page, setPage] = useState({ type: "main" })
const [query, setQuery] = useState("")
const [decade, setDecade] = useState("all")
const [year, setYear] = useState("all")
// 起動時に public/chirashi-data.csv を読み込む
useEffect(() => {
fetch("/chirashi-data.csv")
.then((res) => {
if (!res.ok) throw new Error(HTTP ${res.status})
return res.text()
})
.then((text) => {
const { data, errors } = parseCsv(text)
if (data.length > 0) {
setChirashiList(data)
} else {
// CSVが空またはパース失敗 → サンプルで代替
setChirashiList(SAMPLE)
if (errors.length > 0) setLoadError(errors[0])
}
})
.catch(() => {
// ファイルが見つからない場合はサンプルデータを使用
setChirashiList(SAMPLE)
})
.finally(() => setLoading(false))
}, [])
const navigate = (p: Page) => {
setPage(p)
window.scrollTo({ top: 0, behavior: "smooth" })
}
const years = useMemo(
() => Array.from(new Set(chirashiList.map((item) => item.year))).sort((a, b) => b - a),
[chirashiList],
)
const filteredList = useMemo(() => {
const needle = normalizeSearchText(query)
return chirashiList.filter((item) => {
const matchesQuery = !needle || normalizeSearchText([
item.title,
item.titleKana,
item.director,
...item.cast,
].join(" ")).includes(needle)
const matchesYear = year !== "all"
? item.year === Number(year)
: decade === "all" || Math.floor(item.year / 10) * 10 === Number(decade)
return matchesQuery && matchesYear
})
}, [chirashiList, query, decade, year])
const filterActive = Boolean(query.trim() || decade !== "all" || year !== "all")
const filterKey = ${query}\u0000${decade}\u0000${year}
const updateQuery = (value: string) => {
setQuery(value)
setPage({ type: "main" })
}
const updateDecade = (value: string) => {
setDecade(value)
setYear("all")
setPage({ type: "main" })
}
const updateYear = (value: string) => {
setYear(value)
setPage({ type: "main" })
}
// 読み込み中
if (loading) return (
<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>

<div className="font-serif text-4xl mb-4" style={{ color: "var(--border)" }}>映
<p className="font-mono text-xs" style={{ color: "var(--muted)" }}>データを読み込んでいます...


)
return (
<div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
{/* CSVロードエラー通知 */}
{loadError && (
<div className="px-6 py-2 font-mono text-[10px]" style={{ background: "#fff3cd", color: "#856404" }}>
⚠ chirashi-data.csv の読み込みに問題があります: {loadError}（サンプルデータを表示中）

)}
{page.type !== "detail" && (

)}
{page.type === "main" && (

)}
{page.type === "tab" && (

)}
{page.type === "detail" && (

)}
<footer className="border-t px-6 py-2 flex items-center text-[10px] font-mono" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
映画チラシ・コレクション
·
登録数: {chirashiList.length}件
·
<span style={{ color: "var(--muted)" }}>データ: chirashi-data.csv
© 2026


)
}
