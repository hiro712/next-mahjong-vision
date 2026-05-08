"use client";

import { useState } from "react";
import { TileSvg } from "@/components/tiles/TileSvg";
import type { FuBreakdown as FuBreakdownType } from "@/types/mahjong";

interface FuBreakdownProps {
  breakdown: FuBreakdownType;
}

function FuRow({
  label,
  tiles,
  fu,
  note,
  highlight = false,
}: {
  label: string;
  tiles?: { suit: "m" | "p" | "s" | "z"; num: number; isRed?: boolean }[];
  fu: number;
  note?: string;
  highlight?: boolean;
}) {
  if (fu === 0 && !highlight) return null;

  return (
    <div
      className={`flex items-center gap-2 py-2 ${highlight ? "border-b border-neutral-100" : ""}`}
    >
      {/* 牌表示 */}
      <div className="flex gap-0.5 flex-shrink-0 w-28">
        {tiles && tiles.length > 0 ? (
          tiles.map((t, i) => <TileSvg key={i} tile={t} size="sm" />)
        ) : (
          <span className="text-xs text-neutral-500 leading-tight">
            {label}
          </span>
        )}
      </div>

      {/* 説明 */}
      <div className="flex-1 min-w-0">
        {tiles && tiles.length > 0 && (
          <p className="text-xs text-neutral-500 truncate">{note ?? label}</p>
        )}
      </div>

      {/* 符数 */}
      <span
        className={`text-sm font-mono font-medium flex-shrink-0 ${fu > 0 ? "text-neutral-900" : "text-neutral-400"}`}
      >
        {fu > 0 ? `+${fu}符` : "0符"}
      </span>
    </div>
  );
}

export function FuBreakdown({ breakdown }: FuBreakdownProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
          符数の内訳
        </p>
        <div className="flex items-center gap-1">
          <span className="text-sm font-mono font-bold text-neutral-900">
            {breakdown.total}符
          </span>
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {open && (
        <div className="space-y-0">
          {/* 副底 */}
          <FuRow label="副底（基本符）" fu={breakdown.base} highlight />

          {/* 門前加符 */}
          {breakdown.menzenRon > 0 && (
            <FuRow label="門前ロン加符" fu={breakdown.menzenRon} highlight />
          )}

          {/* ツモ符 */}
          {breakdown.tsumo > 0 && (
            <FuRow label="ツモ符" fu={breakdown.tsumo} highlight />
          )}

          {/* 面子 */}
          {breakdown.melds.length > 0 && (
            <div>
              <p className="text-xs text-neutral-400 pt-2 pb-1 border-t border-neutral-100">
                面子
              </p>
              {breakdown.melds.map((meld, i) => (
                <FuRow
                  key={i}
                  label={meld.label}
                  tiles={meld.tiles}
                  fu={meld.fu}
                  note={meld.note}
                />
              ))}
              {breakdown.melds.every((m) => m.fu === 0) && (
                <div className="flex items-center gap-2 py-1">
                  <span className="text-xs text-neutral-400">
                    全て順子（0符）
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 雀頭 */}
          {breakdown.pair && (
            <div>
              <p className="text-xs text-neutral-400 pt-2 pb-1 border-t border-neutral-100">
                雀頭
              </p>
              <FuRow
                label={breakdown.pair.note ?? "雀頭"}
                tiles={breakdown.pair.tiles}
                fu={breakdown.pair.fu}
                note={breakdown.pair.note}
              />
              {breakdown.pair.fu === 0 && (
                <div className="flex items-center gap-2 py-1">
                  {breakdown.pair.tiles.map((t, i) => (
                    <TileSvg key={i} tile={t} size="sm" />
                  ))}
                  <span className="text-xs text-neutral-400">
                    一般牌対子（0符）
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 待ち */}
          {breakdown.wait && (
            <div>
              <p className="text-xs text-neutral-400 pt-2 pb-1 border-t border-neutral-100">
                待ち
              </p>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-neutral-600">
                  {breakdown.wait.label}
                </span>
                <span className="text-sm font-mono font-medium text-neutral-900">
                  {breakdown.wait.fu > 0 ? `+${breakdown.wait.fu}符` : "0符"}
                </span>
              </div>
            </div>
          )}

          {/* 合計 */}
          <div className="border-t border-neutral-200 mt-2 pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-800">合計</p>
              {breakdown.raw !== breakdown.total && (
                <p className="text-xs text-neutral-400">
                  {breakdown.raw}符 → 10符単位切り上げ
                </p>
              )}
            </div>
            <span className="text-lg font-mono font-bold text-neutral-900">
              {breakdown.total}符
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
