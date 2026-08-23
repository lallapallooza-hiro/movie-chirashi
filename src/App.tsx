import { useState } from "react"

// ===== データの型定義 =====
// ここに管理したい項目を定義しています
type Chirashi = {
  id: string
  imageUrl: string
  title: string // タイトル（日本語 or 英語）
  titleKana: string // 五十音検索用のよみがな（英字タイトルは "英数字" を指定）
  year: number // 公開年
  genre: string // ジャンル
  director: string // 監督名
  cast: string[] // 出演者リスト
}

// ===== サンプルデータ =====
// 実際には自分のチラシ情報に差し替えてください
const CHIRASHI_LIST: Chirashi[] = [
  {
    id: "C-001",
    imageUrl:
      "https://images.unsplash.com/photo-1769265095585-44764352cb77?w=280&h=400&fit=crop&auto=format",
    title: "夜霧の追跡者",
    titleKana: "ヤ",
    year: 1974,
    genre: "アクション",
    director: "鈴木 一郎",
    cast: ["田中 健", "山田 花子"],
  },
  {
    id: "C-002",
    imageUrl:
      "https://images.unsplash.com/photo-1689045170733-bec91f0812a0?w=280&h=400&fit=crop&auto=format",
    title: "明日へのタンゴ",
    titleKana: "ア",
    year: 1988,
    genre: "ロマンス",
    director: "佐藤 美恵",
    cast: ["木村 太郎", "伊藤 京子"],
  },
  {
    id: "C-003",
    imageUrl:
      "https://images.unsplash.com/photo-1704721211126-f67684d8e0c9?w=280&h=400&fit=crop&auto=format",
    title: "深海の宴",
    titleKana: "シ",
    year: 1963,
    genre: "ホラー",
    director: "渡辺 剛",
    cast: ["高橋 恵子", "中村 光"],
  },
  {
    id: "C-004",
    imageUrl:
      "https://images.unsplash.com/photo-1678694176437-a71b3feaf895?w=280&h=400&fit=crop&auto=format",
    title: "遥かなる峠",
    titleKana: "ハ",
    year: 1952,
    genre: "ドラマ",
    director: "小林 正道",
    cast: ["吉田 義男", "松本 千代"],
  },
  {
    id: "C-005",
    imageUrl:
      "https://images.unsplash.com/photo-1580940843810-6ac02e96a2eb?w=280&h=400&fit=crop&auto=format",
    title: "紅い風の季節",
    titleKana: "ア",
    year: 1971,
    genre: "ドラマ",
    director: "加藤 順子",
    cast: ["前田 誠", "坂本 麻衣"],
  },
  {
    id: "C-006",
    imageUrl:
      "https://images.unsplash.com/photo-1769321309399-38d9eda18370?w=280&h=400&fit=crop&auto=format",
    // 英字タイトルの場合は titleKana にタイトルの先頭文字（大文字）を入れる
    title: "Galaxy Express",
    titleKana: "G",
    year: 1982,
    genre: "SF",
    director: "藤田 隆",
    cast: ["西村 洋介", "林 美穂"],
  },
  {
    id: "C-007",
    imageUrl:
      "https://images.unsplash.com/photo-1585667055741-7a94f3397509?w=280&h=400&fit=crop&auto=format",
    title: "笑えない天才",
    titleKana: "ワ",
    year: 1995,
    genre: "コメディ",
    director: "石田 幸一",
    cast: ["岡田 達也", "吉川 恵理"],
  },
  {
    id: "C-008",
    imageUrl:
      "https://images.unsplash.com/photo-1602421311752-e3b1a31b4384?w=280&h=400&fit=crop&auto=format",
    title: "黒い太陽",
    titleKana: "ク",
    year: 1966,
    genre: "アクション",
    director: "中島 清二",
    cast: ["斎藤 武", "田村 静"],
  },
  {
    id: "C-009",
    imageUrl:
      "https://images.unsplash.com/photo-1706955306571-4d990815d549?w=280&h=400&fit=crop&auto=format",
    title: "東京漂流",
    titleKana: "ト",
    year: 2003,
    genre: "ドラマ",
    director: "村田 信一",
    cast: ["大塚 美里", "小川 健"],
  },
  {
    id: "C-010",
    imageUrl:
      "https://images.unsplash.com/photo-1569793667639-dae11573b34f?w=280&h=400&fit=crop&auto=format",
    title: "Midnight Rain",
    titleKana: "M",
    year: 1979,
    genre: "ロマンス",
    director: "安田 豊",
    cast: ["山本 敦子", "清水 隆"],
  },
  {
    id: "C-011",
    imageUrl:
      "https://images.unsplash.com/photo-1771517358779-b2f515da1894?w=280&h=400&fit=crop&auto=format",
    title: "真夜中の証人",
    titleKana: "マ",
    year: 1958,
    genre: "ドラマ",
    director: "橋本 義雄",
    cast: ["三浦 源次郎", "川本 葉子"],
  },
  {
    id: "C-012",
    imageUrl:
      "https://images.unsplash.com/photo-1784034292926-c4bb77283a0e?w=280&h=400&fit=crop&auto=format",
    title: "炎の道場",
    titleKana: "ホ",
    year: 1985,
    genre: "アクション",
    director: "黒田 勝男",
    cast: ["松田 勇二", "大野 さやか"],
  },
]

