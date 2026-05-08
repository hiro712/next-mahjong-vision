"use client";

import { TileSvg } from "@/components/tiles/TileSvg";
import type { Tile } from "@/types/mahjong";

interface HandDisplayProps {
  tiles: Tile[]; // 13枚の手牌
  winTile: Tile | null; // ロン牌 or ツモ牌
  onRemoveTile: (index: number) => void;
  onRemoveWinTile: () => void;
  isRon: boolean;
}

export function HandDisplay({
  tiles,
  winTile,
  onRemoveTile,
  onRemoveWinTile,
  isRon,
}: HandDisplayProps) {
  const remaining = 13 - tiles.length;
  const winLabel = isRon ? "ロン牌" : "ツモ牌";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400 font-medium">手牌</span>
        <span className="text-xs text-neutral-400">{tiles.length} / 13枚</span>
      </div>

      {/* 手牌エリア */}
      <div className="flex flex-wrap gap-1 min-h-[56px] p-2 bg-neutral-50 rounded-lg border border-neutral-200">
        {tiles.map((tile, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onRemoveTile(i)}
            className="relative group"
            aria-label="牌を削除"
          >
            <TileSvg tile={tile} size="md" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
              ✕
            </span>
          </button>
        ))}
        {remaining > 0 &&
          Array.from({ length: remaining }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-9 h-[50px] rounded border border-dashed border-neutral-300 bg-white"
            />
          ))}
      </div>

      {/* 和了牌（ロン・ツモ共通） */}
      <div className="mt-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-neutral-400 font-medium">
            {winLabel}
          </span>
          {winTile && (
            <span className="text-xs text-neutral-400">（タップで削除）</span>
          )}
        </div>
        <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200 min-h-[56px]">
          {winTile ? (
            <button
              type="button"
              onClick={onRemoveWinTile}
              className="relative group"
              aria-label={`${winLabel}を削除`}
            >
              <div className="ring-2 ring-neutral-800 ring-offset-1 rounded">
                <TileSvg tile={winTile} size="md" />
              </div>
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                ✕
              </span>
            </button>
          ) : (
            <>
              <div className="w-9 h-[50px] rounded border-2 border-dashed border-neutral-400 bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-neutral-300 text-lg">+</span>
              </div>
              <span className="text-xs text-neutral-400">
                手牌13枚を選んだ後、{winLabel}を選んでください
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
