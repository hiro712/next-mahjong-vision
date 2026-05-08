"use client";

import { TileSvg } from "@/components/tiles/TileSvg";
import { countTile } from "@/lib/tileUtils";
import type { Suit, Tile } from "@/types/mahjong";

interface TileSelectorProps {
  handTiles: Tile[];
  winTile: Tile | null;
  onSelectTile: (tile: Tile) => void;
  isSanma: boolean;
  isRon: boolean;
}

const SUIT_SECTIONS: { suit: Suit; label: string; nums: number[] }[] = [
  { suit: "m", label: "萬子", nums: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { suit: "p", label: "筒子", nums: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { suit: "s", label: "索子", nums: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { suit: "z", label: "字牌", nums: [1, 2, 3, 4, 5, 6, 7] },
];

export function TileSelector({
  handTiles,
  winTile,
  onSelectTile,
  isSanma,
  isRon,
}: TileSelectorProps) {
  const allSelected = [...handTiles, ...(winTile ? [winTile] : [])];
  const totalCount = allSelected.length;

  // ロン・ツモ共通: 手牌13枚 + 和了牌1枚 = 14枚で満了
  function isFull() {
    return handTiles.length >= 13 && winTile !== null;
  }

  function isDisabled(tile: Tile): boolean {
    if (isFull()) return true;
    // 三麻: 萬子2〜8は北以外非表示（ここではdimのみ）
    if (isSanma && tile.suit === "m" && tile.num >= 2 && tile.num <= 8)
      return true;
    // 三麻: 北牌は別管理（セレクターから除外）
    if (isSanma && tile.suit === "z" && tile.num === 4) return true;
    // 同じ牌は最大4枚
    const count = countTile(allSelected, tile);
    if (tile.isRed) return count >= 1; // 赤ドラは1枚のみ
    return count >= 4;
  }

  return (
    <div className="space-y-3">
      {SUIT_SECTIONS.map((section) => {
        const tiles: Tile[] = [];
        for (const num of section.nums) {
          // 三麻: 萬子2〜8をスキップ
          if (isSanma && section.suit === "m" && num >= 2 && num <= 8) continue;
          // 三麻: 北をスキップ
          if (isSanma && section.suit === "z" && num === 4) continue;
          tiles.push({ suit: section.suit, num });
        }

        return (
          <div key={section.suit}>
            <p className="text-xs text-neutral-400 mb-1 font-medium">
              {section.label}
            </p>
            <div className="flex flex-wrap gap-1">
              {tiles.map((tile) => {
                const disabled = isDisabled(tile);
                const key = `${tile.suit}${tile.num}${tile.isRed ? "r" : ""}`;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => !disabled && onSelectTile(tile)}
                    disabled={disabled}
                    className="transition-transform active:scale-95 disabled:cursor-not-allowed"
                    aria-label={`${tile.num}${tile.suit}${tile.isRed ? " 赤" : ""}`}
                  >
                    <TileSvg tile={tile} size="sm" dim={disabled} />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-neutral-400 text-right">
        {totalCount} / 13 + {isRon ? "ロン牌" : "ツモ牌"} 枚
      </p>
    </div>
  );
}