// ===== 五十音＋英数字インデックスの定義 =====
const ALPHA_INDEX = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
const DIGIT_INDEX = "0123456789".split("")

const KANA_INDEX = [
  ...ALPHA_INDEX,
  ...DIGIT_INDEX,
  "ア",
  "イ",
  "ウ",
  "エ",
  "オ",
  "カ",
  "キ",
  "ク",
  "ケ",
  "コ",
  "サ",
  "シ",
  "ス",
  "セ",
  "ソ",
  "タ",
  "チ",
  "ツ",
  "テ",
  "ト",
  "ナ",
  "ニ",
  "ヌ",
  "ネ",
  "ノ",
  "ハ",
  "ヒ",
  "フ",
  "ヘ",
  "ホ",
  "マ",
  "ミ",
  "ム",
  "メ",
  "モ",
  "ヤ",
  "ユ",
  "ヨ",
  "ラ",
  "リ",
  "ル",
  "レ",
  "ロ",
  "ワ",
  "ヲ",
  "ン",
]

const GENRES = [
  "ジャンル",
  "ドラマ",
  "アクション",
  "ホラー",
  "コメディ",
  "SF",
  "ロマンス",
  "アニメ",
]
const DECADES = [
  "公開年代",
  "1950年代",
  "1960年代",
  "1970年代",
  "1980年代",
  "1990年代",
  "2000年代",
  "2010年代",
  "2020年代",
]

function getDecade(year: number) {
  return `${Math.floor(year / 10) * 10}年代`
}

