import { useState, useRef, useCallback } from "react"

// ===== データの型定義 =====
type Chirashi = {
  id: string
  imageUrl: string
  title: string
  titleKana: string  // 五十音の先頭1文字、または英字1文字（A〜Z）、または数字（0〜9）
  year: number
  genre: string
  director: string
  cast: string[]    // 出演者（複数）
}

// ===== CSVのテンプレート =====
// Excelで「名前を付けて保存」→「CSV UTF-8」で保存してください
// 1行目はこのヘッダー行（変更しないでください）
const CSV_HEADER = "id,title,titleKana,year,genre,director,cast,imageUrl"

// cast列は「田中 健/山田 花子」のようにスラッシュ区切りで複数人入力できます

// ===== サンプルデータ（最初に表示される例） =====
const SAMPLE_DATA: Chirashi[] = [
  {
    id: "C-001",
    imageUrl: "https://images.unsplash.com/photo-1769265095585-44764352cb77?w=280&h=400&fit=crop&auto=format",
    title: "夜霧の追跡者",
    titleKana: "ヤ",
    year: 1974,
    genre: "アクション",
    director: "鈴木 一郎",
    cast: ["田中 健", "山田 花子"],
  },
  {
    id: "C-002",
    imageUrl: "https://images.unsplash.com/photo-1689045170733-bec91f0812a0?w=280&h=400&fit=crop&auto=format",
    title: "明日へのタンゴ",
    titleKana: "ア",
    year: 1988,
    genre: "ロマンス",
    director: "佐藤 美恵",
    cast: ["木村 太郎", "伊藤 京子"],
  },
  {
    id: "C-003",
    imageUrl: "https://images.unsplash.com/photo-1704721211126-f67684d8e0c9?w=280&h=400&fit=crop&auto=format",
    title: "深海の宴",
    titleKana: "シ",
    year: 1963,
    genre: "ホラー",
    director: "渡辺 剛",
    cast: ["高橋 恵子", "中村 光"],
  },
  {
    id: "C-004",
    imageUrl: "https://images.unsplash.com/photo-1602421311752-e3b1a31b4384?w=280&h=400&fit=crop&auto=format",
    title: "Galaxy Express",
    titleKana: "G",
    year: 1982,
    genre: "SF",
    director: "藤田 隆",
    cast: ["西村 洋介", "林 美穂"],
  },
  {
    id: "C-005",
    imageUrl: "https://images.unsplash.com/photo-1569793667639-dae11573b34f?w=280&h=400&fit=crop&auto=format",
    title: "Midnight Rain",
    titleKana: "M",
    year: 1979,
    genre: "ロマンス",
    director: "安田 豊",
    cast: ["山本 敦子", "清水 隆"],
  },
]

// ===== CSVパース関数 =====
// 1行のCSVをカンマで分割する（セル内にカンマが含まれる場合も対応）
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

// CSVテキスト全体をChirashi配列に変換
function parseCsv(text: string): { data: Chirashi[]; errors: string[] } {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim())
  const errors: string[] = []
  const data: Chirashi[] = []

  if (lines.length < 2) {
    return { data, errors: ["データ行がありません。ヘッダー行の下にデータを入力してください。"] }
  }

  // ヘッダー行を確認
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  const required = ["id", "title", "titlekana", "year", "genre", "director", "cast"]
  const missing = required.filter((r) => !headers.includes(r))
  if (missing.length > 0) {
    return { data, errors: [`列名が不足しています: ${missing.join(", ")}`] }
  }

  const idx = (name: string) => headers.indexOf(name)

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    if (cols.length < 6) {
      errors.push(`${i + 1}行目: 列数が足りません（スキップ）`)
      continue
    }
    const yearNum = parseInt(cols[idx("year")])
    if (isNaN(yearNum)) {
      errors.push(`${i + 1}行目: 「year（公開年）」が数字ではありません → "${cols[idx("year")]}"（スキップ）`)
      continue
    }
    data.push({
      id: cols[idx("id")] || `ROW-${i}`,
      title: cols[idx("title")] || "",
      titleKana: cols[idx("titlekana")] || "",
      year: yearNum,
      genre: cols[idx("genre")] || "",
      director: cols[idx("director")] || "",
      // cast列はスラッシュ区切りで複数人入力
      cast: cols[idx("cast")] ? cols[idx("cast")].split("/").map((s) => s.trim()).filter(Boolean) : [],
      imageUrl: headers.includes("imageurl") ? (cols[idx("imageurl")] || "") : "",
    })
  }

  return { data, errors }
}

