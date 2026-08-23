import { useState } from "react";

const IMAGES = [
  {
    id: "IMG-00241",
    url: "https://images.unsplash.com/photo-1498262257252-c282316270bc?w=400&h=300&fit=crop&auto=format",
    title: "曲線建築リブ構造",
    photographer: "Erik Eastman",
    category: "建築",
    tags: ["白", "曲線", "光と影", "ミニマル"],
    width: 3264,
    height: 4896,
    size: "14.2 MB",
    format: "JPG",
    date: "2024-03-12",
    license: "CC-BY",
    resolution: "300 DPI",
  },
  {
    id: "IMG-00242",
    url: "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?w=400&h=300&fit=crop&auto=format",
    title: "コンクリートビル低角度",
    photographer: "Anders Jildén",
    category: "都市",
    tags: ["グレー", "ビル", "低角度", "昼間"],
    width: 2400,
    height: 1600,
    size: "8.7 MB",
    format: "JPG",
    date: "2024-02-28",
    license: "CC-BY",
    resolution: "300 DPI",
  },
  {
    id: "IMG-00243",
    url: "https://images.unsplash.com/photo-1493397212122-2b85dda8106b?w=400&h=300&fit=crop&auto=format",
    title: "ウェーブファサード",
    photographer: "Maarten Deckers",
    category: "建築",
    tags: ["波形", "青空", "現代建築"],
    width: 3857,
    height: 2571,
    size: "11.4 MB",
    format: "JPG",
    date: "2024-01-15",
    license: "RF",
    resolution: "240 DPI",
  },
  {
    id: "IMG-00244",
    url: "https://images.unsplash.com/photo-1486551937199-baf066858de7?w=400&h=300&fit=crop&auto=format",
    title: "湾曲メタルパネル",
    photographer: "Ricardo Gomez Angel",
    category: "テクスチャ",
    tags: ["白黒", "金属", "反復パターン", "湾曲"],
    width: 5941,
    height: 5445,
    size: "22.1 MB",
    format: "JPG",
    date: "2023-12-08",
    license: "CC0",
    resolution: "300 DPI",
  },
  {
    id: "IMG-00245",
    url: "https://images.unsplash.com/photo-1562185363-aa9551ce00d4?w=400&h=300&fit=crop&auto=format",
    title: "円形屋上俯瞰",
    photographer: "Ivan Bandura",
    category: "航空",
    tags: ["白", "円形", "コンクリート", "俯瞰"],
    width: 4032,
    height: 3024,
    size: "9.8 MB",
    format: "JPG",
    date: "2024-04-03",
    license: "CC-BY",
    resolution: "300 DPI",
  },
  {
    id: "IMG-00246",
    url: "https://images.unsplash.com/photo-1486718448742-163732cd1544?w=400&h=300&fit=crop&auto=format",
    title: "ブラウン波状構造",
    photographer: "Ricardo Gomez Angel",
    category: "テクスチャ",
    tags: ["ブラウン", "波状", "ミニマリズム"],
    width: 4392,
    height: 6587,
    size: "17.3 MB",
    format: "JPG",
    date: "2023-11-22",
    license: "RF",
    resolution: "240 DPI",
  },
  {
    id: "IMG-00247",
    url: "https://images.unsplash.com/photo-1462556791646-c201b8241a94?w=400&h=300&fit=crop&auto=format",
    title: "カーテンウォールビル",
    photographer: "Héctor J. Rivas",
    category: "都市",
    tags: ["低角度", "ガラス", "現代"],
    width: 2896,
    height: 1944,
    size: "7.2 MB",
    format: "JPG",
    date: "2024-05-11",
    license: "CC0",
    resolution: "300 DPI",
  },
  {
    id: "IMG-00248",
    url: "https://images.unsplash.com/photo-1527576539890-dfa815648363?w=400&h=300&fit=crop&auto=format",
    title: "アクセルタワー外観",
    photographer: "Joakim Nådell",
    category: "建築",
    tags: ["コペンハーゲン", "湾曲", "空"],
    width: 3994,
    height: 4992,
    size: "13.6 MB",
    format: "JPG",
    date: "2024-06-02",
    license: "CC-BY",
    resolution: "300 DPI",
  },
  {
    id: "IMG-00249",
    url: "https://images.unsplash.com/photo-1546349851-64285be8e9fa?w=400&h=300&fit=crop&auto=format",
    title: "ダイヤモンドパターン壁",
    photographer: "Victor G",
    category: "テクスチャ",
    tags: ["ダイヤモンド", "繰り返し", "空"],
    width: 3456,
    height: 5184,
    size: "16.8 MB",
    format: "JPG",
    date: "2024-02-14",
    license: "RF",
    resolution: "240 DPI",
  },
  {
    id: "IMG-00250",
    url: "https://images.unsplash.com/photo-1532680678473-a16f2cda8e43?w=400&h=300&fit=crop&auto=format",
    title: "デジタルグレー壁紙",
    photographer: "Christian Holzinger",
    category: "デジタル",
    tags: ["グレー", "デジタル", "抽象"],
    width: 6000,
    height: 4000,
    size: "19.4 MB",
    format: "JPG",
    date: "2023-10-30",
    license: "CC0",
    resolution: "300 DPI",
  },
  {
    id: "IMG-00251",
    url: "https://images.unsplash.com/photo-1497604401993-f2e922e5cb0a?w=400&h=300&fit=crop&auto=format",
    title: "ガラスビル仰角",
    photographer: "Joel Filipe",
    category: "都市",
    tags: ["ガラス", "仰角", "青"],
    width: 3346,
    height: 5472,
    size: "15.7 MB",
    format: "JPG",
    date: "2024-01-08",
    license: "CC-BY",
    resolution: "300 DPI",
  },
  {
    id: "IMG-00252",
    url: "https://images.unsplash.com/photo-1463130456064-77fda7f96d6b?w=400&h=300&fit=crop&auto=format",
    title: "白コンクリート壁面",
    photographer: "Christian Perner",
    category: "テクスチャ",
    tags: ["白", "コンクリート", "ミニマル"],
    width: 5184,
    height: 3456,
    size: "12.9 MB",
    format: "JPG",
    date: "2023-09-17",
    license: "CC0",
    resolution: "300 DPI",
  },
];

