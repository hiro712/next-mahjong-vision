import type {
  FuBreakdown,
  FuDetail,
  GameSettings,
  HuleResult,
  ScoreCategory,
  ScoreResult,
  Tile,
  Yaku,
} from "@/types/mahjong";
import { parseMpsz, tilesToMpsz } from "./tileUtils";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Majiang = require("@kobalab/majiang-core");

// 場風・自風 → majiang-core の数値（0-indexed: 東=0, 南=1, 西=2, 北=3）
function windToParamNum(wind: string): number {
  return { east: 0, south: 1, west: 2, north: 3 }[wind] ?? 0;
}

// 場風・自風 → 字牌の num（z牌: 東=1, 南=2, 西=3, 北=4）
function windToTileNum(wind: string): number {
  return { east: 1, south: 2, west: 3, north: 4 }[wind] ?? 1;
}

// 符数の端数切り上げ（10符単位）
function ceilFu(fu: number): number {
  return Math.ceil(fu / 10) * 10;
}

// 点数区分
function getCategory(han: number, fu: number, yakuman?: number): ScoreCategory {
  if (yakuman) {
    return yakuman >= 2 ? "double_yakuman" : "yakuman";
  }
  if (han >= 13) return "yakuman";
  if (han >= 11) return "sanbaiman";
  if (han >= 8) return "baiman";
  if (han >= 6) return "haneman";
  if (han >= 5) return "mangan";
  if (han === 4 && fu >= 30) return "mangan";
  if (han === 3 && fu >= 70) return "mangan";
  return "normal";
}

// 100点単位切り上げ
function ceil100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

// 基本点計算
function calcPayments(
  han: number,
  fu: number,
  isDealer: boolean,
  winType: "ron" | "tsumo",
  playerCount: number,
  yakuman?: number,
): {
  gain: number;
  ron?: number;
  tsumoDealerPays?: number;
  tsumoNonDealerPays?: number;
} {
  const YAKUMAN_BASE = 8000;

  let base: number;

  if (yakuman) {
    base = YAKUMAN_BASE * yakuman;
  } else if (han >= 13) {
    base = YAKUMAN_BASE;
  } else if (han >= 11) {
    base = 6000;
  } else if (han >= 8) {
    base = 4000;
  } else if (han >= 6) {
    base = 3000;
  } else if (han >= 5 || (han === 4 && fu >= 30) || (han === 3 && fu >= 70)) {
    base = 2000;
  } else {
    // 通常計算（満貫未満）
    base = fu * 2 ** (han + 2);
  }

  if (winType === "ron") {
    const multiplier = isDealer ? 6 : 4;
    const amount = ceil100(base * multiplier);
    return { gain: amount, ron: amount };
  }

  // ツモ
  if (isDealer) {
    const eachPays = ceil100(base * 2);
    const gain = eachPays * (playerCount - 1);
    return { gain, tsumoNonDealerPays: eachPays };
  }

  // 子のツモ
  const dealerPays = ceil100(base * 2);
  const nonDealerPays = ceil100(base);
  const gain = dealerPays + nonDealerPays * (playerCount - 2);
  return {
    gain,
    tsumoDealerPays: dealerPays,
    tsumoNonDealerPays: nonDealerPays,
  };
}

// 面子文字列を解析して符数を計算
// majiang-core のmianzi形式: "m123"(順子), "m111"(暗刻), "m1-11"(明刻), "m1111"(槓子)
function analyzeMeld(meldStr: string): {
  tiles: Tile[];
  fu: number;
  label: string;
  note: string;
} {
  // 方向マーカー(+=-) と末尾の '!' を除去してから判定
  const isOpen = /[+\-=]/.test(meldStr);
  const clean = meldStr.replace(/[+\-=!]/g, "");

  const tiles = parseMpsz(clean);
  if (tiles.length === 0) return { tiles: [], fu: 0, label: "不明", note: "" };

  const len = tiles.length;
  const isYaochu = tiles.some(
    (t) => t.suit === "z" || t.num === 1 || t.num === 9,
  );

  if (len === 2) {
    return { tiles, fu: 0, label: "対子", note: "" };
  }

  if (len === 3) {
    const sameNum = tiles.every((t) => t.num === tiles[0].num);
    if (sameNum) {
      // 刻子
      const fu = isYaochu ? (isOpen ? 4 : 8) : isOpen ? 2 : 4;
      const note = `${isYaochu ? "幺九" : "中張"}${isOpen ? "明" : "暗"}刻`;
      return { tiles, fu, label: "刻子", note };
    }
    // 順子
    return { tiles, fu: 0, label: "順子", note: "" };
  }

  if (len === 4) {
    // 槓子
    const fu = isYaochu ? (isOpen ? 16 : 32) : isOpen ? 8 : 16;
    const note = `${isYaochu ? "幺九" : "中張"}${isOpen ? "明" : "暗"}槓`;
    return { tiles, fu, label: "槓子", note };
  }

  return { tiles, fu: 0, label: "", note: "" };
}