// テンプレートCSVをダウンロードさせる関数
function downloadTemplate() {
  const rows = [
    CSV_HEADER,
    'C-001,夜霧の追跡者,ヤ,1974,アクション,鈴木 一郎,田中 健/山田 花子,',
    'C-002,Galaxy Express,G,1982,SF,藤田 隆,西村 洋介/林 美穂,',
  ]
  const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "chirashi_template.csv"
  a.click()
  URL.revokeObjectURL(url)
}

// ===== 五十音・英数字インデックス =====
const ALPHA_INDEX = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
const DIGIT_INDEX = "0123456789".split("")
const KANA_INDEX = [
  ...ALPHA_INDEX, ...DIGIT_INDEX,
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

function getDecade(year: number) {
  return `${Math.floor(year / 10) * 10}年代`
}

// ===== メインコンポーネント =====
export default function App() {
  const [chirashiList, setChirashiList] = useState<Chirashi[]>(SAMPLE_DATA)
  const [query, setQuery] = useState("")
  const [activeKana, setActiveKana] = useState<string | null>(null)
  const [genre, setGenre] = useState("ジャンル")
  const [decade, setDecade] = useState("公開年代")
  const [selected, setSelected] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isDragging, setIsDragging] = useState(false)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [showImportPanel, setShowImportPanel] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // CSVファイルを読み込む処理
  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setImportErrors(["CSVファイル（.csv）を選択してください。"])
      setImportSuccess(null)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { data, errors } = parseCsv(text)
      setImportErrors(errors)
      if (data.length > 0) {
        setChirashiList(data)
        setImportSuccess(`${data.length}件のデータを読み込みました。`)
        setSelected(null)
        setShowImportPanel(false)
      } else {
        setImportSuccess(null)
      }
    }
    reader.readAsText(file, "UTF-8")
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  // ジャンル・年代の選択肢（読み込んだデータから自動生成）
  const genres = ["ジャンル", ...Array.from(new Set(chirashiList.map((c) => c.genre))).sort()]
  const decades = ["公開年代", ...Array.from(new Set(chirashiList.map((c) => getDecade(c.year)))).sort()]

  const filtered = chirashiList.filter((c) => {
    const q = query.toLowerCase()
    const matchQuery = !q || c.title.toLowerCase().includes(q) || c.director.toLowerCase().includes(q) || c.cast.some((n) => n.toLowerCase().includes(q))
    const matchKana = !activeKana || c.titleKana === activeKana
    const matchGenre = genre === "ジャンル" || c.genre === genre
    const matchDecade = decade === "公開年代" || getDecade(c.year) === decade
    return matchQuery && matchKana && matchGenre && matchDecade
  })

  const selectedItem = chirashiList.find((c) => c.id === selected)
  const hasFilter = query || activeKana || genre !== "ジャンル" || decade !== "公開年代"
  const resetAll = () => { setQuery(""); setActiveKana(null); setGenre("ジャンル"); setDecade("公開年代") }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>

      {/* ===== ヘッダー ===== */}
      <header style={{ background: "var(--header-bg)" }} className="text-white">

        {/* タイトル行 */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center font-serif font-bold text-lg" style={{ background: "var(--accent)" }}>映</div>
            <div>
              <div className="font-serif text-lg font-bold tracking-wider leading-none">映画チラシ・コレクション</div>
              <div className="font-mono text-[10px] text-white/40 mt-0.5">MOVIE CHIRASHI COLLECTION DATABASE</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-white/40">
              登録数: <span className="text-white font-bold">{chirashiList.length}</span> 件
            </span>
            {/* CSVインポートボタン */}
            <button
              onClick={() => { setShowImportPanel(!showImportPanel); setImportErrors([]); setImportSuccess(null) }}
              className="text-xs px-4 py-2 border border-white/20 hover:border-white/60 transition-colors"
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              📂 CSVから読み込む
            </button>
          </div>
        </div>

        {/* CSVインポートパネル（開閉式） */}
        {showImportPanel && (
          <div className="px-6 py-5 border-b border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="max-w-2xl">
              <p className="text-sm font-bold mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                CSVファイルを読み込む
              </p>
              <p className="text-xs text-white/50 mb-4" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                ExcelでデータをCSV形式（UTF-8）で保存してから、下のエリアにドラッグ＆ドロップしてください。
              </p>

              {/* ドロップゾーン */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-none cursor-pointer transition-colors flex flex-col items-center justify-center py-8 gap-3"
                style={{ borderColor: isDragging ? "var(--accent)" : "rgba(255,255,255,0.2)", background: isDragging ? "rgba(192,57,43,0.1)" : "transparent" }}
              >
                <span className="text-3xl">📄</span>
                <span className="text-sm text-white/60" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                  ここにCSVファイルをドロップ、またはクリックして選択
                </span>
                <span className="font-mono text-[10px] text-white/30">.csv ファイルのみ対応</span>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>

              {/* エラー表示 */}
              {importErrors.length > 0 && (
                <div className="mt-3 p-3 border border-red-500/40 bg-red-500/10">
                  {importErrors.map((err, i) => (
                    <p key={i} className="text-xs text-red-300 font-mono">{err}</p>
                  ))}
                </div>
              )}

              {/* 成功メッセージ */}
              {importSuccess && (
                <div className="mt-3 p-3 border border-green-500/40 bg-green-500/10">
                  <p className="text-xs text-green-300 font-mono">✓ {importSuccess}</p>
                </div>
              )}

              {/* テンプレートDL + 列の説明 */}
              <div className="mt-4 flex items-start gap-6">
                <button
                  onClick={downloadTemplate}
                  className="text-xs px-3 py-2 border border-white/20 hover:border-white/50 transition-colors flex-shrink-0"
                  style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#7ec8e3" }}
                >
                  ⬇ テンプレートをダウンロード
                </button>
                <div className="text-[10px] text-white/40 font-mono leading-relaxed">
                  <p className="text-white/60 mb-1">CSVの列（1行目はヘッダー行）</p>
                  <p>id &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;… 管理番号（例: C-001）</p>
                  <p>title &nbsp;&nbsp;… タイトル</p>
                  <p>titleKana … 先頭文字（例: ア、G、1）</p>
                  <p>year &nbsp;&nbsp;… 公開年（数字のみ）</p>
                  <p>genre &nbsp;&nbsp;… ジャンル</p>
                  <p>director … 監督名</p>
                  <p>cast &nbsp;&nbsp;… 出演者（複数はスラッシュ区切り）</p>
                  <p>imageUrl … 画像URL（任意）</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 検索バー + 絞り込み */}
        <div className="px-6 py-3 flex flex-wrap items-center gap-3 border-b border-white/10">
          <div className="flex items-center border border-white/20 focus-within:border-white/50 transition-colors">
            <span className="font-mono text-[10px] text-white/30 px-2 py-2 border-r border-white/10">🔍</span>
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="タイトル・監督・出演者で検索..."
              className="bg-transparent font-mono text-xs text-white placeholder:text-white/20 outline-none px-3 py-2 w-56"
            />
            {query && <button onClick={() => setQuery("")} className="px-2 text-white/30 hover:text-white text-xs">✕</button>}
          </div>

          <select value={genre} onChange={(e) => setGenre(e.target.value)}
            className="bg-transparent border border-white/20 text-white text-xs px-3 py-2 outline-none cursor-pointer"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            {genres.map((g) => <option key={g} value={g} style={{ background: "#1a1410", color: "white" }}>{g}</option>)}
          </select>

          <select value={decade} onChange={(e) => setDecade(e.target.value)}
            className="bg-transparent border border-white/20 text-white text-xs px-3 py-2 outline-none cursor-pointer"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            {decades.map((d) => <option key={d} value={d} style={{ background: "#1a1410", color: "white" }}>{d}</option>)}
          </select>

          {hasFilter && (
            <button onClick={resetAll} className="text-xs px-3 py-2 border border-white/20 hover:border-white/50 transition-colors"
              style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "var(--accent)" }}>
              リセット
            </button>
          )}

          <div className="ml-auto flex gap-1">
            <button onClick={() => setViewMode("grid")} className={`px-3 py-2 font-mono text-xs transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}>⊞</button>
            <button onClick={() => setViewMode("list")} className={`px-3 py-2 font-mono text-xs transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}>≡</button>
          </div>
        </div>

        {/* 英数字＋五十音インデックス */}
        <div className="border-b border-white/10">
          {/* A–Z / 0–9 */}
          <div className="px-6 py-1.5 flex items-center gap-px flex-wrap border-b border-white/5">
            <span className="font-mono text-[9px] text-white/25 w-8 flex-shrink-0">A–Z</span>
            {ALPHA_INDEX.map((ch) => {
              const count = chirashiList.filter((c) => c.titleKana === ch).length
              return (
                <button key={ch} onClick={() => setActiveKana(activeKana === ch ? null : ch)} disabled={count === 0}
                  className={`w-6 py-1 font-mono text-[11px] transition-colors text-center ${count === 0 ? "text-white/15 cursor-default" : activeKana === ch ? "text-white bg-white/10 border border-white/30" : "text-white/60 hover:text-white"}`}>
                  {ch}
                </button>
              )
            })}
            <span className="mx-1 text-white/20">|</span>
            <span className="font-mono text-[9px] text-white/25 mr-1">0–9</span>
            {DIGIT_INDEX.map((ch) => {
              const count = chirashiList.filter((c) => c.titleKana === ch).length
              return (
                <button key={ch} onClick={() => setActiveKana(activeKana === ch ? null : ch)} disabled={count === 0}
                  className={`w-6 py-1 font-mono text-[11px] transition-colors text-center ${count === 0 ? "text-white/15 cursor-default" : activeKana === ch ? "text-white bg-white/10 border border-white/30" : "text-white/60 hover:text-white"}`}>
                  {ch}
                </button>
              )
            })}
          </div>
          {/* 五十音 */}
          <div className="px-6 py-1.5 flex items-center gap-px flex-wrap">
            <span className="font-mono text-[9px] text-white/25 w-8 flex-shrink-0">五十音</span>
            <button onClick={() => setActiveKana(null)}
              className={`px-2.5 py-1 font-mono text-xs transition-colors ${activeKana === null ? "text-white bg-white/10 border border-white/30" : "text-white/40 hover:text-white/80"}`}>
              全
            </button>
            {KANA_INDEX.filter((k) => !ALPHA_INDEX.includes(k) && !DIGIT_INDEX.includes(k)).map((kana) => {
              const count = chirashiList.filter((c) => c.titleKana === kana).length
              return (
                <button key={kana} onClick={() => setActiveKana(activeKana === kana ? null : kana)} disabled={count === 0}
                  className={`px-2 py-1 font-serif text-xs transition-colors ${count === 0 ? "text-white/15 cursor-default" : activeKana === kana ? "text-white bg-white/10 border border-white/30" : "text-white/60 hover:text-white"}`}>
                  {kana}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* ===== コンテンツ ===== */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">

          {/* 件数表示 */}
          <div className="px-6 py-2.5 border-b text-xs flex items-center gap-2"
            style={{ borderColor: "var(--border)", background: "var(--card-bg)" }}>
            <span style={{ color: "var(--muted)" }}>
              {activeKana && <span>【{activeKana}】</span>}
              {genre !== "ジャンル" && <span>【{genre}】</span>}
              {decade !== "公開年代" && <span>【{decade}】</span>}
              {query && <span>「{query}」</span>}
            </span>
            <span className="font-bold" style={{ color: "var(--accent)" }}>{filtered.length}</span>
            <span style={{ color: "var(--muted)" }}>件 / 全{chirashiList.length}件</span>
            {hasFilter && (
              <button onClick={resetAll} className="ml-auto text-xs hover:underline" style={{ color: "var(--accent)" }}>
                条件をリセット
              </button>
            )}
          </div>

          {/* 結果なし */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="font-serif text-5xl" style={{ color: "var(--border)" }}>無</div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>該当するチラシが見つかりませんでした</p>
            </div>
          )}

          {/* グリッド表示 */}
          {filtered.length > 0 && viewMode === "grid" && (
            <div className="p-6 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
              {filtered.map((c) => (
                <div key={c.id} onClick={() => setSelected(c.id === selected ? null : c.id)} className="cursor-pointer group">
                  <div className="relative overflow-hidden"
                    style={{ aspectRatio: "2/3", background: "#e8e0d4", outline: selected === c.id ? "2px solid var(--accent)" : "none", outlineOffset: "2px" }}>
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      // 画像URLがない場合のプレースホルダー
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                        <span className="font-serif text-2xl" style={{ color: "var(--border)" }}>映</span>
                        <p className="font-serif text-[10px] text-center leading-snug" style={{ color: "var(--muted)" }}>{c.title}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
                      <p className="font-serif text-[10px] text-white font-bold leading-tight">{c.title}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="font-serif text-xs font-semibold leading-snug" style={{ color: "var(--fg)" }}>{c.title}</p>
                    <p className="font-mono text-[9px] mt-0.5" style={{ color: "var(--muted)" }}>{c.year}年 · {c.genre}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* リスト表示 */}
          {filtered.length > 0 && viewMode === "list" && (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              <div className="px-6 py-2 grid text-[10px] font-mono gap-4"
                style={{ gridTemplateColumns: "2.5fr 1fr 1fr 2fr 2fr", color: "var(--muted)" }}>
                <span>タイトル</span><span>公開年</span><span>ジャンル</span><span>監督</span><span>出演</span>
              </div>
              {filtered.map((c) => (
                <div key={c.id} onClick={() => setSelected(c.id === selected ? null : c.id)}
                  className="px-6 py-3 grid gap-4 cursor-pointer items-center transition-colors text-sm"
                  style={{ gridTemplateColumns: "2.5fr 1fr 1fr 2fr 2fr", background: selected === c.id ? "#fff5f4" : undefined, borderLeft: selected === c.id ? "3px solid var(--accent)" : "3px solid transparent" }}
                  onMouseEnter={(e) => { if (selected !== c.id) (e.currentTarget as HTMLDivElement).style.background = "#faf8f5" }}
                  onMouseLeave={(e) => { if (selected !== c.id) (e.currentTarget as HTMLDivElement).style.background = "" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 flex-shrink-0 overflow-hidden" style={{ aspectRatio: "2/3", background: "#e8e0d4" }}>
                      {c.imageUrl
                        ? <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center font-serif text-xs" style={{ color: "var(--border)" }}>映</div>
                      }
                    </div>
                    <p className="font-serif font-semibold text-xs leading-snug">{c.title}</p>
                  </div>
                  <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>{c.year}</span>
                  <span className="text-xs">{c.genre}</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{c.director}</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{c.cast.slice(0, 2).join("、")}{c.cast.length > 2 && " 他"}</span>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ===== 詳細パネル ===== */}
        {selectedItem && (
          <aside className="w-72 flex-shrink-0 border-l overflow-y-auto" style={{ borderColor: "var(--border)", background: "var(--card-bg)" }}>
            <div className="px-5 py-3 flex items-center justify-between border-b text-xs" style={{ borderColor: "var(--border)" }}>
              <span className="font-mono tracking-widest" style={{ color: "var(--muted)" }}>詳細情報</span>
              <button onClick={() => setSelected(null)} className="font-mono text-xs hover:opacity-60 transition-opacity" style={{ color: "var(--muted)" }}>✕ 閉じる</button>
            </div>
            <div className="p-5">
              <div className="mx-auto overflow-hidden shadow-md" style={{ maxWidth: "180px", aspectRatio: "2/3", background: "#e8e0d4" }}>
                {selectedItem.imageUrl
                  ? <img src={selectedItem.imageUrl} alt={selectedItem.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                      <span className="font-serif text-4xl" style={{ color: "var(--border)" }}>映</span>
                      <p className="font-serif text-xs text-center leading-snug" style={{ color: "var(--muted)" }}>{selectedItem.title}</p>
                    </div>
                }
              </div>
            </div>
            <div className="px-5 pb-6">
              <h2 className="font-serif text-xl font-bold leading-tight mb-4">{selectedItem.title}</h2>
              <div className="flex flex-col gap-3 text-sm border-t pt-4" style={{ borderColor: "var(--border)" }}>
                {[["公開年", `${selectedItem.year}年`], ["ジャンル", selectedItem.genre], ["監督", selectedItem.director]].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-start gap-2">
                    <span className="font-mono text-[10px] flex-shrink-0" style={{ color: "var(--muted)" }}>{label}</span>
                    <span className="text-right text-xs">{val}</span>
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>出演</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedItem.cast.map((name) => (
                      <span key={name} className="text-xs px-2 py-1 border" style={{ borderColor: "var(--border)" }}>{name}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      <footer className="border-t px-6 py-2 flex items-center gap-6 text-[10px] font-mono" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
        <span>映画チラシ・コレクション</span>
        <span>登録数: {chirashiList.length}件</span>
        <span className="ml-auto">© 2026</span>
      </footer>
    </div>
  )
}