const CATEGORIES = ["すべて", "建築", "都市", "テクスチャ", "航空", "デジタル"];
const LICENSES = ["すべて", "CC-BY", "CC0", "RF"];
const FORMATS = ["すべて", "JPG", "PNG", "TIFF"];
const SORT_OPTIONS = ["新着順", "古い順", "ファイルサイズ大", "解像度高"];

export default function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("すべて");
  const [license, setLicense] = useState("すべて");
  const [format, setFormat] = useState("すべて");
  const [sort, setSort] = useState("新着順");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const filtered = IMAGES.filter((img) => {
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      img.title.toLowerCase().includes(q) ||
      img.tags.some((t) => t.includes(q)) ||
      img.photographer.toLowerCase().includes(q);
    const matchCat = category === "すべて" || img.category === category;
    const matchLic = license === "すべて" || img.license === license;
    const matchFmt = format === "すべて" || img.format === format;
    const matchTags =
      activeTags.length === 0 || activeTags.every((t) => img.tags.includes(t));
    return matchQuery && matchCat && matchLic && matchFmt && matchTags;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "新着順") return b.date.localeCompare(a.date);
    if (sort === "古い順") return a.date.localeCompare(b.date);
    if (sort === "ファイルサイズ大")
      return parseFloat(b.size) - parseFloat(a.size);
    return b.resolution.localeCompare(a.resolution);
  });

  const selectedImg = IMAGES.find((i) => i.id === selected);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const allTags = Array.from(new Set(IMAGES.flatMap((i) => i.tags)));

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#d4d4d4] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#e84530]" />
            <span className="font-mono text-sm font-bold tracking-[0.12em] uppercase">
              ImageDB
            </span>
          </div>
          <div className="h-5 w-px bg-[#d4d4d4]" />
          <span className="font-mono text-xs text-[#6b6b6b] tracking-widest uppercase">
            Search System v2.4
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-[#6b6b6b]">
            {IMAGES.length} assets indexed
          </span>
          <button className="font-mono text-xs border border-[#0a0a0a] px-4 py-2 hover:bg-[#0a0a0a] hover:text-white transition-colors duration-150">
            + アップロード
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#d4d4d4] flex-shrink-0 overflow-y-auto">
          <div className="p-6 border-b border-[#d4d4d4]">
            <p className="font-mono text-[10px] text-[#6b6b6b] tracking-widest uppercase mb-3">
              カテゴリ
            </p>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-left px-3 py-2 font-mono text-xs tracking-wide transition-colors duration-100 ${
                    category === cat
                      ? "bg-[#e84530] text-white"
                      : "hover:bg-[#f0f0f0] text-[#0a0a0a]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border-b border-[#d4d4d4]">
            <p className="font-mono text-[10px] text-[#6b6b6b] tracking-widest uppercase mb-3">
              ライセンス
            </p>
            <div className="flex flex-col gap-1">
              {LICENSES.map((lic) => (
                <button
                  key={lic}
                  onClick={() => setLicense(lic)}
                  className={`text-left px-3 py-2 font-mono text-xs tracking-wide transition-colors duration-100 ${
                    license === lic
                      ? "bg-[#0a0a0a] text-white"
                      : "hover:bg-[#f0f0f0] text-[#0a0a0a]"
                  }`}
                >
                  {lic}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border-b border-[#d4d4d4]">
            <p className="font-mono text-[10px] text-[#6b6b6b] tracking-widest uppercase mb-3">
              フォーマット
            </p>
            <div className="flex flex-col gap-1">
              {FORMATS.map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`text-left px-3 py-2 font-mono text-xs tracking-wide transition-colors duration-100 ${
                    format === fmt
                      ? "bg-[#0a0a0a] text-white"
                      : "hover:bg-[#f0f0f0] text-[#0a0a0a]"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <p className="font-mono text-[10px] text-[#6b6b6b] tracking-widest uppercase mb-3">
              タグフィルター
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`font-mono text-[10px] px-2 py-1 border transition-colors duration-100 ${
                    activeTags.includes(tag)
                      ? "bg-[#e84530] border-[#e84530] text-white"
                      : "border-[#d4d4d4] text-[#6b6b6b] hover:border-[#0a0a0a] hover:text-[#0a0a0a]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {activeTags.length > 0 && (
              <button
                onClick={() => setActiveTags([])}
                className="mt-3 font-mono text-[10px] text-[#e84530] hover:underline"
              >
                クリア ({activeTags.length})
              </button>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar + controls */}
          <div className="border-b border-[#d4d4d4] px-6 py-4 flex items-center gap-4">
            <div className="flex-1 flex items-center border border-[#d4d4d4] focus-within:border-[#0a0a0a] transition-colors">
              <span className="font-mono text-xs text-[#6b6b6b] px-3 border-r border-[#d4d4d4] py-2.5 select-none">
                /search
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="キーワード、タグ、撮影者で検索..."
                className="flex-1 font-mono text-sm px-4 py-2.5 outline-none placeholder:text-[#b0b0b0]"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="px-3 py-2.5 font-mono text-xs text-[#6b6b6b] hover:text-[#0a0a0a]"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="font-mono text-xs border border-[#d4d4d4] px-3 py-2.5 outline-none hover:border-[#0a0a0a] cursor-pointer bg-white"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>

              <div className="flex border border-[#d4d4d4]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2.5 font-mono text-xs transition-colors ${
                    viewMode === "grid"
                      ? "bg-[#0a0a0a] text-white"
                      : "text-[#6b6b6b] hover:bg-[#f0f0f0]"
                  }`}
                >
                  ⊞
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2.5 font-mono text-xs border-l border-[#d4d4d4] transition-colors ${
                    viewMode === "list"
                      ? "bg-[#0a0a0a] text-white"
                      : "text-[#6b6b6b] hover:bg-[#f0f0f0]"
                  }`}
                >
                  ≡
                </button>
              </div>
            </div>
          </div>

          {/* Result count */}
          <div className="px-6 py-2.5 border-b border-[#d4d4d4] flex items-center gap-3">
            <span className="font-mono text-[10px] text-[#6b6b6b] tracking-widest uppercase">
              結果:
            </span>
            <span className="font-mono text-[10px] font-bold">
              {sorted.length}
            </span>
            <span className="font-mono text-[10px] text-[#6b6b6b]">
              / {IMAGES.length} 件
            </span>
            {(query || category !== "すべて" || activeTags.length > 0) && (
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("すべて");
                  setLicense("すべて");
                  setFormat("すべて");
                  setActiveTags([]);
                }}
                className="ml-auto font-mono text-[10px] text-[#e84530] hover:underline"
              >
                フィルターをリセット
              </button>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="font-mono text-4xl text-[#d4d4d4]">∅</div>
                <p className="font-mono text-sm text-[#6b6b6b]">
                  検索条件に一致する画像がありません
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="p-6 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sorted.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelected(img.id === selected ? null : img.id)}
                    className={`group cursor-pointer border transition-all duration-150 ${
                      selected === img.id
                        ? "border-[#e84530]"
                        : "border-[#d4d4d4] hover:border-[#0a0a0a]"
                    }`}
                  >
                    <div className="relative overflow-hidden bg-[#f0f0f0] aspect-[4/3]">
                      <img
                        src={img.url}
                        alt={img.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="font-mono text-[9px] bg-white/90 px-1.5 py-0.5 text-[#0a0a0a]">
                          {img.license}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="font-mono text-[9px] bg-[#e84530] px-1.5 py-0.5 text-white">
                          {img.format}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-mono text-[9px] text-[#6b6b6b] mb-1">
                        {img.id}
                      </p>
                      <p className="text-xs font-semibold leading-tight mb-2 line-clamp-1">
                        {img.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-[#6b6b6b]">
                          {img.width}×{img.height}
                        </span>
                        <span className="font-mono text-[9px] text-[#6b6b6b]">
                          {img.size}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-[#d4d4d4]">
                {/* List header */}
                <div className="px-6 py-2 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4">
                  {["画像情報", "カテゴリ", "解像度", "サイズ", "ライセンス", "日付"].map((h) => (
                    <span key={h} className="font-mono text-[9px] text-[#6b6b6b] uppercase tracking-widest">
                      {h}
                    </span>
                  ))}
                </div>
                {sorted.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelected(img.id === selected ? null : img.id)}
                    className={`px-6 py-3 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center cursor-pointer transition-colors duration-100 ${
                      selected === img.id
                        ? "bg-[#fff5f4] border-l-2 border-l-[#e84530]"
                        : "hover:bg-[#f5f5f5]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 flex-shrink-0 overflow-hidden bg-[#f0f0f0]">
                        <img
                          src={img.url}
                          alt={img.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-mono text-[9px] text-[#6b6b6b]">
                          {img.id}
                        </p>
                        <p className="text-xs font-medium line-clamp-1">
                          {img.title}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#6b6b6b]">
                      {img.category}
                    </span>
                    <span className="font-mono text-xs text-[#6b6b6b]">
                      {img.width}×{img.height}
                    </span>
                    <span className="font-mono text-xs text-[#6b6b6b]">
                      {img.size}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 w-fit ${
                        img.license === "CC0"
                          ? "bg-[#e8f5e9] text-[#2e7d32]"
                          : img.license === "CC-BY"
                          ? "bg-[#e3f2fd] text-[#1565c0]"
                          : "bg-[#f3e5f5] text-[#6a1b9a]"
                      }`}
                    >
                      {img.license}
                    </span>
                    <span className="font-mono text-xs text-[#6b6b6b]">
                      {img.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Detail Panel */}
        {selectedImg && (
          <aside className="w-72 border-l border-[#d4d4d4] flex-shrink-0 overflow-y-auto">
            <div className="border-b border-[#d4d4d4] px-5 py-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#6b6b6b]">
                詳細情報
              </span>
              <button
                onClick={() => setSelected(null)}
                className="font-mono text-xs text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#f0f0f0] aspect-[4/3] overflow-hidden">
              <img
                src={selectedImg.url}
                alt={selectedImg.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-5">
              <p className="font-mono text-[9px] text-[#e84530] mb-1">
                {selectedImg.id}
              </p>
              <h2 className="text-sm font-bold leading-snug mb-4">
                {selectedImg.title}
              </h2>

              <div className="flex flex-col gap-3 mb-5">
                {[
                  ["撮影者", selectedImg.photographer],
                  ["カテゴリ", selectedImg.category],
                  ["フォーマット", selectedImg.format],
                  ["解像度", `${selectedImg.width} × ${selectedImg.height} px`],
                  ["ファイルサイズ", selectedImg.size],
                  ["DPI", selectedImg.resolution],
                  ["ライセンス", selectedImg.license],
                  ["登録日", selectedImg.date],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-start gap-2">
                    <span className="font-mono text-[9px] text-[#6b6b6b] uppercase tracking-wide flex-shrink-0">
                      {label}
                    </span>
                    <span className="font-mono text-[10px] text-right">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <p className="font-mono text-[9px] text-[#6b6b6b] uppercase tracking-wide mb-2">
                  タグ
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedImg.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`font-mono text-[9px] px-2 py-1 border transition-colors ${
                        activeTags.includes(tag)
                          ? "bg-[#e84530] border-[#e84530] text-white"
                          : "border-[#d4d4d4] text-[#6b6b6b] hover:border-[#0a0a0a]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button className="w-full bg-[#e84530] text-white font-mono text-xs py-3 hover:bg-[#c73a27] transition-colors duration-150">
                  ダウンロード
                </button>
                <button className="w-full border border-[#0a0a0a] font-mono text-xs py-3 hover:bg-[#0a0a0a] hover:text-white transition-colors duration-150">
                  共有リンクをコピー
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Status bar */}
      <footer className="border-t border-[#d4d4d4] px-8 py-2 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
          <span className="font-mono text-[10px] text-[#6b6b6b]">
            DB接続: 正常
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#6b6b6b]">
          インデックス: 2026-08-23 09:41 JST
        </span>
        <span className="font-mono text-[10px] text-[#6b6b6b]">
          ストレージ: 847.3 GB / 2.0 TB
        </span>
        <div className="ml-auto">
          <span className="font-mono text-[10px] text-[#6b6b6b]">
            ImageDB © 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
