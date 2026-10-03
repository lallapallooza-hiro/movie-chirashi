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
}

type ChirashiGroup = {
  title: string
  representative: Chirashi
  versions: Chirashi[]
}

// グリッド表示用：表面パネルの向きを返す
function frontOrientation(c: Chirashi): Orientation {
  return c.panels[0]?.orientation ?? "portrait"
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
    const versions = groups.get(item.title)
    if (versions) versions.push(item)
    else groups.set(item.title, [item])
  }

  return Array.from(groups, ([title, versions]) => {
    const sortedVersions = [...versions].sort((a, b) =>
      dateValue(b.addedAt) - dateValue(a.addedAt) || japaneseCollator.compare(b.id, a.id)
    )
    return { title, versions: sortedVersions, representative: sortedVersions[0] }
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
    .replace(/\s+/g, "")
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
      p("https://images.unsplash.com/photo-1769265095585-44764352cb77", "表面", "portrait"),
      p("https://images.unsplash.com/photo-1769265095585-44764352cb77?crop=entropy", "裏面", "portrait"),
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
      p("https://images.unsplash.com/photo-1689045170733-bec91f0812a0", "表面", "portrait"),  // 縦
      p("https://images.unsplash.com/photo-1704721211126-f67684d8e0c9", "裏面", "landscape"), // 横
      p("https://images.unsplash.com/photo-1678694176437-a71b3feaf895", "中面A", "portrait"),
      p("https://images.unsplash.com/photo-1580940843810-6ac02e96a2eb", "中面B", "portrait"),
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
      p("https://images.unsplash.com/photo-1704721211126-f67684d8e0c9", "表面", "landscape"),
      p("https://images.unsplash.com/photo-1704721211126-f67684d8e0c9?crop=entropy", "裏面", "landscape"),
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
      p("https://images.unsplash.com/photo-1678694176437-a71b3feaf895", "表面", "landscape"), // 横
      p("https://images.unsplash.com/photo-1678694176437-a71b3feaf895?crop=entropy", "裏面", "portrait"), // 縦
      p("https://images.unsplash.com/photo-1580940843810-6ac02e96a2eb", "中面A", "portrait"),
      p("https://images.unsplash.com/photo-1769321309399-38d9eda18370", "中面B", "portrait"),
      p("https://images.unsplash.com/photo-1585667055741-7a94f3397509", "中面C", "portrait"),
      p("https://images.unsplash.com/photo-1602421311752-e3b1a31b4384", "中面D", "portrait"),
    ],
    addedAt: "2024-06-05",
  },
  {
    id: "C-005",
    title: "紅い風の季節",
    titleKana: "ア",
    year: 1971, genre: "ドラマ", director: "加藤 順子", cast: ["前田 誠", "坂本 麻衣"],
    foldType: "single",
    panels: [p("https://images.unsplash.com/photo-1580940843810-6ac02e96a2eb", "表面", "portrait")],
    addedAt: "2024-06-04",
  },
  {
    id: "C-006",
    title: "Galaxy Express",
    titleKana: "G",
    year: 1982, genre: "SF", director: "藤田 隆", cast: ["西村 洋介", "林 美穂"],
    foldType: "bifold",
    panels: [
      p("https://images.unsplash.com/photo-1769321309399-38d9eda18370", "表面", "landscape"),
      p("https://images.unsplash.com/photo-1769321309399-38d9eda18370?crop=entropy", "裏面", "landscape"),
      p("https://images.unsplash.com/photo-1532680678473-a16f2cda8e43", "中面（展開）", "landscape"),
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
      p("https://images.unsplash.com/photo-1585667055741-7a94f3397509", "表面", "portrait"),
      p("https://images.unsplash.com/photo-1585667055741-7a94f3397509?crop=entropy", "裏面", "portrait"),
      p("https://images.unsplash.com/photo-1602421311752-e3b1a31b4384", "中面A", "portrait"),
      p("https://images.unsplash.com/photo-1706955306571-4d990815d549", "中面B", "portrait"),
      p("https://images.unsplash.com/photo-1569793667639-dae11573b34f", "中面C", "portrait"),
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
      p("https://images.unsplash.com/photo-1602421311752-e3b1a31b4384", "表面", "portrait"),
      p("https://images.unsplash.com/photo-1602421311752-e3b1a31b4384?crop=entropy", "裏面", "portrait"),
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
      p("https://images.unsplash.com/photo-1706955306571-4d990815d549", "表面", "portrait"),
      p("https://images.unsplash.com/photo-1706955306571-4d990815d549?crop=entropy", "裏面", "portrait"),
      p("https://images.unsplash.com/photo-1784034292926-c4bb77283a0e", "中面A", "portrait"),
      p("https://images.unsplash.com/photo-1771517358779-b2f515da1894", "中面B", "portrait"),
    ],
    addedAt: "2024-05-28",
  },
  {
    id: "C-010",
    title: "Midnight Rain",
    titleKana: "M",
    year: 1979, genre: "ロマンス", director: "安田 豊", cast: ["山本 敦子", "清水 隆"],
    foldType: "single",
    panels: [p("https://images.unsplash.com/photo-1569793667639-dae11573b34f", "表面", "landscape")],
    addedAt: "2024-05-25",
  },
  {
    id: "C-011",
    title: "真夜中の証人",
    titleKana: "マ",
    year: 1958, genre: "ドラマ", director: "橋本 義雄", cast: ["三浦 源次郎", "川本 葉子"],
    foldType: "single",
    panels: [
      p("https://images.unsplash.com/photo-1771517358779-b2f515da1894", "表面", "portrait"),
      p("https://images.unsplash.com/photo-1771517358779-b2f515da1894?crop=entropy", "裏面", "portrait"),
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
      p("https://images.unsplash.com/photo-1784034292926-c4bb77283a0e", "表面", "portrait"),
      p("https://images.unsplash.com/photo-1784034292926-c4bb77283a0e?crop=entropy", "裏面", "portrait"),
      p("https://images.unsplash.com/photo-1497604401993-f2e922e5cb0a", "中面A", "portrait"),
      p("https://images.unsplash.com/photo-1463130456064-77fda7f96d6b", "中面B", "portrait"),
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
// panel6_url, panel6_label, panel6_orient

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

    // パネル列を読み取る（panel1_url〜panel6_url）
    const panels: ChirashiPanel[] = []
    for (let n = 1; n <= MAX_PANELS; n++) {
      const urlCol = idx(`panel${n}_url`)
      const labelCol = idx(`panel${n}_label`)
      const orientCol = idx(`panel${n}_orient`)
      const url = urlCol >= 0 ? (cols[urlCol] || "") : ""
      if (!url) break  // URLが空なら以降のパネルはスキップ
      const defaultLabels = ["表面", "裏面", "中面A", "中面B", "中面C", "中面D"]
      const label = labelCol >= 0 ? (cols[labelCol] || defaultLabels[n - 1]) : defaultLabels[n - 1]
      const orient = (orientCol >= 0 ? cols[orientCol] : "") as Orientation
      panels.push({ url, label, orientation: orient === "landscape" ? "landscape" : "portrait" })
    }
    if (panels.length === 0) {
      errors.push(`${i + 1}行目: panel1_urlが空です（スキップ）`)
      continue
    }

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
    })
  }
  return { data, errors }
}

