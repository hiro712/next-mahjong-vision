"use client";

import type {
  GameSettings,
  PlayerCount,
  RoundWind,
  SeatWind,
  WinType,
} from "@/types/mahjong";

interface GameSettingsProps {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-neutral-900 text-white"
              : "bg-white text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${disabled ? "opacity-40" : ""}`}
    >
      <span className="text-sm text-neutral-700">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
          className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-mono font-medium">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
          className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label
      className={`flex items-center gap-3 cursor-pointer ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
          checked && !disabled
            ? "bg-neutral-900 border-neutral-900"
            : "bg-white border-neutral-300"
        }`}
      >
        {checked && (
          <svg
            viewBox="0 0 12 10"
            width="10"
            height="8"
            fill="none"
            aria-hidden
          >
            <path
              d="M1 5l3.5 3.5L11 1"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span className="text-sm text-neutral-700">{label}</span>
      {hint && <span className="text-xs text-neutral-400 ml-auto">{hint}</span>}
    </label>
  );
}

export function GameSettingsPanel({ settings, onChange }: GameSettingsProps) {
  function update(patch: Partial<GameSettings>) {
    const next = { ...settings, ...patch };

    // 矛盾を自動解決
    if (patch.riichi) {
      next.doubleRiichi = false;
    }
    if (patch.doubleRiichi) {
      next.riichi = false;
    }
    if (!next.riichi && !next.doubleRiichi) {
      next.ippatsu = false;
      next.uraDoraCount = 0;
    }
    if (next.winType === "ron") {
      next.haitei = false;
      next.rinshan = false;
    }
    if (next.winType === "tsumo") {
      next.houtei = false;
      next.chankan = false;
    }
    if (next.tenhou) {
      next.chiihou = false;
    }
    if (next.chiihou) {
      next.tenhou = false;
    }

    // 三麻: 北家なし
    if (next.playerCount === 3 && next.seatWind === "north") {
      next.seatWind = "west";
    }

    onChange(next);
  }

  const isTsumo = settings.winType === "tsumo";
  const isRon = settings.winType === "ron";
  const hasRiichi = settings.riichi || settings.doubleRiichi;
  const isSanma = settings.playerCount === 3;

  const seatWindOptions4 = [
    { label: "東", value: "east" as SeatWind },
    { label: "南", value: "south" as SeatWind },
    { label: "西", value: "west" as SeatWind },
    { label: "北", value: "north" as SeatWind },
  ];
  const seatWindOptions3 = seatWindOptions4.slice(0, 3);

  return (
    <div className="space-y-5">
      {/* 基本設定 */}
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            人数
          </label>
          <SegmentedControl
            options={[
              { label: "4人麻雀", value: "4" },
              { label: "3人麻雀", value: "3" },
            ]}
            value={String(settings.playerCount)}
            onChange={(v) => update({ playerCount: Number(v) as PlayerCount })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            あがり方
          </label>
          <SegmentedControl
            options={[
              { label: "ロン", value: "ron" },
              { label: "ツモ", value: "tsumo" },
            ]}
            value={settings.winType}
            onChange={(v) => update({ winType: v as WinType })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              場風
            </label>
            <SegmentedControl
              options={[
                { label: "東場", value: "east" },
                { label: "南場", value: "south" },
              ]}
              value={settings.roundWind}
              onChange={(v) => update({ roundWind: v as RoundWind })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              自風
            </label>
            <SegmentedControl
              options={isSanma ? seatWindOptions3 : seatWindOptions4}
              value={settings.seatWind}
              onChange={(v) => update({ seatWind: v as SeatWind })}
            />
          </div>
        </div>
      </div>

      {/* 特殊条件 */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
          特殊条件
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Checkbox
            label="立直"
            checked={settings.riichi}
            onChange={(v) => update({ riichi: v })}
          />
          <Checkbox
            label="ダブル立直"
            checked={settings.doubleRiichi}
            onChange={(v) => update({ doubleRiichi: v })}
          />
          <Checkbox
            label="一発"
            checked={settings.ippatsu}
            onChange={(v) => update({ ippatsu: v })}
            disabled={!hasRiichi}
            hint={!hasRiichi ? "立直時のみ" : undefined}
          />
          <Checkbox
            label="海底撈月"
            checked={settings.haitei}
            onChange={(v) => update({ haitei: v })}
            disabled={isRon}
            hint={isRon ? "ツモ時のみ" : undefined}
          />
          <Checkbox
            label="河底撈魚"
            checked={settings.houtei}
            onChange={(v) => update({ houtei: v })}
            disabled={isTsumo}
            hint={isTsumo ? "ロン時のみ" : undefined}
          />
          <Checkbox
            label="嶺上開花"
            checked={settings.rinshan}
            onChange={(v) => update({ rinshan: v })}
            disabled={isRon}
            hint={isRon ? "ツモ時のみ" : undefined}
          />
          <Checkbox
            label="槍槓"
            checked={settings.chankan}
            onChange={(v) => update({ chankan: v })}
            disabled={isTsumo}
            hint={isTsumo ? "ロン時のみ" : undefined}
          />
          <Checkbox
            label="天和"
            checked={settings.tenhou}
            onChange={(v) => update({ tenhou: v })}
            disabled={isTsumo === false || settings.seatWind !== "east"}
            hint={settings.seatWind !== "east" ? "東家のみ" : undefined}
          />
          <Checkbox
            label="地和"
            checked={settings.chiihou}
            onChange={(v) => update({ chiihou: v })}
            disabled={isTsumo === false || settings.seatWind === "east"}
            hint={settings.seatWind === "east" ? "子のみ" : undefined}
          />
        </div>
      </div>

      {/* ドラ */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
          ドラ
        </p>
        <div className="space-y-2">
          <NumberInput
            label="ドラ枚数"
            value={settings.doraCount}
            onChange={(v) => update({ doraCount: v })}
          />
          <NumberInput
            label="裏ドラ枚数"
            value={settings.uraDoraCount}
            onChange={(v) => update({ uraDoraCount: v })}
            disabled={!hasRiichi}
          />
          {isSanma && (
            <NumberInput
              label="抜きドラ（北）"
              value={settings.kitaCount}
              onChange={(v) => update({ kitaCount: v })}
              max={4}
            />
          )}
        </div>
      </div>
    </div>
  );
}
