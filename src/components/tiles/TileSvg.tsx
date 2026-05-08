import type { Tile } from "@/types/mahjong";

interface TileSvgProps {
  tile: Tile;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  dim?: boolean;
}

const SIZE_MAP = {
  sm: { w: 28, h: 38 },
  md: { w: 40, h: 54 },
  lg: { w: 52, h: 70 },
};

// /public/images/hai/{suit}{num}.gif への対応
// majiang-core の字牌順: 1z=東 2z=南 3z=西 4z=北 5z=白 6z=發 7z=中
function tileImagePath(tile: Tile): string {
  // 赤ドラは通常の5と同じ画像を使用（赤バッジで区別）
  return `/images/hai/${tile.suit}${tile.num}.gif`;
}

export function TileSvg({
  tile,
  size = "md",
  selected = false,
  dim = false,
}: TileSvgProps) {
  const { w, h } = SIZE_MAP[size];
  const isRed = tile.isRed ?? false;

  return (
    <div
      style={{
        width: w,
        height: h,
        flexShrink: 0,
        position: "relative",
        display: "inline-block",
        opacity: dim ? 0.3 : 1,
        borderRadius: 3,
        outline: selected ? "2px solid #0a0a0a" : "none",
        outlineOffset: 1,
        filter: selected
          ? "drop-shadow(0 2px 6px rgba(0,0,0,0.35))"
          : "drop-shadow(0 1px 2px rgba(0,0,0,0.12))",
      }}
      aria-label={`${tile.num}${tile.suit}${isRed ? "r" : ""}`}
    >
      {/* 牌画像 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tileImagePath(tile)}
        alt={`${tile.num}${tile.suit}`}
        width={w}
        height={h}
        style={{
          width: w,
          height: h,
          objectFit: "fill",
          display: "block",
          borderRadius: 3,
        }}
      />

      {/* 赤ドラバッジ */}
      {isRed && (
        <span
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            background: "#dc2626",
            color: "white",
            fontSize: size === "sm" ? 6 : size === "md" ? 7 : 8,
            fontWeight: 700,
            lineHeight: 1,
            padding: "1px 2px",
            borderRadius: 2,
            pointerEvents: "none",
          }}
        >
          赤
        </span>
      )}
    </div>
  );
}
