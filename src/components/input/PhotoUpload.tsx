"use client";

import { useRef, useState } from "react";
import { parseMpsz } from "@/lib/tileUtils";
import type { Tile } from "@/types/mahjong";

interface PhotoUploadProps {
  onRecognized: (tiles: Tile[]) => void;
}

export function PhotoUpload({ onRecognized }: PhotoUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/recognize", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "認識に失敗しました",
        );
      }

      const data = (await res.json()) as { mpsz: string };
      const tiles = parseMpsz(data.mpsz);

      if (tiles.length === 0) {
        throw new Error("牌を認識できませんでした。写真を確認してください。");
      }

      onRecognized(tiles);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-uploaded
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" stroke="#D4D4D4" strokeWidth="3" />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="#171717"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <span>認識中...</span>
          </>
        ) : (
          <>
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
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
              />
            </svg>
            <span>写真で読み込む</span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        aria-label="牌の写真を選択"
      />

      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      <p className="text-xs text-neutral-400 text-center">
        AIが手牌を自動認識します（後から修正可）
      </p>
    </div>
  );
}
