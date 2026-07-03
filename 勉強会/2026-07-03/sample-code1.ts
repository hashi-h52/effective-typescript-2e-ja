/*
 * 内容1 - TypeScriptの基礎知識
 */

/* 
  項目8: 型空間のシンボルと値空間のシンボルの見分け方を知る 
 */

// interface（型空間）と const（値空間）は同じ名前でも共存できる
// → 同名のシンボルでも、どちらの空間にあるかで指すものが変わる
interface Cylinder {
  radius: number;
  height: number;
}
const Cylinder = (radius: number, height: number) => ({ radius, height });

function calculateVolume(shape: unknown) {
  if (shape instanceof Cylinder) {
    // instanceof はJSの演算子＝値空間の話。ここでのCylinderは
    // interfaceではなく、上で定義したconst Cylinder（関数）を指している
    // そのため型としては期待通りに絞り込まれない
    shape.radius; // Property 'radius' does not exist on type '{}'
  }
}

// typeofも型の文脈と値の文脈で意味が変わる代表例
const jane = { first: "Jane", last: "Jacobs" };
type Jane = typeof jane; // 型空間のtypeof → { first: string; last: string }
const janeKind = typeof jane; // 値空間(js演算子として)のtypeof → 実行時の文字列 "object"

// 2つの空間を直観的に理解する最良の方法の一つは、TSプレイグラウンドで
// TSソースから生成されたJSを見比べること（type/interfaceはJSからは消える）
// https://www.typescriptlang.org/play

/* 
 項目7: 型を値の集合として考える 
 */

// 型は「値の集合」と考えると理解しやすい。集合の包含関係がそのまま代入可能性になる
type AB = "A" | "B";
type AB12 = "A" | "B" | 12;

declare const ab: AB;
const okAb12: AB12 = ab; // OK: {'A','B'} は {'A','B',12} の部分集合

declare const twelve: AB12;
// const ngAb: AB = twelve;
// ~~~~~ Type 'AB12' is not assignable to type 'AB'（AB12はABの部分集合ではない）

// unknownは「あらゆる値」を含む集合、neverは「空集合」
declare const anyValue: unknown;
//const m: number = anyValue; // unknownはnumberの部分集合ではないためエラー

// anyだけはこの包含関係から外れた特殊な存在
// （どんな型にも代入でき、どんな型からも代入されてしまう「抜け穴」）
let escapeHatch: any = "hello";
let n: number = escapeHatch; // 本来はstring→numberの代入だが、anyなのでチェックされない

//https://typescriptbook.jp/reference/values-types-variables/mental-model-of-types

/* 
 項目20: 変数の型がどのように決まるか理解する
 */

let widened = "x"; // let: string に「広げられ」（widening）て推論される
const narrowed = "x"; // const: リテラル型 "x" のまま推論される

const point1 = { x: 1, y: 2 };
// ^? { x: number; y: number }（オブジェクトのプロパティもwideningされる）

const point2 = { x: 1, y: 2 } as const;
// ^? { readonly x: 1; readonly y: 2 }
// as const は型空間のキーワードで、推論結果自体を狭くする
// （constは値空間のキーワードで単に再代入不可な変数を導入するだけ、という違いに注意）

// 構文は似ているが意味は全く異なるので混同しないこと
const shape = { radius: 1 } as const; // constアサーション: 型安全性を損なわないので基本的に使ってOK
// const shape2 = value as SomeType;   // 型アサーション: 危険なので使用は最小限に

// 型アサーション・非nullアサーションは「TSが知らない情報をプログラマが知っている」
// 場合にのみ使う（存在確実なDOM要素の取得など）
const el = document.getElementById("app") as HTMLDivElement; // 型アサーション
const el2 = document.getElementById("app")!; // 非nullアサーション

/* 
 項目11: 余剰プロパティと型チェックを区別する 
 */

interface Room {
  numDoors: number;
  ceilingHeightFt: number;
}

// オブジェクトリテラルを既知の型の変数へ直接代入すると「余剰プロパティチェック」が働く
const r: Room = {
  numDoors: 1,
  ceilingHeightFt: 10,
  elephant: "present",
};
// ~~~~~~~ Object literal may only specify known properties,
//         and 'elephant' does not exist in type 'Room'

// 中間変数を経由すると余剰プロパティチェックは働かない（通常の構造的代入可能性チェックのみ）
const obj = { numDoors: 1, ceilingHeightFt: 10, elephant: "present" };
const room: Room = obj; // OK（構造的にはRoomのプロパティを全て満たしている）

// 全プロパティがオプショナルな「弱い型」は、少なくとも1つのプロパティが
// 一致することを要求する（タイポ検出に有効）
interface LineChartOptions {
  logscale?: boolean;
  invertedYAxis?: boolean;
}
const opts: LineChartOptions = { logScale: true };
// ~~~~ Type '{ logScale: boolean }' has no properties in common with 'LineChartOptions'

// 余剰プロパティチェックは通常の代入可能性チェックとは別の特別な追加チェック。
// これを混同すると「なぜこれは代入できて、あれはできないのか」がいつまでも理解できず、エディタやAIに直させることになってしまう