export default function App() {
  const [query, setQuery] = useState("")
  const [activeKana, setActiveKana] = useState<string | null>(null)
  const [genre, setGenre] = useState("ジャンル")
  const [decade, setDecade] = useState("公開年代")
  const [selected, setSelected] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filtered = CHIRASHI_LIST.filter((c) => {
    const q = query.toLowerCase()
    const matchQuery =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.director.toLowerCase().includes(q) ||
      c.cast.some((name) => name.toLowerCase().includes(q))
    const matchKana = !activeKana || c.titleKana === activeKana
    const matchGenre = genre === "ジャンル" || c.genre === genre
    const matchDecade = decade === "公開年代" || getDecade(c.year) === decade
    return matchQuery && matchKana && matchGenre && matchDecade
  })

  const selectedItem = CHIRASHI_LIST.find((c) => c.id === selected)

  // 検索条件をすべてリセット
  const resetAll = () => {
    setQuery("")
    setActiveKana(null)
    setGenre("ジャンル")
    setDecade("公開年代")
  }

  const hasFilter =
    query || activeKana || genre !== "ジャンル" || decade !== "公開年代"

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      {/* ===== ヘッダー ===== */}
      <header style={{ background: "var(--header-bg)" }} className="text-white">
        {/* サイトタイトル + 操作ボタン */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center text-lg font-serif font-bold"
              style={{ background: "var(--accent)" }}
            >
              映
            </div>
            <div>
              <div className="font-serif text-lg font-bold tracking-wider leading-none">
                映画チラシ・コレクション
              </div>
              <div className="font-mono text-[10px] text-white/40 mt-0.5">
                MOVIE CHIRASHI COLLECTION DATABASE
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-white/40">
              登録数:{" "}
              <span className="text-white font-bold">
                {CHIRASHI_LIST.length}
              </span>{" "}
              件
            </span>
          </div>
        </div>

        {/* 検索バー + 絞り込み */}
        <div className="px-6 py-3 flex flex-wrap items-center gap-3 border-b border-white/10">
          {/* フリーワード検索 */}
          <div className="flex items-center border border-white/20 focus-within:border-white/50 transition-colors">
            <span className="font-mono text-[10px] text-white/30 px-2 py-2 border-r border-white/10">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="タイトル・監督・出演者で検索..."
              className="bg-transparent font-mono text-xs text-white placeholder:text-white/20 outline-none px-3 py-2 w-56"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="px-2 text-white/30 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* ジャンル絞り込み */}
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="bg-transparent border border-white/20 text-white text-xs px-3 py-2 outline-none cursor-pointer"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
          >
            {GENRES.map((g) => (
              <option
                key={g}
                value={g}
                style={{ background: "#1a1410", color: "white" }}
              >
                {g}
              </option>
            ))}
          </select>

          {/* 年代絞り込み */}
          <select
            value={decade}
            onChange={(e) => setDecade(e.target.value)}
            className="bg-transparent border border-white/20 text-white text-xs px-3 py-2 outline-none cursor-pointer"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
          >
            {DECADES.map((d) => (
              <option
                key={d}
                value={d}
                style={{ background: "#1a1410", color: "white" }}
              >
                {d}
              </option>
            ))}
          </select>

          {/* リセットボタン */}
          {hasFilter && (
            <button
              onClick={resetAll}
              className="text-xs px-3 py-2 border border-white/20 hover:border-white/50 transition-colors"
              style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                color: "var(--accent)",
              }}
            >
              リセット
            </button>
          )}

          {/* グリッド/リスト切り替え */}
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 font-mono text-xs transition-colors ${
                viewMode === "grid"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white"
              }`}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 font-mono text-xs transition-colors ${
                viewMode === "list"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white"
              }`}
            >
              ≡
            </button>
          </div>
        </div>

        {/* 英数字＋五十音インデックス */}
        <div className="border-b border-white/10">
          {/* A–Z ／ 0–9 行 */}
          <div className="px-6 py-1.5 flex items-center gap-px flex-wrap border-b border-white/5">
            <span className="font-mono text-[9px] text-white/25 w-8 flex-shrink-0">
              A–Z
            </span>
            {ALPHA_INDEX.map((ch) => {
              const count = CHIRASHI_LIST.filter(
                (c) => c.titleKana === ch,
              ).length
              return (
                <button
                  key={ch}
                  onClick={() => setActiveKana(activeKana === ch ? null : ch)}
                  disabled={count === 0}
                  className={`w-6 py-1 font-mono text-[11px] transition-colors text-center ${
                    count === 0
                      ? "text-white/15 cursor-default"
                      : activeKana === ch
                        ? "text-white bg-white/10 border border-white/30"
                        : "text-white/60 hover:text-white"
                  }`}
                >
                  {ch}
                </button>
              )
            })}
            <span className="mx-1 text-white/20">|</span>
            <span className="font-mono text-[9px] text-white/25 mr-1">0–9</span>
            {DIGIT_INDEX.map((ch) => {
              const count = CHIRASHI_LIST.filter(
                (c) => c.titleKana === ch,
              ).length
              return (
                <button
                  key={ch}
                  onClick={() => setActiveKana(activeKana === ch ? null : ch)}
                  disabled={count === 0}
                  className={`w-6 py-1 font-mono text-[11px] transition-colors text-center ${
                    count === 0
                      ? "text-white/15 cursor-default"
                      : activeKana === ch
                        ? "text-white bg-white/10 border border-white/30"
                        : "text-white/60 hover:text-white"
                  }`}
                >
                  {ch}
                </button>
              )
            })}
          </div>

          {/* 五十音行 */}
          <div className="px-6 py-1.5 flex items-center gap-px flex-wrap">
            <span className="font-mono text-[9px] text-white/25 w-8 flex-shrink-0">
              五十音
            </span>
            {/* 「全」ボタン */}
            <button
              onClick={() => setActiveKana(null)}
              className={`px-2.5 py-1 font-mono text-xs transition-colors ${
                activeKana === null
                  ? "text-white bg-white/10 border border-white/30"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              全
            </button>
            {KANA_INDEX.filter(
              (k) => !ALPHA_INDEX.includes(k) && !DIGIT_INDEX.includes(k),
            ).map((kana) => {
              const count = CHIRASHI_LIST.filter(
                (c) => c.titleKana === kana,
              ).length
              return (
                <button
                  key={kana}
                  onClick={() =>
                    setActiveKana(activeKana === kana ? null : kana)
                  }
                  disabled={count === 0}
                  className={`px-2 py-1 font-serif text-xs transition-colors ${
                    count === 0
                      ? "text-white/15 cursor-default"
                      : activeKana === kana
                        ? "text-white bg-white/10 border border-white/30"
                        : "text-white/60 hover:text-white"
                  }`}
                >
                  {kana}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* ===== メインコンテンツ ===== */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {/* 件数表示 */}
          <div
            className="px-6 py-2.5 border-b text-xs flex items-center gap-2"
            style={{
              borderColor: "var(--border)",
              background: "var(--card-bg)",
            }}
          >
            <span style={{ color: "var(--muted)" }}>
              {activeKana && <span>【{activeKana}】</span>}
              {genre !== "ジャンル" && <span>【{genre}】</span>}
              {decade !== "公開年代" && <span>【{decade}】</span>}
              {query && <span>「{query}」</span>}
            </span>
            <span className="font-bold" style={{ color: "var(--accent)" }}>
              {filtered.length}
            </span>
            <span style={{ color: "var(--muted)" }}>
              件 / 全{CHIRASHI_LIST.length}件
            </span>
          </div>

          {/* 検索結果なし */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div
                className="font-serif text-5xl"
                style={{ color: "var(--border)" }}
              >
                無
              </div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                該当するチラシが見つかりませんでした
              </p>
            </div>
          )}

          {/* グリッド表示 */}
          {filtered.length > 0 && viewMode === "grid" && (
            <div
              className="p-6 grid gap-5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              }}
            >
              {filtered.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelected(c.id === selected ? null : c.id)}
                  className="cursor-pointer group"
                >
                  {/* チラシ画像（縦長2:3） */}
                  <div
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: "2/3",
                      background: "#e8e0d4",
                      outline:
                        selected === c.id ? "2px solid var(--accent)" : "none",
                      outlineOffset: "2px",
                    }}
                  >
                    <img
                      src={c.imageUrl}
                      alt={c.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* 英字タイトルバッジ */}
                    {c.titleKana === "英数字" && (
                      <div className="absolute top-1.5 left-1.5">
                        <span className="font-mono text-[8px] px-1 py-0.5 bg-black/60 text-white">
                          EN
                        </span>
                      </div>
                    )}
                    {/* ホバー時にタイトル表示 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
                      <p className="font-serif text-[10px] text-white font-bold leading-tight">
                        {c.title}
                      </p>
                    </div>
                  </div>

                  {/* タイトル・情報 */}
                  <div className="mt-2">
                    <p
                      className="font-serif text-xs font-semibold leading-snug"
                      style={{ color: "var(--fg)" }}
                    >
                      {c.title}
                    </p>
                    <p
                      className="font-mono text-[9px] mt-0.5"
                      style={{ color: "var(--muted)" }}
                    >
                      {c.year}年 · {c.genre}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* リスト表示 */}
          {filtered.length > 0 && viewMode === "list" && (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {/* ヘッダー行 */}
              <div
                className="px-6 py-2 grid text-[10px] font-mono gap-4"
                style={{
                  gridTemplateColumns: "2.5fr 1fr 1fr 2fr 2fr",
                  color: "var(--muted)",
                  borderColor: "var(--border)",
                }}
              >
                <span>タイトル</span>
                <span>公開年</span>
                <span>ジャンル</span>
                <span>監督</span>
                <span>出演</span>
              </div>

              {filtered.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelected(c.id === selected ? null : c.id)}
                  className="px-6 py-3 grid gap-4 cursor-pointer items-center transition-colors text-sm"
                  style={{
                    gridTemplateColumns: "2.5fr 1fr 1fr 2fr 2fr",
                    background: selected === c.id ? "#fff5f4" : undefined,
                    borderLeft:
                      selected === c.id
                        ? "3px solid var(--accent)"
                        : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (selected !== c.id)
                      (e.currentTarget as HTMLDivElement).style.background =
                        "#faf8f5"
                  }}
                  onMouseLeave={(e) => {
                    if (selected !== c.id)
                      (e.currentTarget as HTMLDivElement).style.background = ""
                  }}
                >
                  {/* タイトル＋サムネイル */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 flex-shrink-0 overflow-hidden"
                      style={{ aspectRatio: "2/3", background: "#e8e0d4" }}
                    >
                      <img
                        src={c.imageUrl}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-serif font-semibold text-xs leading-snug">
                        {c.title}
                      </p>
                      {c.titleKana === "英数字" && (
                        <span
                          className="font-mono text-[8px]"
                          style={{ color: "var(--muted)" }}
                        >
                          EN
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="font-mono text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    {c.year}
                  </span>
                  <span className="text-xs">{c.genre}</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {c.director}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {c.cast.slice(0, 2).join("、")}
                    {c.cast.length > 2 && " 他"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ===== 詳細パネル（クリックで表示） ===== */}
        {selectedItem && (
          <aside
            className="w-72 flex-shrink-0 border-l overflow-y-auto"
            style={{
              borderColor: "var(--border)",
              background: "var(--card-bg)",
            }}
          >
            {/* パネルヘッダー */}
            <div
              className="px-5 py-3 flex items-center justify-between border-b text-xs"
              style={{ borderColor: "var(--border)" }}
            >
              <span
                className="font-mono tracking-widest"
                style={{ color: "var(--muted)" }}
              >
                詳細情報
              </span>
              <button
                onClick={() => setSelected(null)}
                className="font-mono text-xs hover:opacity-60 transition-opacity"
                style={{ color: "var(--muted)" }}
              >
                ✕ 閉じる
              </button>
            </div>

            {/* チラシ画像 */}
            <div className="p-5">
              <div
                className="mx-auto overflow-hidden shadow-md"
                style={{
                  maxWidth: "180px",
                  aspectRatio: "2/3",
                  background: "#e8e0d4",
                }}
              >
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* 詳細情報 */}
            <div className="px-5 pb-6">
              <h2 className="font-serif text-xl font-bold leading-tight mb-4">
                {selectedItem.title}
              </h2>

              <div
                className="flex flex-col gap-3 text-sm border-t pt-4"
                style={{ borderColor: "var(--border)" }}
              >
                {[
                  ["公開年", `${selectedItem.year}年`],
                  ["ジャンル", selectedItem.genre],
                  ["監督", selectedItem.director],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    className="flex justify-between items-start gap-2"
                  >
                    <span
                      className="font-mono text-[10px] flex-shrink-0"
                      style={{ color: "var(--muted)" }}
                    >
                      {label}
                    </span>
                    <span className="text-right text-xs">{val}</span>
                  </div>
                ))}

                {/* 出演者（複数いるので別扱い） */}
                <div className="flex flex-col gap-1">
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: "var(--muted)" }}
                  >
                    出演
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedItem.cast.map((name) => (
                      <span
                        key={name}
                        className="text-xs px-2 py-1 border"
                        style={{
                          borderColor: "var(--border)",
                          color: "var(--fg)",
                        }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* フッター */}
      <footer
        className="border-t px-6 py-2 flex items-center gap-6 text-[10px] font-mono"
        style={{ borderColor: "var(--border)", color: "var(--muted)" }}
      >
        <span>映画チラシ・コレクション</span>
        <span>登録数: {CHIRASHI_LIST.length}件</span>
        <span className="ml-auto">© 2026</span>
      </footer>
    </div>
  )
}
