"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ChartImage = { name: string; url: string };
type ChartsPayload = { bundleId: string; images: ChartImage[]; count: number };

export default function ChartsSection({ analysisId }: { analysisId: number }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ChartsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // 버튼 눌렀을 때만 로드
  useEffect(() => {
    if (!open || data) return;
    const fetchCharts = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
        const res = await fetch(
          `${base}/xbrl/analyses/${analysisId}/charts`,
          { credentials: "include" }
        );
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || `HTTP ${res.status}`);
        }
        const json: ChartsPayload = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e?.message ?? "차트 로드 실패");
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCharts();
  }, [open, data, analysisId]);

  // 서버가 주는 URL이 /static/... (상대경로) 이므로 베이스를 붙여 절대경로화
  const toAbs = (u: string) => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    return u.startsWith("/") ? `${base}${u}` : u;
  };

  // 보기 순서 고정 (파일명에 키워드가 들어있는지로 정렬)
  const orderedImages = useMemo(() => {
    if (!data?.images?.length) return [];
    const order = [
      { key: "overview", kw: ["overview"] },
      { key: "profitability", kw: ["profit"] },
      { key: "liquidity", kw: ["liquidity", "current", "quick"] },
      { key: "leverage", kw: ["leverage", "debt", "equity_multiplier"] },
      { key: "efficiency", kw: ["efficiency", "turnover"] },
    ];
    const lower = (s: string) => s.toLowerCase();

    const pick = (kw: string[]) =>
      data.images.find((img) => kw.some((k) => lower(img.name).includes(k)));

    const picked = order
      .map(({ key, kw }) => {
        const img = pick(kw);
        return img ? { key, url: toAbs(img.url), name: img.name } : null;
      })
      .filter(Boolean) as { key: string; url: string; name: string }[];

    // 남은 이미지(위 키워드에 안 걸린 것)도 뒤에 붙이기
    const used = new Set(picked.map((p) => p.name));
    const rest = data.images
      .filter((img) => !used.has(img.name))
      .map((img) => ({ key: img.name, url: toAbs(img.url), name: img.name }));

    return [...picked, ...rest];
  }, [data]);

  // 펼치면 아래로 스크롤
  useEffect(() => {
    if (open && boxRef.current) {
      boxRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [open]);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">차트 시각화</h3>
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
        >
          {open ? "차트 접기" : "📊 그래프 보기"}
        </button>
      </div>

      <div
        ref={boxRef}
        className={`transition-all overflow-hidden ${open ? "max-h-[5000px] mt-4" : "max-h-0"}`}
      >
        {open && loading && (
          <div className="p-6 text-sm text-gray-400">차트를 불러오는 중…</div>
        )}

        {open && !loading && error && (
          <div className="p-6 text-sm text-red-300">
            차트를 불러오지 못했습니다: {error}
          </div>
        )}

        {open && !loading && !error && data && data.count === 0 && (
          <div className="p-6 text-sm text-red-300">
            해당 분석에 대한 차트 이미지가 없습니다. (analysisId: {analysisId})
          </div>
        )}

        {open && !loading && !error && data && data.count > 0 && (
          <div className="space-y-4">
            <div className="text-xs text-gray-500">
              번들 ID: {data.bundleId} · 총 {data.count}장
            </div>

            <div className="grid grid-cols-1 gap-6">
              {orderedImages.map(({ key, url }) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl overflow-hidden border border-gray-800 bg-gray-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={key} className="w-full object-contain" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
