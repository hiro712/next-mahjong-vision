import type { Suit, Tile } from "@/types/mahjong";

// Tile → majiang-core の1牌文字列（suit先頭、赤ドラは0）
// 例: 5m → "m5", 赤5p → "p0", 1z → "z1"
export function tileToMajiangStr(tile: Tile): string {
  const n = tile.isRed ? "0" : `${tile.num}`;
  return `${tile.suit}${n}`;
}

// Tile[] → majiang-core MPSZ文字列（suit先頭形式）
// 例: [2m,3m,4m,5p] → "m234p5"
export function tilesToMpsz(tiles: Tile[]): string {
  const grouped: Record<Suit, string> = { m: "", p: "", s: "", z: "" };
  for (const tile of tiles) {
    grouped[tile.suit] += tile.isRed ? "0" : `${tile.num}`;
  }
  let result = "";
  for (const suit of ["m", "p", "s", "z"] as Suit[]) {
    if (grouped[suit]) result += `${suit}${grouped[suit]}`;
  }
  return result;
}

// majiang-core MPSZ文字列 → Tile[]（suit先頭形式をパース）
// 例: "m234p56z11" → [{suit:m,num:2}, {suit:m,num:3}, ...]
// 0 は赤ドラ5
export function parseMpsz(mpsz: string): Tile[] {
  const tiles: Tile[] = [];
  for (const groupMatch of mpsz.matchAll(/([mpsz])(\d+)/g)) {
    const suit = groupMatch[1] as Suit;
    for (const digitMatch of groupMatch[2].matchAll(/\d/g)) {
      const n = Number.parseInt(digitMatch[0], 10);
      if (n === 0) {
        tiles.push({ suit, num: 5, isRed: true });
      } else {
        tiles.push({ suit, num: n });
      }
    }
  }
  return tiles;
}

// 牌が幺九牌（1・9・字牌）か
export function isYaochu(tile: Tile): boolean {
  if (tile.suit === "z") return true;
  return tile.num === 1 || tile.num === 9;
}

// 字牌の漢字表示
// majiang-core の z牌順: 1z=東 2z=南 3z=西 4z=北 5z=白 6z=發 7z=中
const ZI_LABELS: Record<number, string> = {
  1: "東",
  2: "南",
  3: "西",
  4: "北",
  5: "白",
  6: "發",
  7: "中",
};

export function tileLabel(tile: Tile): string {
  if (tile.suit === "z") return ZI_LABELS[tile.num] ?? "?";
  return `${tile.num}`;
}

export function suitLabel(suit: Suit): string {
  return { m: "萬", p: "筒", s: "索", z: "" }[suit];
}

// 牌の一意キー（重複管理用）
export function tileKey(tile: Tile): string {
  return `${tile.suit}${tile.num}${tile.isRed ? "r" : ""}`;
}

// 最大枚数チェック（同じ牌は赤含め最大4枚）
export function countTile(tiles: Tile[], tile: Tile): number {
  return tiles.filter((t) => t.suit === tile.suit && t.num === tile.num).length;
}