function downloadTemplate() {
  const header = [
    "id", "title", "titleKana", "year", "genre", "director", "cast", "foldType", "addedAt",
    "panel1_url", "panel1_label", "panel1_orient",
    "panel2_url", "panel2_label", "panel2_orient",
    "panel3_url", "panel3_label", "panel3_orient",
    "panel4_url", "panel4_label", "panel4_orient",
  ].join(",")
  const rows = [
    header,
    // 縦縦（表:portrait / 裏:portrait）
    "C-001,夜霧の追跡者,ヤ,1974,アクション,鈴木 一郎,田中 健/山田 花子,single,2024-06-10,https://example.com/front.jpg,表面,portrait,https://example.com/back.jpg,裏面,portrait,,,,",
    // 縦横（表:portrait / 裏:landscape）
    "C-002,明日へのタンゴ,ア,1988,ロマンス,佐藤 美恵,木村 太郎/伊藤 京子,bifold,2024-06-08,https://example.com/front.jpg,表面,portrait,https://example.com/back.jpg,裏面,landscape,https://example.com/inside1.jpg,中面A,portrait,https://example.com/inside2.jpg,中面B,portrait",
    // 横横（表:landscape / 裏:landscape）
    "C-003,深海の宴,シ,1963,ホラー,渡辺 剛,高橋 恵子/中村 光,single,2024-06-07,https://example.com/front.jpg,表面,landscape,https://example.com/back.jpg,裏面,landscape,,,,",
    // 横縦（表:landscape / 裏:portrait）
    "C-004,遥かなる峠,ハ,1952,ドラマ,小林 正道,吉田 義男,single,2024-06-05,https://example.com/front.jpg,表面,landscape,https://example.com/back.jpg,裏面,portrait,,,,",
  ]
  const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = "chirashi_template.csv"
  a.click()
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
      className={`cursor-pointer group ${isLandscape ? "col-span-2" : ""}`}
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
          <img
            src={front.url}
            alt={c.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
            <span className="font-serif text-2xl" style={{ color: "var(--border)" }}>映</span>
            <p className="font-serif text-[10px] text-center leading-snug" style={{ color: "var(--muted)" }}>{c.title}</p>
          </div>
        )}
        {/* バッジ類 */}
        <div className="absolute top-1.5 left-1.5 flex gap-1">
          {isLandscape && (
            <span className="font-mono text-[8px] px-1 py-0.5 bg-black/60 text-white">横</span>
          )}
          {c.foldType !== "single" && (
            <span className="font-mono text-[8px] px-1 py-0.5 bg-black/60 text-white">
              {FOLD_LABEL[c.foldType]}
            </span>
          )}
        </div>
        {versionCount > 1 && (
          <div className="absolute top-1.5 right-1.5">
            <span className="font-mono text-[9px] px-2 py-1 text-white shadow-sm" style={{ background: "var(--accent)" }}>
              全{versionCount}種類
            </span>
          </div>
        )}
        {/* パネル枚数バッジ */}
        {c.panels.length > 1 && (
          <div className="absolute bottom-1.5 right-1.5">
            <span className="font-mono text-[8px] px-1.5 py-0.5 text-white" style={{ background: "var(--accent)" }}>
              {c.panels.length}面
            </span>
          </div>
        )}
        {/* ホバー時タイトル */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
          <p className="font-serif text-[10px] text-white font-bold leading-tight">{c.title}</p>
        </div>
      </div>
      <div className="mt-2">
        <p className="font-serif text-xs font-semibold leading-snug" style={{ color: "var(--fg)" }}>{c.title}</p>
        <p className="font-mono text-[9px] mt-0.5" style={{ color: "var(--muted)" }}>
          {c.year}年{c.genre ? ` · ${c.genre}` : ""}
          {versionCount > 1 ? ` · ${versionCount}種類` : ""}
        </p>
      </div>
    </div>
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

function Lightbox({ state, onClose }: { state: LightboxState; onClose: () => void }) {
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const isLandscape = state.orientation === "landscape"
  const isDragging = zoom > 1

  return (
    <div
      className="lightbox-modal fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 上部バー */}
      <div className="w-full flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.4)" }}>
        <div className="flex items-center gap-3">
          <span className="font-serif text-white text-sm font-semibold">{state.label}</span>
          <span className="font-mono text-[10px] px-2 py-0.5 border border-white/20 text-white/40">
            {isLandscape ? "横向き" : "縦向き"}
          </span>
          <span className="font-mono text-[10px] text-white/25">参照専用</span>
        </div>

        {/* ズームコントロール */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeZoom(-ZOOM_STEP)}
            disabled={zoom <= ZOOM_MIN}
            className="w-8 h-8 font-mono text-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-25 disabled:cursor-default"
          >−</button>

          <button
            onClick={resetZoom}
            className="font-mono text-xs px-3 h-8 text-white/70 hover:text-white hover:bg-white/10 transition-colors min-w-[4rem]"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={() => changeZoom(ZOOM_STEP)}
            disabled={zoom >= ZOOM_MAX}
            className="w-8 h-8 font-mono text-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-25 disabled:cursor-default"
          >＋</button>

          <div className="w-px h-5 mx-2 bg-white/20" />

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

          <div className="w-px h-5 mx-2 bg-white/20" />

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white font-mono text-xl leading-none transition-colors"
          >×</button>
        </div>
      </div>

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
          // ドラッグ後の誤クリックを無視、背景クリックで閉じる
          if (dragRef.current === null && e.target === e.currentTarget) onClose()
        }}
      >
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: dragRef.current ? "none" : "transform 0.15s ease",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <img
            src={state.url}
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
        </div>
      </div>

      {/* 下部ヒント */}
      <div className="w-full py-2 flex items-center justify-center gap-6 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.4)" }}>
        {[
          ["ホイール", "ズーム"],
          ["+  /  −", "ズーム"],
          ["0キー", "リセット"],
          ["ドラッグ", "移動（拡大時）"],
          ["Esc", "閉じる"],
        ].map(([key, desc]) => (
          <span key={key} className="font-mono text-[10px] text-white/30">
            <span className="text-white/50">{key}</span> {desc}
          </span>
        ))}
      </div>
    </div>
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
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <div
        className={`overflow-hidden shadow-md relative group ${canExpand ? "cursor-zoom-in" : ""}`}
        style={{
          width: `${width}px`,
          aspectRatio: isLandscape ? "4/3" : "2/3",
          background: "#e8e0d4",
          outline: "1px solid var(--border)",
        }}
        onClick={() => canExpand && onOpenLightbox!({ url: panel.url, label: panel.label, orientation: panel.orientation })}
      >
        {panel.url ? (
          <>
            <img src={panel.url} alt={panel.label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            {/* ホバー時に拡大アイコン */}
            {canExpand && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: "rgba(0,0,0,0.35)" }}>
                <span className="text-white text-2xl font-mono">⊕</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center font-serif text-2xl" style={{ color: "var(--border)" }}>映</div>
        )}
      </div>
      <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>{panel.label}</span>
      {/* 向きバッジ */}
      <span className="font-mono text-[8px] px-1.5 py-0.5 border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
        {panel.orientation === "landscape" ? "横向き" : "縦向き"}
      </span>
    </div>
  )
}