// 待ち符数の判定
function calcWaitFu(
  mianziList: string[],
  agariSuit: string,
  agariNum: number,
): { fu: number; label: string } {
  for (const meld of mianziList) {
    const clean = meld.replace(/[+\-=!]/g, "");
    const tiles = parseMpsz(clean);
    const len = tiles.length;

    const containsAgari = tiles.some(
      (t) => t.suit === agariSuit && t.num === agariNum,
    );
    if (!containsAgari) continue;

    if (len === 2) {
      return { fu: 2, label: "単騎待ち" };
    }
    if (len === 3) {
      if (tiles.every((t) => t.num === tiles[0].num)) {
        // 刻子 → シャンポン
        return { fu: 0, label: "双碰待ち" };
      }
      // 順子
      const nums = tiles.map((t) => t.num).sort((a, b) => a - b);
      if (agariNum === nums[0] || agariNum === nums[2]) {
        if (
          (nums[0] === 1 && nums[2] === 3) ||
          (nums[0] === 7 && nums[2] === 9)
        ) {
          return { fu: 2, label: "辺張待ち" };
        }
        return { fu: 0, label: "両面待ち" };
      }
      return { fu: 2, label: "嵌張待ち" };
    }
  }
  return { fu: 0, label: "両面待ち" };
}

export function calculateScore(
  // ロン/ツモ共通: 13枚の手牌（あがり牌は winTile で別途指定）
  handTiles: Tile[],
  winTile: Tile | null, // ロン牌またはツモ牌（必須）
  settings: GameSettings,
): ScoreResult | null {
  if (!winTile) return null;

  try {
    // 13枚の手牌を MPSZ 形式に変換
    const handMpsz = tilesToMpsz(handTiles);
    const shoupai = Majiang.Shoupai.fromString(handMpsz);

    const tileNum = winTile.isRed ? "0" : `${winTile.num}`;
    const tileStr = `${winTile.suit}${tileNum}`;

    // ロンの場合: rongpai に方向マーカーを付ける
    // ツモの場合: shoupai に zimo() で手牌にツモ牌を加え、rongpai は null
    let rongpai: string | null = null;
    if (settings.winType === "ron") {
      rongpai = `${tileStr}+`;
    } else {
      // ツモ: shoupai の _zimo にツモ牌をセット
      shoupai.zimo(tileStr);
    }

    const rule = Majiang.rule();

    // param 構造: hupai サブオブジェクトに特殊条件を入れる
    const param = {
      rule,
      zhuangfeng: windToParamNum(settings.roundWind),
      menfeng: windToParamNum(settings.seatWind),
      hupai: {
        lizhi: settings.doubleRiichi ? 2 : settings.riichi ? 1 : 0,
        yifa: settings.ippatsu,
        qianggang: settings.chankan,
        lingshang: settings.rinshan,
        haidi:
          settings.winType === "tsumo"
            ? settings.haitei
              ? 1
              : 0
            : settings.houtei
              ? 2
              : 0,
        tianhu: settings.tenhou ? 1 : settings.chiihou ? 2 : 0,
      },
      // ドラはユーザー入力の枚数で手動加算するため baopai は空
      baopai: [],
      fubaopai: null,
      jicun: { changbang: 0, lizhibang: 0 },
    };

    const result: HuleResult = Majiang.Util.hule(shoupai, rongpai, param);

    if (!result || !result.hupai || result.hupai.length === 0) return null;

    // 基本役一覧（ライブラリ結果）
    const baseYaku: Yaku[] = result.hupai.map((h) => ({
      name: h.name,
      han: typeof h.fanshu === "string" ? 0 : (h.fanshu as number),
      isYakuman: typeof h.fanshu === "string",
    }));

    // ドラ各種を追加
    const redCount = handTiles.filter((t) => t.isRed).length;
    const uraHan =
      settings.riichi || settings.doubleRiichi ? settings.uraDoraCount : 0;

    const doraYaku: Yaku[] = [];
    if (settings.doraCount > 0)
      doraYaku.push({ name: "ドラ", han: settings.doraCount });
    if (redCount > 0) doraYaku.push({ name: "赤ドラ", han: redCount });
    if (uraHan > 0) doraYaku.push({ name: "裏ドラ", han: uraHan });
    if (settings.kitaCount > 0)
      doraYaku.push({ name: "抜きドラ（北）", han: settings.kitaCount });

    const yaku = [...baseYaku, ...doraYaku];

    const isYakumanHand = (result.damanguan as number | undefined) != null;

    // 翻数: 基本役（ライブラリ） + ドラ
    const baseHan: number = isYakumanHand
      ? 0
      : ((result.fanshu as number | undefined) ??
        baseYaku.reduce((s, y) => s + y.han, 0));
    const extraHan =
      settings.doraCount + redCount + uraHan + settings.kitaCount;
    const totalHan = isYakumanHand ? 0 : baseHan + extraHan;
    const totalFu = (result.fu as number | undefined) ?? 30;

    const category = getCategory(
      totalHan,
      totalFu,
      result.damanguan as number | undefined,
    );

    // 符数内訳
    const fuBreakdown = buildFuBreakdown(shoupai, rongpai, settings, result);

    // 点数計算
    const isDealer = settings.seatWind === "east";
    const payInfo = calcPayments(
      totalHan,
      totalFu,
      isDealer,
      settings.winType,
      settings.playerCount,
      result.damanguan as number | undefined,
    );

    const payments: ScoreResult["payments"] = {};
    if (settings.winType === "ron" && payInfo.ron) {
      payments.ron = { payer: "放銃者", amount: payInfo.ron };
    } else if (settings.winType === "tsumo") {
      payments.tsumo = {
        dealer: payInfo.tsumoDealerPays ?? 0,
        nonDealer: payInfo.tsumoNonDealerPays ?? 0,
      };
    }

    return {
      yaku,
      fu: totalFu,
      han: totalHan,
      fuBreakdown,
      category,
      gain: payInfo.gain,
      payments,
      rawResult: result,
    };
  } catch (e) {
    console.error("scoring error:", e);
    return null;
  }
}

