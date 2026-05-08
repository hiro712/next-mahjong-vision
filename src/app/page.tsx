"use client";

import { useCallback, useState } from "react";
import { HandDisplay } from "@/components/input/HandDisplay";
import { PhotoUpload } from "@/components/input/PhotoUpload";
import { TileSelector } from "@/components/input/TileSelector";
import { FuBreakdown } from "@/components/results/FuBreakdown";
import { ScoreDisplay } from "@/components/results/ScoreDisplay";
import { YakuList } from "@/components/results/YakuList";
import { GameSettingsPanel } from "@/components/settings/GameSettings";
import { calculateScore } from "@/lib/scoring";
import type { GameSettings, ScoreResult, Tile } from "@/types/mahjong";

const DEFAULT_SETTINGS: GameSettings = {
  playerCount: 4,
  winType: "ron",
  roundWind: "east",
  seatWind: "east",
  riichi: false,
  doubleRiichi: false,
  ippatsu: false,
  haitei: false,
  houtei: false,
  rinshan: false,
  chankan: false,
  tenhou: false,
  chiihou: false,
  doraCount: 0,
  uraDoraCount: 0,
  kitaCount: 0,
};

export default function Home() {
  const [handTiles, setHandTiles] = useState<Tile[]>([]);
  const [winTile, setWinTile] = useState<Tile | null>(null);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const isRon = settings.winType === "ron";
  const isSanma = settings.playerCount === 3;

  // ロン・ツモ共通: 手牌13枚 + 和了牌1枚
  const handleSelectTile = useCallback(
    (tile: Tile) => {
      if (handTiles.length < 13) {
        setHandTiles((prev) => [...prev, tile]);
      } else if (!winTile) {
        setWinTile(tile);
      }
      setResult(null);
      setError(null);
    },
    [handTiles.length, winTile],
  );

  const handleRemoveTile = useCallback((index: number) => {
    setHandTiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
    setError(null);
  }, []);

  const handleRemoveWinTile = useCallback(() => {
    setWinTile(null);
    setResult(null);
    setError(null);
  }, []);

  const handlePhotoRecognized = useCallback((tiles: Tile[]) => {
    // 写真から13枚 + 和了牌（14枚目）を設定
    setHandTiles(tiles.slice(0, 13));
    setWinTile(tiles.length >= 14 ? tiles[13] : null);
    setResult(null);
    setError(null);
  }, []);

  const handleSettingsChange = useCallback((next: GameSettings) => {
    setSettings(next);
    setResult(null);
    setError(null);
  }, []);

  const handleReset = useCallback(() => {
    setHandTiles([]);
    setWinTile(null);
    setResult(null);
    setError(null);
  }, []);

  const handleCalculate = useCallback(() => {
    setError(null);
    setCalculating(true);

    if (handTiles.length !== 13) {
      setError(`手牌が${handTiles.length}枚です。13枚入力してください。`);
      setCalculating(false);
      return;
    }
    if (!winTile) {
      const label = isRon ? "ロン牌" : "ツモ牌";
      setError(`${label}を選択してください。`);
      setCalculating(false);
      return;
    }

    setTimeout(() => {
      try {
        const calcResult = calculateScore(handTiles, winTile, settings);
        if (!calcResult) {
          setError("あがれません。手牌と設定を確認してください。");
        } else {
          setResult(calcResult);
          setTimeout(() => {
            document
              .getElementById("result-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      } catch {
        setError("計算エラーが発生しました。");
      }
      setCalculating(false);
    }, 50);
  }, [handTiles, winTile, settings, isRon]);

  // ロン・ツモ共通: 手牌13枚 + 和了牌があれば計算可
  const canCalculate = handTiles.length === 13 && winTile !== null;

  return (
    <main className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-neutral-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-base font-bold text-neutral-900 tracking-tight">
            麻雀ビジョン
          </h1>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors px-2 py-1 rounded"
          >
            リセット
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 手牌入力 */}
        <section className="space-y-3">
          <HandDisplay
            tiles={handTiles}
            winTile={winTile}
            onRemoveTile={handleRemoveTile}
            onRemoveWinTile={handleRemoveWinTile}
            isRon={isRon}
          />

          <div className="grid grid-cols-2 gap-2">
            <PhotoUpload onRecognized={handlePhotoRecognized} />
            <button
              type="button"
              onClick={() => setSelectorOpen((v) => !v)}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                />
              </svg>
              {selectorOpen ? "閉じる" : "手動で選ぶ"}
            </button>
          </div>

          {selectorOpen && (
            <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50">
              <TileSelector
                handTiles={handTiles}
                winTile={winTile}
                onSelectTile={handleSelectTile}
                isSanma={isSanma}
                isRon={isRon}
              />
            </div>
          )}
        </section>

        <div className="border-t border-neutral-100" />

        {/* ゲーム設定 */}
        <section>
          <GameSettingsPanel
            settings={settings}
            onChange={handleSettingsChange}
          />
        </section>

        {/* 計算ボタン */}
        <button
          type="button"
          onClick={handleCalculate}
          disabled={!canCalculate || calculating}
          className="w-full py-4 bg-neutral-900 text-white font-semibold text-base rounded-xl hover:bg-neutral-800 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {calculating ? (
            <>
              <svg
                className="animate-spin w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="3"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              計算中...
            </>
          ) : (
            "計　算　する"
          )}
        </button>

        {error && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3">
            <p className="text-sm text-neutral-700">{error}</p>
          </div>
        )}

        {/* 結果 */}
        {result && (
          <section id="result-section" className="space-y-3 pb-8">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide pt-2">
              計算結果
            </p>

            <div className="border border-neutral-200 rounded-xl p-4 bg-white">
              <YakuList
                yaku={result.yaku}
                totalHan={result.han}
                totalFu={result.fu}
                category={result.category}
              />
            </div>

            <div className="border border-neutral-200 rounded-xl p-4 bg-white">
              <FuBreakdown breakdown={result.fuBreakdown} />
            </div>

            <div className="border border-neutral-200 rounded-xl p-4 bg-white">
              <ScoreDisplay
                result={result}
                playerCount={settings.playerCount}
                seatWind={settings.seatWind}
                winType={settings.winType}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
