import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

// Cloudflare Workers (Edge) ランタイムを使用
// Node.js API (Buffer等) は使用不可 → Web標準APIで代替
export const runtime = "edge";

const SYSTEM_PROMPT = `あなたは麻雀牌の画像認識の専門家です。
手牌の写真から、各牌の種類を正確に認識してください。

## 牌の表記ルール（MPSZ形式・suit先頭形式）
- 萬子(マンズ): m1〜m9 (例: m1, m5, m9)
- 筒子(ピンズ): p1〜p9
- 索子(ソーズ): s1〜s9
- 字牌(ジハイ): 東=z1, 南=z2, 西=z3, 北=z4, 白=z5, 發=z6, 中=z7
- 赤ドラ(赤五): m0, p0, s0

## 出力ルール
- 手牌を左から右の順に認識してください
- suit別にまとめて出力してください（例: m234p567s234z11）
- 認識できない牌は出力から除外し、confidence を下げてください
- 赤ドラが含まれている場合は 0 で表現してください（例: 赤5筒=p0）`;

// ArrayBuffer → base64 (Web標準APIのみ使用、Node.js の Buffer 不使用)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: "画像ファイルが見つかりません" },
        { status: 400 },
      );
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "画像サイズが大きすぎます（最大10MB）" },
        { status: 400 },
      );
    }

    const buffer = await imageFile.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    const mimeType = imageFile.type || "image/jpeg";

    const result = await generateObject({
      model: openai("gpt-4.1-mini"),
      schema: z.object({
        mpsz: z
          .string()
          .describe(
            "認識した手牌のMPSZ形式文字列（suit先頭: m234p567s234z11 のような形式）",
          ),
        confidence: z.number().min(0).max(1).describe("認識の信頼度（0〜1）"),
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: SYSTEM_PROMPT,
            },
            {
              type: "image",
              image: `data:${mimeType};base64,${base64}`,
            },
            {
              type: "text",
              text: "この画像の手牌をMPSZ形式で返してください。",
            },
          ],
        },
      ],
    });

    return NextResponse.json({
      mpsz: result.object.mpsz,
      confidence: result.object.confidence,
    });
  } catch (error) {
    console.error("Vision API error:", error);
    return NextResponse.json(
      { error: "画像認識に失敗しました。もう一度お試しください。" },
      { status: 500 },
    );
  }
}
