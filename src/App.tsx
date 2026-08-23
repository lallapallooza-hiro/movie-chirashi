import { useState } from "react";

const KANA_ROWS = [
  { label: "ア行", chars: ["ア", "イ", "ウ", "エ", "オ"] },
  { label: "カ行", chars: ["カ", "キ", "ク", "ケ", "コ"] },
  { label: "サ行", chars: ["サ", "シ", "ス", "セ", "ソ"] },
  { label: "タ行", chars: ["タ", "チ", "ツ", "テ", "ト"] },
  { label: "ナ行", chars: ["ナ", "ニ", "ヌ", "ネ", "ノ"] },
  { label: "ハ行", chars: ["ハ", "ヒ", "フ", "ヘ", "ホ"] },
  { label: "マ行", chars: ["マ", "ミ", "ム", "メ", "モ"] },
  { label: "ヤ行", chars: ["ヤ", "ユ", "ヨ"] },
  { label: "ラ行", chars: ["ラ", "リ", "ル", "レ", "ロ"] },
  { label: "ワ行", chars: ["ワ", "ヲ", "ン"] },
];

const DECADES = [
  "すべて", "1950年代", "1960年代", "1970年代", "1980年代",
  "1990年代", "2000年代", "2010年代", "2020年代",
];

const GENRES = [
  "すべて", "ドラマ", "アクション", "ホラー", "コメディ",
  "アニメ", "SF", "ロマンス", "ドキュメンタリー",
];