function PanelDisplay({ c }: { c: Chirashi }) {
  const [lightbox, setLightbox] = useState<LightboxState>(null)
  const frontBack = c.panels.filter((panel) => panel.label === "表面" || panel.label === "裏面")
  const insides = c.panels.filter((panel) => panel.label !== "表面" && panel.label !== "裏面")

  return (
    <>
      <Lightbox state={lightbox} onClose={() => setLightbox(null)} />

      <div className="space-y-8">
        {/* 外面（表面・裏面） */}
        {frontBack.length > 0 && (
          <div>
            <p className="font-mono text-[10px] mb-4 tracking-widest" style={{ color: "var(--muted)" }}>
              外面
              {frontBack.length === 2 && (
                <span className="ml-2 px-2 py-0.5 border text-[9px]" style={{ borderColor: "var(--border)" }}>
                  {frontBack[0].orientation === "portrait" ? "縦" : "横"}
                  ・
                  {frontBack[1].orientation === "portrait" ? "縦" : "横"}
                  パターン
                </span>
              )}
              <span className="ml-3 text-[9px]" style={{ color: "var(--muted)" }}>画像をクリックで拡大</span>
            </p>
            <div className="flex gap-6 flex-wrap items-start">
              {frontBack.map((panel) => (
                <PanelItem key={panel.label} panel={panel} size={140} onOpenLightbox={setLightbox} />
              ))}
            </div>
          </div>
        )}

        {/* 中面 */}
        {insides.length > 0 && (
          <div>
            <p className="font-mono text-[10px] mb-4 tracking-widest" style={{ color: "var(--muted)" }}>
              中面（{FOLD_LABEL[c.foldType]}・展開）
              <span className="ml-3 text-[9px]">画像をクリックで拡大</span>
            </p>
            <div className="flex gap-px items-start flex-wrap">
              {insides.map((panel, i) => (
                <PanelItem key={i} panel={panel} size={120} onOpenLightbox={setLightbox} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ================================================================
// ヘッダーコンポーネント
// ================================================================

function Header({
  chirashiList,
  page,
  onNavigate,
  onCsvImport,
  showImportPanel,
  setShowImportPanel,
}: {
  chirashiList: Chirashi[]
  page: Page
  onNavigate: (p: Page) => void
  onCsvImport: (incoming: Chirashi[], mode: "append" | "overwrite") => void
  showImportPanel: boolean
  setShowImportPanel: (v: boolean) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [importMode, setImportMode] = useState<"append" | "overwrite">("append")
  const [pendingData, setPendingData] = useState<Chirashi[] | null>(null)  // 確認待ちデータ
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) { setImportErrors(["CSVファイルを選択してください"]); return }
    setPendingData(null)
    setImportErrors([])
    setImportSuccess(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const { data, errors } = parseCsv(e.target?.result as string)
      setImportErrors(errors)
      if (data.length > 0) setPendingData(data)  // 確認ステップへ
    }
    reader.readAsText(file, "UTF-8")
  }, [])

  const confirmImport = () => {
    if (!pendingData) return
    onCsvImport(pendingData, importMode)
    const verb = importMode === "append" ? "追加" : "上書き"
    setImportSuccess(`${pendingData.length}件を${verb}しました`)
    setPendingData(null)
    setShowImportPanel(false)
  }

  return (
    <header style={{ background: "var(--header-bg)" }} className="text-white flex-shrink-0">
      {/* タイトル行 */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-white/10">
        <button
          onClick={() => onNavigate({ type: "main" })}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 flex items-center justify-center font-serif font-bold" style={{ background: "var(--accent)" }}>映</div>
          <div>
            <div className="font-serif text-base font-bold tracking-wider leading-none">映画チラシ・コレクション</div>
            <div className="font-mono text-[9px] text-white/40 mt-0.5">MOVIE CHIRASHI DATABASE</div>
          </div>
        </button>

        {/* パンくずリスト */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-white/40">
          <button onClick={() => onNavigate({ type: "main" })} className="hover:text-white transition-colors">メイン</button>
          {page.type === "tab" && (
            <><span>/</span><span className="text-white">【{page.kana}】</span></>
          )}
          {page.type === "detail" && (
            <>
              {page.back.type === "tab" && (
                <><span>/</span><button onClick={() => onNavigate(page.back)} className="hover:text-white transition-colors">【{page.back.kana}】</button></>
              )}
              <span>/</span>
              <span className="text-white truncate max-w-[120px]">
                {chirashiList.find((c) => c.id === page.id)?.title}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-white/40">
            <span className="text-white font-bold">{chirashiList.length}</span> 件
          </span>
          <button
            onClick={() => { setShowImportPanel(!showImportPanel); setImportErrors([]); setImportSuccess(null) }}
            className="text-xs px-3 py-2 border border-white/20 hover:border-white/50 transition-colors"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
          >
            📂 CSV
          </button>
        </div>
      </div>

      {/* CSVインポートパネル */}
      {showImportPanel && (
        <div className="px-6 py-4 border-b border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="flex flex-col gap-4 max-w-2xl">

            {/* ① 追加 / 上書き モード選択 */}
            <div className="flex gap-2">
              {(["append", "overwrite"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setImportMode(mode); setPendingData(null); setImportSuccess(null) }}
                  className="flex-1 py-2.5 text-xs border transition-colors text-left px-4"
                  style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    borderColor: importMode === mode ? "white" : "rgba(255,255,255,0.2)",
                    background: importMode === mode ? "rgba(255,255,255,0.08)" : "transparent",
                    color: importMode === mode ? "white" : "rgba(255,255,255,0.5)",
                  }}
                >
                  <span className="font-bold mr-2">
                    {mode === "append" ? "📥 追加（アペンド）" : "🔄 上書き（リセット）"}
                  </span>
                  <span className="font-mono text-[10px] block mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {mode === "append"
                      ? `既存 ${chirashiList.length}件を残して新しいデータを末尾に追加。同じIDは上書き。`
                      : "既存データをすべて削除し、新しいCSVの内容だけにする。"}
                  </span>
                </button>
              ))}
            </div>

            {/* ② ドロップゾーン */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed cursor-pointer flex items-center justify-center gap-4 py-5 transition-colors"
              style={{ borderColor: isDragging ? "var(--accent)" : "rgba(255,255,255,0.2)" }}
            >
              <span className="text-2xl">📄</span>
              <div>
                <p className="text-sm" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                  CSVファイルをドロップ、またはクリックして選択
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); downloadTemplate() }}
                  className="font-mono text-[10px] mt-1 hover:underline"
                  style={{ color: "#7ec8e3" }}
                >
                  ⬇ テンプレートをダウンロード
                </button>
              </div>
              <input
                ref={fileInputRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }}
              />
            </div>

            {/* ③ 確認ステップ（ファイル読み込み後に表示） */}
            {pendingData && (
              <div className="border p-4 flex items-center justify-between gap-4"
                style={{ borderColor: "rgba(255,200,0,0.4)", background: "rgba(255,200,0,0.06)" }}>
                <div>
                  <p className="text-sm font-bold" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                    {pendingData.length}件のデータを読み込みました
                  </p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {importMode === "append"
                      ? `既存 ${chirashiList.length}件 ＋ 新規 ${pendingData.length}件（同IDは上書き）→ 確定後に反映`
                      : `既存 ${chirashiList.length}件 → 削除し、新規 ${pendingData.length}件のみに置き換え`}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setPendingData(null); setImportErrors([]) }}
                    className="font-mono text-xs px-3 py-2 border border-white/20 hover:border-white/40 transition-colors text-white/50"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={confirmImport}
                    className="font-mono text-xs px-4 py-2 text-white transition-colors"
                    style={{ background: importMode === "append" ? "#2563eb" : "var(--accent)" }}
                  >
                    {importMode === "append" ? "追加する" : "上書きする"}
                  </button>
                </div>
              </div>
            )}

            {/* エラー・成功メッセージ */}
            {importErrors.map((err, i) => (
              <p key={i} className="font-mono text-[10px] text-red-300">{err}</p>
            ))}
            {importSuccess && (
              <p className="font-mono text-[10px] text-green-300">✓ {importSuccess}</p>
            )}
          </div>
        </div>
      )}

      {/* 五十音インデックス */}
      <div className="border-b border-white/10">
        {/* A–Z / 0–9 */}
        <div className="px-6 py-1.5 flex items-center gap-px flex-wrap border-b border-white/5">
          <span className="font-mono text-[9px] text-white/25 w-8 flex-shrink-0">A–Z</span>
          {ALPHA_INDEX.map((ch) => {
            const count = chirashiList.filter((c) => normalizeKana(c.titleKana) === ch).length
            return (
              <button key={ch} disabled={count === 0}
                onClick={() => onNavigate({ type: "tab", kana: ch, pageNum: 1 })}
                className={`w-6 py-1 font-mono text-[11px] transition-colors text-center ${count === 0 ? "text-white/15 cursor-default" : page.type === "tab" && page.kana === ch ? "text-white bg-white/10 border border-white/30" : "text-white/60 hover:text-white"}`}>
                {ch}
              </button>
            )
          })}
          <span className="mx-1 text-white/20">|</span>
          <span className="font-mono text-[9px] text-white/25 mr-1">0–9</span>
          {DIGIT_INDEX.map((ch) => {
            const count = chirashiList.filter((c) => normalizeKana(c.titleKana) === ch).length
            return (
              <button key={ch} disabled={count === 0}
                onClick={() => onNavigate({ type: "tab", kana: ch, pageNum: 1 })}
                className={`w-6 py-1 font-mono text-[11px] transition-colors text-center ${count === 0 ? "text-white/15 cursor-default" : page.type === "tab" && page.kana === ch ? "text-white bg-white/10 border border-white/30" : "text-white/60 hover:text-white"}`}>
                {ch}
              </button>
            )
          })}
        </div>
        {/* 五十音 */}
        <div className="px-6 py-1.5 flex items-center gap-px flex-wrap">
          <span className="font-mono text-[9px] text-white/25 w-8 flex-shrink-0">五十音</span>
          {/* メイン（全）ボタン */}
          <button
            onClick={() => onNavigate({ type: "main" })}
            className={`px-3 py-1 font-mono text-xs transition-colors ${page.type === "main" ? "text-white bg-white/10 border border-white/30" : "text-white/50 hover:text-white"}`}
          >
            メイン
          </button>
          {KANA_ONLY.map((kana) => {
            const count = chirashiList.filter((c) => normalizeKana(c.titleKana) === kana).length
            return (
              <button key={kana} disabled={count === 0}
                onClick={() => onNavigate({ type: "tab", kana, pageNum: 1 })}
                className={`px-2 py-1 font-serif text-xs transition-colors ${count === 0 ? "text-white/15 cursor-default" : page.type === "tab" && page.kana === kana ? "text-white bg-white/10 border border-white/30" : "text-white/60 hover:text-white"}`}>
                {kana}
              </button>
            )
          })}
        </div>
      </div>
    </header>
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
    <section className="border-b px-4 py-4 sm:px-6" style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block font-mono text-[9px] tracking-widest" style={{ color: "var(--muted)" }}>
            キーワード検索
          </span>
          <div className="flex h-11 items-center border transition-colors focus-within:border-[#1a1410]" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
            <span className="px-3 font-mono text-xs" style={{ color: "var(--muted)" }}>検索</span>
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="タイトル・監督・出演者から検索"
              className="h-full min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none placeholder:text-[#8a7f74]"
            />
          </div>
        </label>

        <div className="grid grid-cols-2 gap-3 sm:flex">
          <label className="sm:w-40">
            <span className="mb-1.5 block font-mono text-[9px] tracking-widest" style={{ color: "var(--muted)" }}>
              年代
            </span>
            <select
              value={decade}
              onChange={(event) => onDecadeChange(event.target.value)}
              className="h-11 w-full border bg-transparent px-3 text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "var(--bg)" }}
            >
              <option value="all">すべての年代</option>
              {decades.map((value) => <option key={value} value={value}>{value}年代</option>)}
            </select>
          </label>
          <label className="sm:w-36">
            <span className="mb-1.5 block font-mono text-[9px] tracking-widest" style={{ color: "var(--muted)" }}>
              公開年
            </span>
            <select
              value={year}
              onChange={(event) => onYearChange(event.target.value)}
              className="h-11 w-full border bg-transparent px-3 text-sm outline-none disabled:opacity-50"
              style={{ borderColor: "var(--border)", background: "var(--bg)" }}
            >
              <option value="all">{decade === "all" ? "すべての公開年" : `${decade}年代すべて`}</option>
              {visibleYears.map((value) => <option key={value} value={value}>{value}年</option>)}
            </select>
          </label>
        </div>

        <div className="flex h-11 items-center justify-between gap-4 lg:min-w-40 lg:justify-end">
          <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
            <strong className="text-sm" style={{ color: "var(--fg)" }}>{resultCount}</strong> / {totalCount}件
          </span>
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
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function Pagination({ pageNum, totalPages, onChange }: {
  pageNum: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <nav className="mt-10 flex items-center justify-center gap-3" aria-label="ページ送り">
      <button
        onClick={() => onChange(pageNum - 1)}
        disabled={pageNum === 1}
        className="border px-4 py-2 font-mono text-xs transition-colors hover:bg-[#1a1410] hover:text-white disabled:cursor-default disabled:opacity-30"
        style={{ borderColor: "var(--border)" }}
      >
        ← 前へ
      </button>
      <span className="min-w-24 text-center font-mono text-xs" style={{ color: "var(--muted)" }}>
        {pageNum} / {totalPages}
      </span>
      <button
        onClick={() => onChange(pageNum + 1)}
        disabled={pageNum === totalPages}
        className="border px-4 py-2 font-mono text-xs transition-colors hover:bg-[#1a1410] hover:text-white disabled:cursor-default disabled:opacity-30"
        style={{ borderColor: "var(--border)" }}
      >
        次へ →
      </button>
    </nav>
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
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-baseline gap-3">
        <h1 className="font-serif text-xl font-bold">{filterActive ? "検索結果" : "最新登録チラシ"}</h1>
        <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
          {filterActive
            ? `${groups.length}作品 · 公開年の新しい順`
            : latestDate
              ? `${formatDate(latestDate)}に登録 · ${groups.length}作品`
              : "addedAtが入力された作品はまだありません"}
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 border border-dashed px-6 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="font-serif text-4xl" style={{ color: "var(--border)" }}>無</div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {filterActive
              ? "条件に一致する作品がありません"
              : "最新表示にはCSVのaddedAt列へ登録日（例: 2026-03-08）を入力してください"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
            {pageGroups.map((group) => (
              <ChirashiCard
                key={group.title}
                c={group.representative}
                versionCount={group.versions.length}
                onClick={() => onNavigate({ type: "detail", id: group.representative.id, back: { type: "main" } })}
              />
            ))}
          </div>
          <Pagination pageNum={safePage} totalPages={totalPages} onChange={setPageNum} />
        </>
      )}
    </div>
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
    <div className="p-6">
      <div className="flex items-baseline gap-3 mb-5">
        <h1 className="font-serif text-xl font-bold">【{kana}】のチラシ</h1>
        <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
          {groups.length}作品 · {items.length}種類 · {safePage}/{totalPages}ページ
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="font-serif text-5xl" style={{ color: "var(--border)" }}>無</div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>該当するチラシがありません</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
            {pageGroups.map((group) => (
              <ChirashiCard
                key={group.title}
                c={group.representative}
                versionCount={group.versions.length}
                onClick={() => onNavigate({ type: "detail", id: group.representative.id, back: { type: "tab", kana, pageNum: safePage } })}
              />
            ))}
          </div>
          <Pagination
            pageNum={safePage}
            totalPages={totalPages}
            onChange={(nextPage) => onNavigate({ type: "tab", kana, pageNum: nextPage })}
          />
        </>
      )}
    </div>
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
        .filter((item) => item.title === selected.title)
        .sort((a, b) => dateValue(b.addedAt) - dateValue(a.addedAt) || japaneseCollator.compare(b.id, a.id))
      : [],
    [chirashiList, selected?.title],
  )
  const [activeId, setActiveId] = useState(id)
  useEffect(() => setActiveId(id), [id])
  const c = versions.find((item) => item.id === activeId) ?? selected

  if (!c) return (
    <div className="p-10 text-center">
      <p style={{ color: "var(--muted)" }}>チラシが見つかりませんでした</p>
      <button onClick={() => onNavigate(back)} className="mt-4 font-mono text-xs underline" style={{ color: "var(--accent)" }}>戻る</button>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* 戻るボタン */}
      <button
        onClick={() => onNavigate(back)}
        className="font-mono text-[10px] mb-6 flex items-center gap-2 hover:opacity-60 transition-opacity"
        style={{ color: "var(--muted)" }}
      >
        ← {back.type === "main" ? "メインに戻る" : `【${(back as { type: "tab"; kana: string; pageNum: number }).kana}】に戻る`}
      </button>

      {/* タイトル・基本情報 */}
      <div className="mb-8">
        <div className="font-mono text-[10px] mb-1 flex items-center gap-2" style={{ color: "var(--muted)" }}>
          <span>{c.id}</span>
          <span>·</span>
          <span>表面: {frontOrientation(c) === "landscape" ? "横向き" : "縦向き"}</span>
          <span>·</span>
          <span>{FOLD_LABEL[c.foldType]}</span>
          <span>·</span>
          <span>{c.panels.length}面</span>
          {versions.length > 1 && (
            <>
              <span>·</span>
              <span>全{versions.length}種類</span>
            </>
          )}
        </div>
        <h1 className="font-serif text-3xl font-bold mb-3">{c.title}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span><span className="font-mono text-[10px] mr-1.5" style={{ color: "var(--muted)" }}>公開年</span>{c.year}年</span>
          <span><span className="font-mono text-[10px] mr-1.5" style={{ color: "var(--muted)" }}>ジャンル</span>{c.genre}</span>
          <span><span className="font-mono text-[10px] mr-1.5" style={{ color: "var(--muted)" }}>監督</span>{c.director}</span>
          <span><span className="font-mono text-[10px] mr-1.5" style={{ color: "var(--muted)" }}>出演</span>{c.cast.join("、")}</span>
        </div>
      </div>

      {versions.length > 1 && (
        <div className="mb-8 border-y py-4" style={{ borderColor: "var(--border)" }}>
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "var(--muted)" }}>
              チラシの種類を切り替える
            </p>
            <span className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>
              {versions.findIndex((item) => item.id === c.id) + 1} / {versions.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
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
                <span className="block font-serif text-xs font-bold">種類 {index + 1}</span>
                <span className="mt-1 block font-mono text-[9px] opacity-60">
                  {version.id}{version.addedAt ? ` · ${version.addedAt}` : ""}
                </span>
                <span className="mt-1 block font-mono text-[9px] opacity-60">
                  {version.panels.length}面 · {FOLD_LABEL[version.foldType]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 画像パネル表示 */}
      <div className="border-t pt-8" style={{ borderColor: "var(--border)" }}>
        <PanelDisplay key={c.id} c={c} />
      </div>

      {/* 前後のチラシへのナビ */}
      {back.type === "tab" && (() => {
        const siblings = groupChirashi(
          chirashiList.filter((item) => normalizeKana(item.titleKana) === back.kana)
        )
        const idx = siblings.findIndex((group) => group.title === c.title)
        const prev = siblings[idx - 1]?.representative
        const next = siblings[idx + 1]?.representative
        return (
          <div className="flex justify-between mt-12 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
            {prev ? (
              <button onClick={() => onNavigate({ type: "detail", id: prev.id, back })}
                className="text-left group">
                <p className="font-mono text-[9px] mb-1" style={{ color: "var(--muted)" }}>← 前の作品</p>
                <p className="font-serif text-sm font-semibold group-hover:underline">{prev.title}</p>
              </button>
            ) : <div />}
            {next ? (
              <button onClick={() => onNavigate({ type: "detail", id: next.id, back })}
                className="text-right group">
                <p className="font-mono text-[9px] mb-1" style={{ color: "var(--muted)" }}>次の作品 →</p>
                <p className="font-serif text-sm font-semibold group-hover:underline">{next.title}</p>
              </button>
            ) : <div />}
          </div>
        )
      })()}
    </div>
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
  const [page, setPage] = useState<Page>({ type: "main" })
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [query, setQuery] = useState("")
  const [decade, setDecade] = useState("all")
  const [year, setYear] = useState("all")

  // 起動時に public/chirashi-data.csv を読み込む
  useEffect(() => {
    fetch("/chirashi-data.csv")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
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
  const filterKey = `${query}\u0000${decade}\u0000${year}`

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
      <div className="text-center">
        <div className="font-serif text-4xl mb-4" style={{ color: "var(--border)" }}>映</div>
        <p className="font-mono text-xs" style={{ color: "var(--muted)" }}>データを読み込んでいます...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      {/* CSVロードエラー通知 */}
      {loadError && (
        <div className="px-6 py-2 font-mono text-[10px]" style={{ background: "#fff3cd", color: "#856404" }}>
          ⚠ chirashi-data.csv の読み込みに問題があります: {loadError}（サンプルデータを表示中）
        </div>
      )}
      <Header
        chirashiList={chirashiList}
        page={page}
        onNavigate={navigate}
        onCsvImport={(incoming, mode) => {
          if (mode === "overwrite") {
            setChirashiList(incoming)
          } else {
            // 追加：同じIDがあれば新しいデータで上書き、なければ末尾に追加
            setChirashiList((prev) => {
              const merged = [...prev]
              for (const item of incoming) {
                const idx = merged.findIndex((c) => c.id === item.id)
                if (idx >= 0) merged[idx] = item  // 同IDは上書き
                else merged.push(item)             // 新規は追加
              }
              return merged
            })
          }
        }}
        showImportPanel={showImportPanel}
        setShowImportPanel={setShowImportPanel}
      />

      {page.type !== "detail" && (
        <BrowseControls
          query={query}
          onQueryChange={updateQuery}
          decade={decade}
          onDecadeChange={updateDecade}
          year={year}
          onYearChange={updateYear}
          years={years}
          resultCount={filteredList.length}
          totalCount={chirashiList.length}
        />
      )}

      <main className="flex-1">
        {page.type === "main" && (
          <MainView
            chirashiList={filteredList}
            filterActive={filterActive}
            filterKey={filterKey}
            onNavigate={navigate}
          />
        )}
        {page.type === "tab" && (
          <TabView chirashiList={filteredList} kana={page.kana} pageNum={page.pageNum} onNavigate={navigate} />
        )}
        {page.type === "detail" && (
          <DetailView chirashiList={chirashiList} id={page.id} back={page.back} onNavigate={navigate} />
        )}
      </main>

      <footer className="border-t px-6 py-2 flex items-center text-[10px] font-mono" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
        <span>映画チラシ・コレクション</span>
        <span className="mx-3">·</span>
        <span>登録数: {chirashiList.length}件</span>
        <span className="mx-3">·</span>
        <span style={{ color: "var(--muted)" }}>データ: chirashi-data.csv</span>
        <span className="ml-auto">© 2026</span>
      </footer>
    </div>
  )
}
