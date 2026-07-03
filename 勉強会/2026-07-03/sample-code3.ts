/*
 * 内容3 - any型との付き合い方
 */

/* 項目43: 可能なかぎり狭いスコープでany型を使う */

interface Pizza {
  slice(): void;
}
interface Salad {
  toss(): void;
}
declare function getPizza(): Pizza;
declare function eatSalad(salad: Salad): void;

// クイズ: どちらがより良い設計か？

function eatDinnerBad() {
  const pizza: any = getPizza(); // ダメな例: 変数自体をanyにしてしまう
  eatSalad(pizza); // OK（だが本当はPizzaを渡していて型が合っていない）
  pizza.slice(); // ← この呼び出しはチェックされなくなる（本来はここもチェックしたい）
}

function eatDinnerGood() {
  const pizza = getPizza(); // pizzaの型はPizzaのまま
  eatSalad(pizza as any); // 好ましい例: 使う箇所だけを狭くanyにする
  pizza.slice(); // ← こちらは引き続き型チェックされる（安全）
}

// 正解: eatDinnerGood。anyのスコープを最小限にすることで、
// 型安全性が失われる範囲を必要最小限に抑えられる

// 関数の戻り値をanyにするのは絶対NG。呼び出し元にまでanyが伝播してしまう
function eatDinnerLeaky() {
  const pizza: any = getPizza();
  eatSalad(pizza);
  pizza.slice();
  return pizza; // 安全でないpizzaがそのまま外部に漏れる！
}
const leaked = eatDinnerLeaky();
// ^? any（呼び出し元のleakedもanyになり、以降一切チェックされなくなる）

/* 項目45: 安全でない型アサーションを、適切に型付けされた関数の内部に隠す */

interface MountainPeak {
  name: string;
  elevationMeters: number;
}
declare function fetchJSON(url: string): Promise<unknown>;

// 型アサーションを関数の外に晒さず、内部に閉じ込める
async function fetchPeak(peakId: string): Promise<MountainPeak> {
  // ここでのアサーションが「なぜ安全と言えるか」の説明:
  // /api/mountain-peaks/:id はMountainPeak形式のJSONを返すAPI仕様であることを、
  // このAPIの実装側で保証しているため（要: このAPI呼び出しに対するテスト）
  return fetchJSON(`/api/mountain-peaks/${peakId}`) as Promise<MountainPeak>;
}

async function getPeaksByHeight(ids: string[]) {
  const peaks = await Promise.all(ids.map(fetchPeak)); // 呼び出し元ではアサーション不要
  return peaks.toSorted((a, b) => b.elevationMeters - a.elevationMeters);
}
// ↑ fetchPeakの戻り値の型が正しく保たれているため、呼び出し元は安心して使える

/* 項目44: anyをそのまま使うのではなく、より具体的な形式で使う */

// ただのanyより、より具体的な形式のanyを使うと安全性が上がる
function getLengthBad(array: any) {
  // ダメな例: 何でも受け付けてしまう
  return array.length;
}
function getLengthGood(array: any[]) {
  // 良い例: 「配列であること」だけは保証される
  return array.length;
}
getLengthBad(/regex/); // エラーにならず、実行時にundefinedが返る
// getLengthGood(/regex/);
// ~~~~~~ Argument of type 'RegExp' is not assignable to parameter of type 'any[]'

/* 項目46: 型が不明な値には、anyではなくunknownを使う */

// 「unknown型はany型の安全な代替手段」
// 値があることは知っているが、その型が何かは知らない/気にしない場合に使う
declare function parseYAML(yaml: string): unknown;

const parsed = parseYAML("name: Effective TypeScript") as [];
console.log(parsed.length);
// ~~~~~~ 'parsed' is of type 'unknown'（anyと違い、何もせず使うことはできない）

interface Book {
  name: string;
}
function isBook(value: unknown): value is Book {
  return typeof value === "object" && value !== null && "name" in value;
}
if (isBook(parsed)) {
  parsed.name; // 型ガードを通すことで、はじめて安全にアクセスできる
}

// 戻り値の型だけに使われるジェネリクスは、実質的に型アサーションと同じで
// 誤った安心感を与えるので避けるべき
function parseYAMLUnsafe<T>(yaml: string): T {
  return parseYAML(yaml) as T; // 呼び出し側が指定したT型を無条件に信じてしまう
}
const fakeBook = parseYAMLUnsafe<Book>("not actually a book"); // 実行時には検証されない
