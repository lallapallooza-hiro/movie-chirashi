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
// チラシカードコンポーネント
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
