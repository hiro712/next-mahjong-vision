import type { ScoreCategory, Yaku } from "@/types/mahjong";

interface YakuListProps {
  yaku: Yaku[];
  totalHan: number;
  totalFu: number;
  category: ScoreCategory;
}

const CATEGORY_LABEL: Record<ScoreCategory, string> = {
  normal: "",
  mangan: "満貫",
  haneman: "跳満",
  baiman: "倍満",
  sanbaiman: "三倍満",
  yakuman: "役満",
  double_yakuman: "ダブル役満",
};

export function YakuList({ yaku, totalHan, totalFu, category }: YakuListProps) {
  const isSpecial = category !== "normal";
  const categoryLabel = CATEGORY_LABEL[category];

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
        役
      </p>

      <div className="divide-y divide-neutral-100">
        {yaku.map((y, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <span className="text-sm text-neutral-800">{y.name}</span>
            <span className="text-sm font-mono font-medium text-neutral-900">
              {y.isYakuman ? "役満" : `${y.han}翻`}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-200 pt-3 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-600">合計</span>
        <div className="text-right">
          {isSpecial ? (
            <span className="text-base font-bold text-neutral-900">
              {categoryLabel}
            </span>
          ) : (
            <span className="text-base font-bold text-neutral-900">
              {totalHan}翻 {totalFu}符
            </span>
          )}
          {isSpecial &&
            category !== "yakuman" &&
            category !== "double_yakuman" && (
              <div className="text-xs text-neutral-400">
                {totalHan}翻 {totalFu}符
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