const IMAGES = [
  {
    id: "C-00241",
    url: "https://images.unsplash.com/photo-1769265095585-44764352cb77?w=280&h=400&fit=crop&auto=format",
    title: "夜霧の追跡者",
    titleKana: "ヨギリノツイセキシャ",
    year: 1974,
    decade: "1970年代",
    genre: "アクション",
    director: "鈴木 一郎",
    cast: ["田中 健", "山田 花子"],
    tags: ["白黒", "ノワール", "追跡"],
    size: "B2",
    condition: "良好",
    price: "¥3,800",
    registered: "2024-03-12",
    rarity: "レア",
  },
  {
    id: "C-00242",
    url: "https://images.unsplash.com/photo-1689045170733-bec91f0812a0?w=280&h=400&fit=crop&auto=format",
    title: "明日へのタンゴ",
    titleKana: "アシタヘノタンゴ",
    year: 1988,
    decade: "1980年代",
    genre: "ロマンス",
    director: "佐藤 美恵",
    cast: ["木村 太郎", "伊藤 京子"],
    tags: ["カラー", "音楽", "恋愛"],
    size: "B1",
    condition: "普通",
    price: "¥2,200",
    registered: "2024-02-28",
    rarity: "普通",
  },
  {
    id: "C-00243",
    url: "https://images.unsplash.com/photo-1704721211126-f67684d8e0c9?w=280&h=400&fit=crop&auto=format",
    title: "深海の宴",
    titleKana: "シンカイノウタゲ",
    year: 1963,
    decade: "1960年代",
    genre: "ホラー",
    director: "渡辺 剛",
    cast: ["高橋 恵子", "中村 光"],
    tags: ["白黒", "怪奇", "海"],
    size: "B2",
    condition: "良好",
    price: "¥6,500",
    registered: "2024-01-15",
    rarity: "激レア",
  },
  {
    id: "C-00244",
    url: "https://images.unsplash.com/photo-1678694176437-a71b3feaf895?w=280&h=400&fit=crop&auto=format",
    title: "遥かなる峠",
    titleKana: "ハルカナルトウゲ",
    year: 1952,
    decade: "1950年代",
    genre: "ドラマ",
    director: "小林 正道",
    cast: ["吉田 義男", "松本 千代"],
    tags: ["白黒", "時代劇", "山岳"],
    size: "B2",
    condition: "劣化あり",
    price: "¥4,200",
    registered: "2023-12-08",
    rarity: "レア",
  },
  {
    id: "C-00245",
    url: "https://images.unsplash.com/photo-1580940843810-6ac02e96a2eb?w=280&h=400&fit=crop&auto=format",
    title: "紅い風の季節",
    titleKana: "アカイカゼノキセツ",
    year: 1971,
    decade: "1970年代",
    genre: "ドラマ",
    director: "加藤 順子",
    cast: ["前田 誠", "坂本 麻衣"],
    tags: ["カラー", "青春", "夏"],
    size: "A1",
    condition: "良好",
    price: "¥5,100",
    registered: "2024-04-03",
    rarity: "レア",
  },
  {
    id: "C-00246",
    url: "https://images.unsplash.com/photo-1769321309399-38d9eda18370?w=280&h=400&fit=crop&auto=format",
    title: "鋼鉄の夜明け",
    titleKana: "コウテツノヨアケ",
    year: 1982,
    decade: "1980年代",
    genre: "SF",
    director: "藤田 隆",
    cast: ["西村 洋介", "林 美穂"],
    tags: ["カラー", "SF", "未来"],
    size: "B1",
    condition: "良好",
    price: "¥3,300",
    registered: "2023-11-22",
    rarity: "普通",
  },
  {
    id: "C-00247",
    url: "https://images.unsplash.com/photo-1585667055741-7a94f3397509?w=280&h=400&fit=crop&auto=format",
    title: "笑えない天才",
    titleKana: "ワラエナイテンサイ",
    year: 1995,
    decade: "1990年代",
    genre: "コメディ",
    director: "石田 幸一",
    cast: ["岡田 達也", "吉川 恵理"],
    tags: ["カラー", "笑い", "学校"],
    size: "B2",
    condition: "良好",
    price: "¥1,800",
    registered: "2024-05-11",
    rarity: "普通",
  },
  {
    id: "C-00248",
    url: "https://images.unsplash.com/photo-1602421311752-e3b1a31b4384?w=280&h=400&fit=crop&auto=format",
    title: "黒い太陽",
    titleKana: "クロイタイヨウ",
    year: 1966,
    decade: "1960年代",
    genre: "アクション",
    director: "中島 清二",
    cast: ["斎藤 武", "田村 静"],
    tags: ["白黒", "刑事", "犯罪"],
    size: "B1",
    condition: "良好",
    price: "¥7,800",
    registered: "2024-06-02",
    rarity: "激レア",
  },
  {
    id: "C-00249",
    url: "https://images.unsplash.com/photo-1706955306571-4d990815d549?w=280&h=400&fit=crop&auto=format",
    title: "東京漂流",
    titleKana: "トウキョウヒョウリュウ",
    year: 2003,
    decade: "2000年代",
    genre: "ドラマ",
    director: "村田 信一",
    cast: ["大塚 美里", "小川 健"],
    tags: ["カラー", "都市", "孤独"],
    size: "B2",
    condition: "良好",
    price: "¥2,600",
    registered: "2024-02-14",
    rarity: "普通",
  },
  {
    id: "C-00250",
    url: "https://images.unsplash.com/photo-1569793667639-dae11573b34f?w=280&h=400&fit=crop&auto=format",
    title: "銀河の伝説",
    titleKana: "ギンガノデンセツ",
    year: 1979,
    decade: "1970年代",
    genre: "アニメ",
    director: "安田 豊",
    cast: ["アニメ声優陣"],
    tags: ["アニメ", "宇宙", "冒険"],
    size: "B1",
    condition: "良好",
    price: "¥4,500",
    registered: "2023-10-30",
    rarity: "レア",
  },
  {
    id: "C-00251",
    url: "https://images.unsplash.com/photo-1771517358779-b2f515da1894?w=280&h=400&fit=crop&auto=format",
    title: "真夜中の証人",
    titleKana: "マヨナカノショウニン",
    year: 1958,
    decade: "1950年代",
    genre: "ドラマ",
    director: "橋本 義雄",
    cast: ["三浦 源次郎", "川本 葉子"],
    tags: ["白黒", "法廷", "戦後"],
    size: "B2",
    condition: "要修復",
    price: "¥5,900",
    registered: "2024-01-08",
    rarity: "激レア",
  },
  {
    id: "C-00252",
    url: "https://images.unsplash.com/photo-1784034292926-c4bb77283a0e?w=280&h=400&fit=crop&auto=format",
    title: "炎の道場",
    titleKana: "ホノオノドウジョウ",
    year: 1985,
    decade: "1980年代",
    genre: "アクション",
    director: "黒田 勝男",
    cast: ["松田 勇二", "大野 さやか"],
    tags: ["カラー", "格闘", "武道"],
    size: "B1",
    condition: "良好",
    price: "¥3,100",
    registered: "2023-09-17",
    rarity: "普通",
  },
];

const RARITY_COLOR: Record<string, string> = {
  "激レア": "bg-[#c0392b] text-white",
  "レア": "bg-[#8e44ad] text-white",
  "普通": "bg-[#7f8c8d] text-white",
};

