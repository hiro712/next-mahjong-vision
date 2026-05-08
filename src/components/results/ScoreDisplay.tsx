import type { ScoreResult } from "@/types/mahjong";

interface ScoreDisplayProps {
  result: ScoreResult;
  playerCount: number;
  seatWind: string;
  winType: "ron" | "tsumo";
}

const CATEGORY_LABELS: Record<string, string> = {
  normal: "",
  mangan: "満貫",
  haneman: "跳満",
  baiman: "倍満",
  sanbaiman: "三倍満",
  yakuman: "役満",
  double_yakuman: "ダブル役満",
};

function formatPoint(n: number): string {
  return n.toLocaleString("ja-JP");
}

export function ScoreDisplay({
  result,
  playerCount,
  seatWind,
  winType,
}: ScoreDisplayProps) {
  const isDealer = seatWind === "east";
  const categoryLabel = CATEGORY_LABELS[result.category] ?? "";
  const isSpecial = result.category !== "normal";

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
        点数
      </p>

      {/* メイン点数 */}
      <div className="text-center py-4">
        {isSpecial && (
          <p className="text-sm font-medium text-neutral-500 mb-1">
            {categoryLabel}
          </p>
        )}
        {!isSpecial && (
          <p className="text-sm text-neutral-500 mb-1">
            {result.han}翻 {result.fu}符
          </p>
        )}
        <p className="text-4xl font-bold text-neutral-900 tabular-nums">
          +{formatPoint(result.gain)}
          <span className="text-xl font-medium text-neutral-500 ml-1">点</span>
        </p>
      </div>

      {/* 支払い内訳 */}
      <div className="space-y-2 border-t border-neutral-100 pt-3">
        <p className="text-xs text-neutral-400 font-medium">支払い内訳</p>

        {winType === "ron" && result.payments.ron && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-neutral-700">放銃者</span>
            <span className="text-sm font-mono font-medium text-neutral-900">
              −{formatPoint(result.payments.ron.amount)}点
            </span>
          </div>
        )}

        {winType === "tsumo" && result.payments.tsumo && (
          <>
            {isDealer ? (
              /* 親のツモ: 全員同額 */
              <>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-neutral-700">
                    各自（{playerCount - 1}人）
                  </span>
                  <span className="text-sm font-mono font-medium text-neutral-900">
                    −{formatPoint(result.payments.tsumo.nonDealer)}点
                  </span>
                </div>
              </>
            ) : (
              /* 子のツモ: 東家と非東家で異なる */
              <>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-neutral-700">東家（親）</span>
                  <span className="text-sm font-mono font-medium text-neutral-900">
                    −{formatPoint(result.payments.tsumo.dealer)}点
                  </span>
                </div>
                {playerCount === 4 && (
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-neutral-700">非東家 × 2</span>
                    <span className="text-sm font-mono font-medium text-neutral-900">
                      −{formatPoint(result.payments.tsumo.nonDealer)}点
                    </span>
                  </div>
                )}
                {playerCount === 3 && (
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-neutral-700">西家</span>
                    <span className="text-sm font-mono font-medium text-neutral-900">
                      −{formatPoint(result.payments.tsumo.nonDealer)}点
                    </span>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* 計算式の簡易表示 */}
      {result.category === "normal" && (
        <p className="text-xs text-neutral-400 text-center">
          基本点 = {result.fu}符 × 2^({result.han}+2)
        </p>
      )}
    </div>
  );
}
