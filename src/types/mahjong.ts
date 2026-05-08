export type Suit = "m" | "p" | "s" | "z";

export interface Tile {
  suit: Suit;
  num: number; // 1-9 for mps, 1-7 for z
  isRed?: boolean; // 赤ドラ（5mr, 5pr, 5sr）
}

export type PlayerCount = 3 | 4;
export type WinType = "ron" | "tsumo";
export type RoundWind = "east" | "south";
export type SeatWind = "east" | "south" | "west" | "north";

export interface GameSettings {
  playerCount: PlayerCount;
  winType: WinType;
  roundWind: RoundWind;
  seatWind: SeatWind;
  // 特殊条件
  riichi: boolean;
  doubleRiichi: boolean;
  ippatsu: boolean;
  haitei: boolean; // 海底（ツモ）
  houtei: boolean; // 河底（ロン）
  rinshan: boolean; // 嶺上開花
  chankan: boolean; // 槍槓
  tenhou: boolean; // 天和
  chiihou: boolean; // 地和
  // ドラ
  doraCount: number;
  uraDoraCount: number;
  kitaCount: number; // 三麻の抜きドラ
}

// 符数内訳
export interface FuDetail {
  label: string;
  tiles: Tile[];
  fu: number;
  note?: string; // 例：「中張暗刻」「幺九明刻」
}

export interface FuBreakdown {
  base: number; // 副底 20
  menzenRon: number; // 門前加符 10 or 0
  tsumo: number; // 自摸符 2 or 0
  melds: FuDetail[]; // 面子（順子・刻子・槓子）
  pair: FuDetail | null; // 雀頭
  wait: FuDetail | null; // 待ち
  total: number; // 端数切り上げ後合計
  raw: number; // 切り上げ前合計
  meldStrings: string[]; // hule_mianzi() の生文字列（鳴き再計算用）
}

export interface Yaku {
  name: string;
  han: number;
  isYakuman?: boolean;
}

export type ScoreCategory =
  | "mangan" // 満貫
  | "haneman" // 跳満
  | "baiman" // 倍満
  | "sanbaiman" // 三倍満
  | "yakuman" // 役満
  | "double_yakuman" // ダブル役満
  | "normal"; // 通常

export interface Payment {
  dealer: number; // 東家支払額
  nonDealer: number; // 非東家支払額（ツモ時）
  total: number; // 合計得点
}

export interface ScoreResult {
  yaku: Yaku[];
  fu: number;
  han: number;
  fuBreakdown: FuBreakdown;
  category: ScoreCategory;
  gain: number; // あがり者の得点
  payments: {
    ron?: { payer: string; amount: number };
    tsumo?: { dealer: number; nonDealer: number };
  };
  rawResult: unknown; // majiang-core の生データ
}

// majiang-core の hule() 返り値
export interface HuleResult {
  hupai: Array<{ name: string; fanshu: number | string }>;
  fu?: number;
  fanshu?: number;
  damanguan?: number;
  defen: number;
  fenpei: number[];
}

// 手牌 MPSZ 文字列
export type MpszString = string;