function buildFuBreakdown(
  shoupai: unknown,
  rongpai: string | null,
  settings: GameSettings,
  result: HuleResult,
): FuBreakdown {
  const base = 20;
  const isMenzen = !((shoupai as { _fulou: unknown[] })._fulou?.length ?? 0);
  const menzenRon = rongpai && isMenzen ? 10 : 0;
  const isPinfu = (result.hupai ?? []).some((h) => h.name === "平和");
  const tsumoFu = !rongpai && !isPinfu ? 2 : 0;

  const melds: FuDetail[] = [];
  let pairDetail: FuDetail | null = null;
  let waitDetail: FuDetail | null = null;

  try {
    const mianziList: string[] =
      (Majiang.Util.hule_mianzi(shoupai, rongpai) as string[][])?.[0] ?? [];

    for (const meld of mianziList) {
      const analyzed = analyzeMeld(meld);
      if (analyzed.label === "対子") {
        const tile = analyzed.tiles[0];
        let pairFu = 0;
        if (tile.suit === "z") {
          const wind1 = windToTileNum(settings.roundWind);
          const wind2 = windToTileNum(settings.seatWind);
          if (tile.num >= 5) pairFu = 2; // 三元牌（5z=白, 6z=發, 7z=中）
          if (tile.num === wind1) pairFu += 2; // 場風
          if (tile.num === wind2) pairFu += 2; // 自風
        }
        pairDetail = {
          label: "雀頭",
          tiles: analyzed.tiles,
          fu: pairFu,
          note: pairFu > 0 ? "役牌/風牌対子" : "一般牌対子",
        };
      } else if (analyzed.label) {
        melds.push({
          label: analyzed.label,
          tiles: analyzed.tiles,
          fu: analyzed.fu,
          note: analyzed.note,
        });
      }
    }

    // 待ち符
    if (!isPinfu && rongpai) {
      // rongpai = "p5+" → suit=p, num=5
      const suit = rongpai[0];
      const numChar = rongpai[1] === "0" ? 5 : Number.parseInt(rongpai[1], 10);
      const { fu: waitFu, label: waitLabel } = calcWaitFu(
        mianziList,
        suit,
        numChar,
      );
      waitDetail = { label: waitLabel, tiles: [], fu: waitFu };
    } else if (!isPinfu && !rongpai) {
      waitDetail = { label: "ツモ符", tiles: [], fu: 0 };
    }
  } catch {
    // 解析失敗時はライブラリの合計値のみ使用
  }

  const meldFu = melds.reduce((s, m) => s + m.fu, 0);
  const pairFu = pairDetail?.fu ?? 0;
  const waitFu = waitDetail?.fu ?? 0;
  const raw = base + menzenRon + tsumoFu + meldFu + pairFu + waitFu;
  const total = (result.fu as number | undefined) ?? ceilFu(raw);

  return {
    base,
    menzenRon,
    tsumo: tsumoFu,
    melds,
    pair: pairDetail,
    wait: waitDetail,
    total,
    raw,
  };
}
