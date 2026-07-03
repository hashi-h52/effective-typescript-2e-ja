/*
 * 内容2 - 型設計
 */

/* 項目29: 有効な状態のみ表現する型を作る */
/* 項目34: ユニオンを含むインターフェースよりも、インターフェースのユニオンを選択する */

// 悪い例: 有効な状態と無効な状態の両方を表現できてしまう型
interface State {
  pageText: string;
  isLoading: boolean;
  error?: string;
}

function renderPage(state: State) {
  if (state.error) {
    return `Error! ${state.error}`;
  } else if (state.isLoading) {
    return `Loading...`;
  }
  return `<h1>${state.pageText}</h1>`;
}
// ↑ isLoading: true かつ error: "..." かつ pageText: "" のような
//   「本来あり得ない状態」も型上は作れてしまい、レンダリング結果が
//   isLoadingとerrorのどちらを優先するかも実装依存になってしまう

// 改善: 状態ごとにインターフェースを分け、ユニオンにする（タグ付きユニオン）
interface RequestPending {
  state: "pending";
}
interface RequestError {
  state: "error";
  error: string;
}
interface RequestSuccess {
  state: "ok";
  pageText: string;
}
type RequestState = RequestPending | RequestError | RequestSuccess;

function renderPage2(requestState: RequestState) {
  switch (requestState.state) {
    case "pending":
      return `Loading...`;
    case "error":
      return `Error! ${requestState.error}`; // errorプロパティに安全にアクセスできる
    case "ok":
      return `<h1>${requestState.pageText}</h1>`; // pageTextに安全にアクセスできる
  }
}
// ↑ stateの値ごとにプロパティが一意に決まるため、「あり得ない組み合わせ」が
//   型として存在しなくなる。switchでの網羅的な分岐もしやすい

// 「ユニオンを含むインターフェース」よりも「インターフェースのユニオン」を選ぶ、というのはこの考え方の一般化。

//ダメな例
interface Request {
  state: "pending" | "error" | "ok";
  error?: string;
  pageText?: string;
}

// 型定義とは仕様のモデリングであり、個人的には今日いちばん重要な話だと思っている

/* 項目30: 入力には寛容に、出力には厳格に */

// 入力(引数)の型は広く、出力(戻り値)の型は狭く保つのがクライアントに親切
interface Point {
  x: number;
  y: number;
}
type PointLike = Point | [number, number]; // 入力として受け付ける「寛容な」形式

function toPoint(p: PointLike): Point {
  // 出力は常にPoint型に正規化する（厳格な形式）
  return Array.isArray(p) ? { x: p[0], y: p[1] } : p;
}

// 反復処理のためだけに配列を受け取るなら、T[]よりIterable<T>のほうがよい
function sum(xs: Iterable<number>): number {
  let total = 0;
  for (const x of xs) {
    total += x;
  }
  return total;
}
sum([1, 2, 3]); // 配列も渡せる
function* range(count: number) {
  for (let i = 0; i < count; i++) yield i;
}
sum(range(5)); // ジェネレーターも渡せる（T[]だと配列に変換する必要がある）

/* 項目33: null値を型の外側に押しやる */

// 悪い例: min/maxを別々の変数として持ち、
// 「一方がnullでなければもう一方もnullではない」という関係が暗黙の前提になっている
function extentBad(nums: number[]) {
  let min: number | null = null;
  let max: number | null = null;
  for (const num of nums) {
    if (min === null) {
      min = num;
      max = num;
    } else {
      min = Math.min(min, num);
      max = Math.max(max!, num); // ← maxもnullではないはずだとアサーションに頼ってしまう
    }
  }
  return [min, max];
}
// ↑ 呼び出し側もmin・maxそれぞれのnullチェックが必要になり、
//   「minがnullでないならmaxもnullでない」という不変条件が型では表現されていない
const [minBad, maxBad] = extentBad([1, 2, 3]);
// const spanBad = maxBad - minBad;
// ~~~~~~ Object is possibly 'null'（本当はどちらもnullでないと分かっているのに）

// 改善: min/maxをまとめて1つのタプルにし、タプルごとnull/非nullを切り替える
function extent(nums: number[]): [number, number] | null {
  let minMax: [number, number] | null = null;
  for (const num of nums) {
    if (minMax === null) {
      minMax = [num, num];
    } else {
      const [min, max]: [number, number] = minMax; // 分割代入先に明示的な型注釈が必要
      // ↑ これがないと、minMaxへの再代入(下の行)がminMax自身の型推論に
      //   循環参照してしまい、TS7022(暗黙のany)エラーになる
      minMax = [Math.min(min, num), Math.max(max, num)];
    }
  }
  return minMax;
}

const bounds = extent([1, 2, 3]);
if (bounds) {
  // boundsが[number, number]であることが保証されており、
  // min・maxそれぞれ個別のnullチェックは不要
  const [min, max] = bounds;
  const span = max - min; // OK
}
