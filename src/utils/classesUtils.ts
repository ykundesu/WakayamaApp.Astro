/**
 * タイムアウト付きフェッチ関数（リトライ機能付き）
 * 
 * ネットワークが不安定な環境でも安定してデータを取得するため、
 * タイムアウトとリトライ機能を組み込んだfetch関数です。
 * 
 * @param url - フェッチ対象のURL
 * @param ms - タイムアウト時間（ミリ秒）。デフォルトは8000ms（8秒）
 * @param retries - リトライ回数。デフォルトは2回
 * @returns Promise<Response> - フェッチ結果のResponseオブジェクト
 * @throws リトライ回数を超えてもフェッチに失敗した場合にエラーをスロー
 * 
 * @example
 * ```typescript
 * try {
 *   const response = await fetchWithTimeout('https://api.example.com/data');
 *   if (response.ok) {
 *     const data = await response.json();
 *   }
 * } catch (error) {
 *   console.error('フェッチに失敗しました:', error);
 * }
 * ```
 */
export async function fetchWithTimeout(url: string, ms = 8000, retries = 2): Promise<Response> {
  // リトライ回数分ループ（初回 + リトライ回数）
  for (let i = 0; i <= retries; i++) {
    // AbortControllerでタイムアウトを実装
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ms);
    
    try {
      // タイムアウト可能なfetchを実行
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId); // 成功したらタイマーをクリア
      
      // ここでは非OK(例: 404)でも例外は投げずにResponseを返す。
      // 呼び出し側でステータスコードを見て詳細に分岐する。
      return res;
    } catch (err) {
      clearTimeout(timeoutId); // エラー時もタイマーをクリア
      
      // 最後のリトライでもエラーなら例外をスロー
      if (i === retries) throw err;
      
      // 指数バックオフ: 1回目は600ms、2回目は1200ms待機
      // ネットワークの一時的な問題を回避するための待機時間
      await new Promise(resolve => setTimeout(resolve, 600 * Math.pow(2, i)));
    }
  }
  
  // 念のためのエラー（通常はここには到達しない）
  throw new Error('フェッチに失敗しました');
}

/**
 * タイムスタンプを読みやすい日時形式にフォーマット
 * 
 * Unix時間（ミリ秒）を「YYYY/MM/DD HH:mm」形式の文字列に変換します。
 * キャッシュの最終更新時刻などを表示する際に使用します。
 * 
 * @param timestamp - Unix時間（ミリ秒）
 * @returns フォーマットされた日時文字列（例: "2025/10/27 14:30"）
 * 
 * @example
 * ```typescript
 * const timestamp = Date.now();
 * const formatted = formatTimestamp(timestamp);
 * console.log(formatted); // "2025/10/27 14:30"
 * ```
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * 現在日付から適切な学期（前期/後期）を判定
 * 
 * 日本の学校の学期制に基づいて、現在の月から学期を判定します。
 * - 前期: 4月〜8月（月インデックス: 3〜7）
 * - 後期: 9月〜3月（月インデックス: 8〜2）
 * 
 * @param now - 判定基準となる日付（デフォルト: 現在日時）
 * @returns '0' (前期) または '1' (後期)
 * 
 * @example
 * ```typescript
 * const semester = computeDefaultSemester(); // 現在日時で判定
 * const specificDate = computeDefaultSemester(new Date(2025, 3, 1)); // 2025年4月1日で判定 → '0'
 * ```
 */
export function computeDefaultSemester(now: Date = new Date()): '0' | '1' {
  // getMonth()は0始まり: 0=1月, 3=4月, 7=8月, 8=9月
  const monthIndex = now.getMonth();
  
  // 4月(3)〜8月(7)は前期('0')、それ以外は後期('1')
  return monthIndex >= 3 && monthIndex <= 7 ? '0' : '1';
}

/**
 * 現在日付から表示する曜日のインデックスを算出
 * 
 * アプリで使用する曜日インデックス（0=月曜, 4=金曜）に変換します。
 * JavaScriptのDate.getDay()は日曜始まり（0=日曜）ですが、
 * このアプリでは月曜始まりで平日（月〜金）のみを扱います。
 * 
 * 土日の場合は月曜日（0）を返します。
 * 
 * @param now - 判定基準となる日付（デフォルト: 現在日時）
 * @returns 曜日インデックス (0=月, 1=火, 2=水, 3=木, 4=金)
 * 
 * @example
 * ```typescript
 * // 2025年10月27日（月曜日）の場合
 * const dayIndex = computeDefaultDayOfWeek(new Date(2025, 9, 27)); // → 0
 * 
 * // 2025年11月1日（土曜日）の場合
 * const dayIndex = computeDefaultDayOfWeek(new Date(2025, 10, 1)); // → 0 (月曜日を返す)
 * ```
 */
export function computeDefaultDayOfWeek(now: Date = new Date()): number {
  // JSのgetDay()は 0=日,1=月,...,6=土
  const jsDay = now.getDay();
  
  // 月〜金（JSでは1〜5）の場合は、アプリのインデックスに変換
  if (jsDay >= 1 && jsDay <= 5) {
    return jsDay - 1; // 月→0, 火→1, ..., 金→4
  }
  
  // 土日（JSでは0または6）の場合は月曜を返す
  return 0;
}

/**
 * 現在の年度（会計年度）を取得
 * 
 * 日本の学校の年度は4月1日から始まります。
 * - 4月1日以降: その年が年度
 * - 1月1日〜3月31日: 前年が年度
 * 
 * 例: 2025年3月 → 2024年度
 *     2025年4月 → 2025年度
 * 
 * @param now - 判定基準となる日付（デフォルト: 現在日時）
 * @returns 年度（西暦）
 * 
 * @example
 * ```typescript
 * // 2025年3月15日の場合
 * const fiscalYear = getFiscalYear(new Date(2025, 2, 15)); // → 2024
 * 
 * // 2025年4月1日の場合
 * const fiscalYear = getFiscalYear(new Date(2025, 3, 1)); // → 2025
 * ```
 */
export function getFiscalYear(now: Date = new Date()): number {
  const year = now.getFullYear();
  const fiscalYearStart = new Date(year, 3, 1); // 4月1日（月は0始まりなので3）
  
  // 現在日が4月1日以降なら今年が年度、それ以前なら前年が年度
  return now >= fiscalYearStart ? year : year - 1;
}
