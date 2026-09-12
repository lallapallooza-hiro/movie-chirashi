import { useState, useRef, useCallback, useEffect } from "react"

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

// グリッド表示用：表面パネルの向きを返す
function frontOrientation(c: Chirashi): Orientation {
  return c.panels[0]?.orientation ?? "portrait"
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
      addedAt: cols[idx("addedat")] || new Date().toISOString().split("T")[0],
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

function ChirashiCard({ c, onClick }: { c: Chirashi; onClick: () => void }) {
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
        <p className="font-mono text-[9px] mt-0.5" style={{ color: "var(--muted)" }}>{c.year}年 · {c.genre}</p>
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

function Lightbox({ state, onClose }: { state: LightboxState; onClose: () => void }) {
  // キーボード操作（Esc で閉じる）
  useEffect(() => {
    if (!state) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [state, onClose])

  // スクロール抑止
  useEffect(() => {
    if (state) { document.body.style.overflow = "hidden" }
    else { document.body.style.overflow = "" }
    return () => { document.body.style.overflow = "" }
  }, [state])

  if (!state) return null

  const isLandscape = state.orientation === "landscape"

  return (
    // 背景オーバーレイ（クリックで閉じる）
    <div
      className="lightbox-modal fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.88)" }}
      onClick={onClose}
      // 右クリック・コンテキストメニューを抑止（保存防止）
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 画像コンテナ（クリックが背景に伝播しないよう止める） */}
      <div
        className="relative flex flex-col items-center gap-3"
        style={{ maxWidth: isLandscape ? "90vw" : "60vw", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ラベル */}
        <div className="flex items-center gap-3">
          <span className="font-serif text-white text-sm font-semibold">{state.label}</span>
          <span className="font-mono text-[10px] px-2 py-0.5 border border-white/20 text-white/50">
            {isLandscape ? "横向き" : "縦向き"}
          </span>
          <span className="font-mono text-[10px] text-white/30">参照専用</span>
        </div>

        {/* 画像本体 */}
        <div
          className="relative overflow-hidden"
          style={{
            maxWidth: "100%",
            maxHeight: "80vh",
            // ユーザー選択・ドラッグ禁止
            userSelect: "none",
            WebkitUserSelect: "none",
            pointerEvents: "none",
          }}
        >
          <img
            src={state.url}
            alt={state.label}
            draggable={false}
            style={{
              maxWidth: "100%",
              maxHeight: "80vh",
              objectFit: "contain",
              display: "block",
            }}
          />
          {/* 透明オーバーレイ（右クリック・ドラッグ保存をさらに抑止） */}
          <div className="absolute inset-0" style={{ pointerEvents: "all" }} onContextMenu={(e) => e.preventDefault()} />
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="font-mono text-xs text-white/50 hover:text-white transition-colors"
          style={{ pointerEvents: "all" }}
        >
          ✕ 閉じる（Escキーでも閉じられます）
        </button>
      </div>

      {/* 閉じるボタン（右上） */}
      <button
        onClick={onClose}
        className="absolute top-5 right-6 text-white/40 hover:text-white font-mono text-2xl leading-none transition-colors"
        style={{ pointerEvents: "all" }}
      >
        ×
      </button>
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
  onCsvImport: (list: Chirashi[]) => void
  showImportPanel: boolean
  setShowImportPanel: (v: boolean) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) { setImportErrors(["CSVファイルを選択してください"]); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const { data, errors } = parseCsv(e.target?.result as string)
      setImportErrors(errors)
      if (data.length > 0) { onCsvImport(data); setImportSuccess(`${data.length}件を読み込みました`); setShowImportPanel(false) }
    }
    reader.readAsText(file, "UTF-8")
  }, [onCsvImport, setShowImportPanel])

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
              <p className="text-sm" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>CSVファイルをドロップ、またはクリックして選択</p>
              <button onClick={(e) => { e.stopPropagation(); downloadTemplate() }} className="font-mono text-[10px] mt-1 hover:underline" style={{ color: "#7ec8e3" }}>
                ⬇ テンプレートをダウンロード
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>
          {importErrors.map((e, i) => <p key={i} className="mt-1 font-mono text-[10px] text-red-300">{e}</p>)}
          {importSuccess && <p className="mt-1 font-mono text-[10px] text-green-300">✓ {importSuccess}</p>}
        </div>
      )}

      {/* 五十音インデックス */}
      <div className="border-b border-white/10">
        {/* A–Z / 0–9 */}
        <div className="px-6 py-1.5 flex items-center gap-px flex-wrap border-b border-white/5">
          <span className="font-mono text-[9px] text-white/25 w-8 flex-shrink-0">A–Z</span>
          {ALPHA_INDEX.map((ch) => {
            const count = chirashiList.filter((c) => c.titleKana === ch).length
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
            const count = chirashiList.filter((c) => c.titleKana === ch).length
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
            const count = chirashiList.filter((c) => c.titleKana === kana).length
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
// メイン画面（直近追加順）
// ================================================================

function MainView({ chirashiList, onNavigate }: { chirashiList: Chirashi[]; onNavigate: (p: Page) => void }) {
  const recent = [...chirashiList].sort((a, b) => b.addedAt.localeCompare(a.addedAt))

  return (
    <div className="p-6">
      <div className="flex items-baseline gap-3 mb-5">
        <h1 className="font-serif text-xl font-bold">新着チラシ</h1>
        <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
          登録が新しい順 · 全{chirashiList.length}件
        </span>
      </div>
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        {recent.map((c) => (
          <ChirashiCard
            key={c.id}
            c={c}
            onClick={() => onNavigate({ type: "detail", id: c.id, back: { type: "main" } })}
          />
        ))}
      </div>
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
  const items = chirashiList.filter((c) => c.titleKana === kana)
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)
  const pageItems = items.slice((pageNum - 1) * ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE)

  return (
    <div className="p-6">
      <div className="flex items-baseline gap-3 mb-5">
        <h1 className="font-serif text-xl font-bold">【{kana}】のチラシ</h1>
        <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
          {items.length}件 · {pageNum}/{totalPages}ページ
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
            {pageItems.map((c) => (
              <ChirashiCard
                key={c.id}
                c={c}
                onClick={() => onNavigate({ type: "detail", id: c.id, back: { type: "tab", kana, pageNum } })}
              />
            ))}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => onNavigate({ type: "tab", kana, pageNum: pageNum - 1 })}
                disabled={pageNum === 1}
                className="font-mono text-xs px-4 py-2 border transition-colors disabled:opacity-30 disabled:cursor-default hover:enabled:bg-[#0a0a0a] hover:enabled:text-white"
                style={{ borderColor: "var(--border)" }}
              >
                ← 前へ
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => onNavigate({ type: "tab", kana, pageNum: n })}
                  className="font-mono text-xs w-9 h-9 border transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    background: n === pageNum ? "var(--fg)" : undefined,
                    color: n === pageNum ? "white" : undefined,
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => onNavigate({ type: "tab", kana, pageNum: pageNum + 1 })}
                disabled={pageNum === totalPages}
                className="font-mono text-xs px-4 py-2 border transition-colors disabled:opacity-30 disabled:cursor-default hover:enabled:bg-[#0a0a0a] hover:enabled:text-white"
                style={{ borderColor: "var(--border)" }}
              >
                次へ →
              </button>
            </div>
          )}
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
  const c = chirashiList.find((item) => item.id === id)
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
        </div>
        <h1 className="font-serif text-3xl font-bold mb-3">{c.title}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span><span className="font-mono text-[10px] mr-1.5" style={{ color: "var(--muted)" }}>公開年</span>{c.year}年</span>
          <span><span className="font-mono text-[10px] mr-1.5" style={{ color: "var(--muted)" }}>ジャンル</span>{c.genre}</span>
          <span><span className="font-mono text-[10px] mr-1.5" style={{ color: "var(--muted)" }}>監督</span>{c.director}</span>
          <span><span className="font-mono text-[10px] mr-1.5" style={{ color: "var(--muted)" }}>出演</span>{c.cast.join("、")}</span>
        </div>
      </div>

      {/* 画像パネル表示 */}
      <div className="border-t pt-8" style={{ borderColor: "var(--border)" }}>
        <PanelDisplay c={c} />
      </div>

      {/* 前後のチラシへのナビ */}
      {back.type === "tab" && (() => {
        const siblings = chirashiList.filter((item) => item.titleKana === back.kana)
        const idx = siblings.findIndex((item) => item.id === id)
        const prev = siblings[idx - 1]
        const next = siblings[idx + 1]
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

export default function App() {
  const [chirashiList, setChirashiList] = useState<Chirashi[]>(SAMPLE)
  const [page, setPage] = useState<Page>({ type: "main" })
  const [showImportPanel, setShowImportPanel] = useState(false)

  const navigate = (p: Page) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <Header
        chirashiList={chirashiList}
        page={page}
        onNavigate={navigate}
        onCsvImport={setChirashiList}
        showImportPanel={showImportPanel}
        setShowImportPanel={setShowImportPanel}
      />

      <main className="flex-1">
        {page.type === "main" && (
          <MainView chirashiList={chirashiList} onNavigate={navigate} />
        )}
        {page.type === "tab" && (
          <TabView chirashiList={chirashiList} kana={page.kana} pageNum={page.pageNum} onNavigate={navigate} />
        )}
        {page.type === "detail" && (
          <DetailView chirashiList={chirashiList} id={page.id} back={page.back} onNavigate={navigate} />
        )}
      </main>

      <footer className="border-t px-6 py-2 flex items-center text-[10px] font-mono" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
        <span>映画チラシ・コレクション</span>
        <span className="mx-3">·</span>
        <span>登録数: {chirashiList.length}件</span>
        <span className="ml-auto">© 2026</span>
      </footer>
    </div>
  )
}