export default function App() {
  const [query, setQuery] = useState("");
  const [decade, setDecade] = useState("すべて");
  const [genre, setGenre] = useState("すべて");
  const [activeKana, setActiveKana] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [decadeOpen, setDecadeOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);

  const filtered = IMAGES.filter((img) => {
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      img.title.toLowerCase().includes(q) ||
      img.director.toLowerCase().includes(q) ||
      img.tags.some((t) => t.includes(q));
    const matchDecade = decade === "すべて" || img.decade === decade;
    const matchGenre = genre === "すべて" || img.genre === genre;
    const matchKana =
      !activeKana || img.titleKana.startsWith(activeKana);
    return matchQuery && matchDecade && matchGenre && matchKana;
  });

  const selectedImg = IMAGES.find((i) => i.id === selected);

  const allKana = KANA_ROWS.flatMap((r) => r.chars);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      {/* Header */}
      <header style={{ background: "var(--header-bg)" }} className="text-white">
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center text-lg" style={{ background: "var(--accent)" }}>
                映
              </div>
              <div>
                <div className="font-serif text-lg font-bold tracking-wider leading-none">
                  映画チラシ・データベース
                </div>
                <div className="font-mono text-[10px] text-white/50 tracking-widest mt-0.5">
                  MOVIE CHIRASHI ARCHIVE SYSTEM
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-mono text-xs text-white/50">
              登録数: <span className="text-white font-bold">{IMAGES.length.toLocaleString()}</span> 件
            </span>
            <button
              className="text-xs px-4 py-2 border border-white/20 hover:border-white/60 transition-colors"
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              + 新規登録
            </button>
          </div>
        </div>

        {/* Navigation bar */}
        <nav className="px-6 py-3 flex items-center gap-6 border-b border-white/10 text-sm">
          <span className="text-white/40 font-mono text-xs">NAV</span>

          {/* Decade dropdown */}
          <div className="relative">
            <button
              onClick={() => { setDecadeOpen(!decadeOpen); setGenreOpen(false); }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-xs"
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              <span>公開年代</span>
              <span className="text-white/40">▾</span>
              {decade !== "すべて" && (
                <span className="px-1.5 py-0.5 text-[10px]" style={{ background: "var(--accent)" }}>
                  {decade}
                </span>
              )}
            </button>
            {decadeOpen && (
              <div
                className="absolute top-full left-0 mt-1 z-50 border border-white/10 py-1 min-w-[140px]"
                style={{ background: "var(--header-bg)" }}
              >
                {DECADES.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDecade(d); setDecadeOpen(false); }}
                    className={`block w-full text-left px-4 py-2 text-xs transition-colors ${
                      decade === d ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                    style={{
                      fontFamily: "'Noto Sans JP', sans-serif",
                      color: decade === d ? "var(--accent)" : undefined,
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Genre dropdown */}
          <div className="relative">
            <button
              onClick={() => { setGenreOpen(!genreOpen); setDecadeOpen(false); }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-xs"
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              <span>ジャンル</span>
              <span className="text-white/40">▾</span>
              {genre !== "すべて" && (
                <span className="px-1.5 py-0.5 text-[10px]" style={{ background: "var(--accent)" }}>
                  {genre}
                </span>
              )}
            </button>
            {genreOpen && (
              <div
                className="absolute top-full left-0 mt-1 z-50 border border-white/10 py-1 min-w-[140px]"
                style={{ background: "var(--header-bg)" }}
              >
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => { setGenre(g); setGenreOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-xs transition-colors text-white/60 hover:text-white hover:bg-white/5"
                    style={{
                      fontFamily: "'Noto Sans JP', sans-serif",
                      color: genre === g ? "var(--accent)" : undefined,
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Search */}
          <div className="flex items-center border border-white/20 focus-within:border-white/50 transition-colors">
            <span className="font-mono text-[10px] text-white/30 px-2 py-1.5 border-r border-white/10">
              検索
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="作品名・監督・タグ..."
              className="bg-transparent font-mono text-xs text-white placeholder:text-white/20 outline-none px-3 py-1.5 w-48"
            />
            {query && (
              <button onClick={() => setQuery("")} className="px-2 text-white/30 hover:text-white text-xs">
                ✕
              </button>
            )}
          </div>

          <div className="ml-auto flex gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 font-mono text-xs transition-colors ${
                viewMode === "grid" ? "text-white bg-white/10" : "text-white/40 hover:text-white"
              }`}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 font-mono text-xs transition-colors ${
                viewMode === "list" ? "text-white bg-white/10" : "text-white/40 hover:text-white"
              }`}
            >
              ≡
            </button>
          </div>
        </nav>

        {/* 五十音インデックス */}
        <div className="px-6 py-3 flex items-center gap-1 flex-wrap border-b border-white/10 overflow-x-auto">
          <span className="text-white/30 font-mono text-[10px] mr-2 flex-shrink-0">五十音</span>
          <button
            onClick={() => setActiveKana(null)}
            className={`px-2.5 py-1 font-mono text-[11px] transition-colors flex-shrink-0 ${
              activeKana === null
                ? "text-white border border-white/40"
                : "text-white/40 hover:text-white/80 border border-transparent"
            }`}
          >
            全
          </button>
          {KANA_ROWS.map((row) => (
            <div key={row.label} className="flex items-center gap-0.5">
              <span className="text-white/20 font-mono text-[9px] px-1">{row.label[0]}</span>
              {row.chars.map((kana) => (
                <button
                  key={kana}
                  onClick={() => setActiveKana(activeKana === kana ? null : kana)}
                  className={`px-2 py-1 font-serif text-[11px] transition-colors flex-shrink-0 ${
                    activeKana === kana
                      ? "text-white border border-white/40"
                      : "text-white/50 hover:text-white/90 border border-transparent"
                  }`}
                >
                  {kana}
                </button>
              ))}
            </div>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {/* Result info */}
          <div
            className="px-6 py-3 flex items-center gap-3 border-b text-xs"
            style={{ borderColor: "var(--border)", background: "var(--card-bg)" }}
          >
            <span style={{ color: "var(--muted)" }}>
              {decade !== "すべて" && <span className="mr-1">【{decade}】</span>}
              {genre !== "すべて" && <span className="mr-1">【{genre}】</span>}
              {activeKana && <span className="mr-1">【{activeKana}行】</span>}
              {query && <span className="mr-1">「{query}」</span>}
            </span>
            <span className="font-bold" style={{ color: "var(--accent)" }}>
              {filtered.length}
            </span>
            <span style={{ color: "var(--muted)" }}>件 / 全{IMAGES.length}件</span>
            {(decade !== "すべて" || genre !== "すべて" || activeKana || query) && (
              <button
                onClick={() => {
                  setDecade("すべて");
                  setGenre("すべて");
                  setActiveKana(null);
                  setQuery("");
                }}
                className="ml-auto text-xs hover:underline"
                style={{ color: "var(--accent)" }}
              >
                条件をリセット
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="font-serif text-5xl" style={{ color: "var(--border)" }}>無</div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                該当するチラシが見つかりませんでした
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
              {filtered.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelected(img.id === selected ? null : img.id)}
                  className="cursor-pointer group"
                >
                  <div
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: "2/3",
                      background: "#e8e0d4",
                      outline: selected === img.id ? `2px solid var(--accent)` : "none",
                      outlineOffset: "2px",
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <div className="absolute top-1.5 right-1.5">
                      <span
                        className={`font-mono text-[8px] px-1 py-0.5 ${RARITY_COLOR[img.rarity]}`}
                      >
                        {img.rarity}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <p className="font-serif text-[10px] text-white font-bold leading-tight">
                        {img.title}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1.5">
                    <p
                      className="font-serif text-xs font-semibold leading-snug truncate"
                      style={{ color: "var(--fg)" }}
                    >
                      {img.title}
                    </p>
                    <p className="font-mono text-[9px] mt-0.5" style={{ color: "var(--muted)" }}>
                      {img.year}年 · {img.genre}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div
                className="px-6 py-2 grid gap-4 text-[10px] font-mono border-b"
                style={{
                  gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr 1fr 1fr",
                  borderColor: "var(--border)",
                  color: "var(--muted)",
                }}
              >
                {["作品情報", "年代", "ジャンル", "サイズ", "状態", "希少度", "価格"].map((h) => (
                  <span key={h} className="uppercase tracking-widest">{h}</span>
                ))}
              </div>
              {filtered.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelected(img.id === selected ? null : img.id)}
                  className="px-6 py-3 grid gap-4 border-b cursor-pointer transition-colors text-sm"
                  style={{
                    gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr 1fr 1fr",
                    borderColor: "var(--border)",
                    background: selected === img.id ? "#fff5f4" : undefined,
                    borderLeft: selected === img.id ? "3px solid var(--accent)" : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (selected !== img.id) (e.currentTarget as HTMLDivElement).style.background = "#faf8f5";
                  }}
                  onMouseLeave={(e) => {
                    if (selected !== img.id) (e.currentTarget as HTMLDivElement).style.background = "";
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 flex-shrink-0 overflow-hidden"
                      style={{ aspectRatio: "2/3", background: "#e8e0d4" }}
                    >
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>{img.id}</p>
                      <p className="font-serif font-semibold text-xs">{img.title}</p>
                      <p className="text-[10px]" style={{ color: "var(--muted)" }}>監督: {img.director}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs self-center" style={{ color: "var(--muted)" }}>{img.year}年</span>
                  <span className="text-xs self-center">{img.genre}</span>
                  <span className="font-mono text-xs self-center" style={{ color: "var(--muted)" }}>{img.size}</span>
                  <span className="text-xs self-center">{img.condition}</span>
                  <span className="self-center">
                    <span className={`text-[10px] px-1.5 py-0.5 ${RARITY_COLOR[img.rarity]}`}>
                      {img.rarity}
                    </span>
                  </span>
                  <span className="font-mono text-xs self-center font-bold" style={{ color: "var(--accent)" }}>
                    {img.price}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Detail panel */}
        {selectedImg && (
          <aside
            className="w-80 flex-shrink-0 border-l overflow-y-auto"
            style={{ borderColor: "var(--border)", background: "var(--card-bg)" }}
          >
            <div
              className="px-5 py-3 flex items-center justify-between border-b text-xs"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-mono tracking-widest" style={{ color: "var(--muted)" }}>
                DETAIL
              </span>
              <button
                onClick={() => setSelected(null)}
                className="font-mono text-xs hover:opacity-60 transition-opacity"
                style={{ color: "var(--muted)" }}
              >
                ✕ 閉じる
              </button>
            </div>

            {/* Poster */}
            <div className="p-5">
              <div
                className="mx-auto overflow-hidden shadow-lg"
                style={{ maxWidth: "200px", aspectRatio: "2/3", background: "#e8e0d4" }}
              >
                <img
                  src={selectedImg.url}
                  alt={selectedImg.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="px-5 pb-5">
              <div
                className="mb-1 font-mono text-[9px]"
                style={{ color: "var(--muted)" }}
              >
                {selectedImg.id}
              </div>
              <h2 className="font-serif text-xl font-bold leading-tight mb-1">
                {selectedImg.title}
              </h2>
              <p className="font-mono text-[10px] mb-4" style={{ color: "var(--muted)" }}>
                {selectedImg.titleKana}
              </p>

              <div
                className="flex flex-col gap-2.5 mb-5 pt-4 border-t text-xs"
                style={{ borderColor: "var(--border)" }}
              >
                {[
                  ["公開年", `${selectedImg.year}年`],
                  ["ジャンル", selectedImg.genre],
                  ["監督", selectedImg.director],
                  ["出演", selectedImg.cast.join("、")],
                  ["サイズ", selectedImg.size],
                  ["状態", selectedImg.condition],
                  ["ライセンス", selectedImg.rarity],
                  ["登録日", selectedImg.registered],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <span className="font-mono text-[10px] flex-shrink-0" style={{ color: "var(--muted)" }}>
                      {label}
                    </span>
                    <span className="text-right leading-snug">{val}</span>
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <p className="font-mono text-[10px] mb-2" style={{ color: "var(--muted)" }}>
                  タグ
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedImg.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[10px] px-2 py-1 border"
                      style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="pt-4 border-t mb-5"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-2xl font-bold" style={{ color: "var(--accent)" }}>
                    {selectedImg.price}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>（税込）</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  className="w-full py-3 text-sm text-white font-bold transition-opacity hover:opacity-80"
                  style={{ background: "var(--accent)", fontFamily: "'Noto Sans JP', sans-serif" }}
                >
                  カートに追加
                </button>
                <button
                  className="w-full py-3 text-sm border transition-colors hover:bg-[var(--bg)]"
                  style={{
                    borderColor: "var(--fg)",
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: "var(--fg)",
                  }}
                >
                  高解像度で確認
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer
        className="border-t px-6 py-2 flex items-center gap-6 text-[10px] font-mono"
        style={{ borderColor: "var(--border)", color: "var(--muted)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span>DB接続: 正常</span>
        </div>
        <span>最終更新: 2026-08-23</span>
        <span>登録数: {IMAGES.length}件</span>
        <span className="ml-auto">映画チラシ・データベース © 2026</span>
      </footer>
    </div>
  );
}
