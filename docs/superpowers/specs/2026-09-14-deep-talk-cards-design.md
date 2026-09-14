# 深度對話卡牌 Web App — 設計文件

日期：2026-09-14

## 目的

做一款單裝置、傳著玩的深度對話卡牌 web app。題目全部原創，僅借用「依層級由淺入深」這個通用的對話設計架構。

不是市售卡牌的電子化複製品。題庫是自己寫的。

## 使用情境

實體聚會時把手機或平板放桌上，大家輪流抽卡、回答。2 到 8 人，10 歲以上。

## 範圍

### 做

- 四個層級的原創題庫：破冰、一星、二星、三星
- 選擇要納入哪些層級
- 牌堆式抽卡，不重複
- 跨層級時的過場提示
- 「換一張」跳過不想答的題目
- 進度顯示
- localStorage 續玩，重整不掉進度

### 不做（YAGNI）

帳號、雲端同步、多人各自裝置連線、筆記與收藏、計時器、音效、多語系。

## 題庫設計

| 層級 | 張數 | 調性 |
|---|---|---|
| `warmup` 破冰 | 20 | 輕快有趣。偶爾訪談、奇想、小癖好、荒謬假設。目的是讓大家先開口、先笑出來，不觸及隱私。 |
| `star1` 一星 | 20 | 溫暖向，輕度。日常偏好、小回憶、無風險的自我揭露。 |
| `star2` 二星 | 20 | 溫暖向，中度。開始往內走：關係、感謝、改變、影響自己的人事物。 |
| `star3` 三星 | 15 | 溫暖向，深度。價值觀、遺憾、脆弱、真正想說卻沒說出口的話。仍維持溫暖與安全感，不走尖銳或攻擊性。 |

總計約 75 張。

撰寫原則：

- 每題是開放式問句，不能用是或否回答
- 避免預設立場（不假定對方有伴侶、有小孩、有宗教信仰、家庭關係良好）
- 三星題要能被誠實回答而不使人難堪——問的是內心，不是把柄
- 同層級內題目不重複角度，避免玩起來像同一題問三次

## 資料結構

```ts
type Tier = 'warmup' | 'star1' | 'star2' | 'star3'

interface Question {
  id: string      // 'w-01', 's1-01', 's2-01', 's3-01'
  tier: Tier
  text: string
}

interface GameState {
  selectedTiers: Tier[]
  deck: string[]     // question id，已排序
  position: number   // 指向 deck 中目前這張
  skipped: string[]  // 被換掉的 id
  startedAt: number
}
```

## 牌堆建構規則

層級之間固定由淺入深排序，層級之內隨機洗牌。

每場的題目順序都不同，但「循序漸進」由架構保證，不依賴使用者自律。

`shuffle` 的亂數來源以參數注入，使測試能決定性重現。

## 畫面

四個畫面，由 `App.tsx` 的狀態機切換。

**Setup** — 四個層級 toggle，預設全選。開始新的一場，或繼續上一場（偵測到有效存檔時才顯示）。至少要選一個層級才能開始。

**Play** — 大卡片顯示題目。兩個動作：「下一張」與「換一張」。顯示目前層級與進度（第 n / N 張）。

**Interstitial** — 跨層級時插入。預告接下來的題目會更深入，提醒可以隨時喊停或跳過。從 `deck[position]` 與 `deck[position - 1]` 的 tier 差異推導，不是資料實體。

**Finished** — 牌堆耗盡。收尾語 + 重新開始。

## 行為細節

- 「換一張」把目前的 id 推入 `skipped` 並前進。被換掉的卡不重新插回牌堆。
- 進度的分母是牌堆總長度，不扣除 skipped。
- 每次狀態變動後寫入 localStorage。
- 存檔帶 schema 版本號。版本不符時丟棄存檔並回到 Setup，不做遷移。

## 架構

```
src/
  data/questions.ts      題庫（純資料，零邏輯）
  game/deck.ts           buildDeck / shuffle
  game/reducer.ts        GameState + actions
  game/storage.ts        localStorage 讀寫 + schema 版本
  components/Card.tsx
  screens/Setup.tsx
  screens/Play.tsx
  screens/Interstitial.tsx
  screens/Finished.tsx
  App.tsx
```

核心邊界：`game/` 之下全是純函式，不碰 DOM、不碰 React。React 只負責渲染與事件。遊戲邏輯因此能完全獨立測試。

技術選型：Vite + React + TypeScript，Vitest 測試。純前端，無後端。

## 測試策略

TDD。測試涵蓋 `game/` 的純函式：

`deck.test.ts`
- 牌堆只包含選中層級的題目
- 未選的層級完全不出現
- 跨層順序恆為 warmup → star1 → star2 → star3
- 層內確實洗牌（注入固定 RNG 可重現）
- 只選單一層級時正常運作

`reducer.test.ts`
- next 使 position 前進
- swap 記錄至 skipped 並前進
- 牌堆耗盡時進入 finished
- 跨層偵測在正確的位置觸發
- 第一張卡不觸發過場

`storage.test.ts`
- 存檔 round-trip 後狀態相等
- schema 版本不符時丟棄
- 損毀的 JSON 不使 app 崩潰

UI 不寫自動化測試。此規模下視覺回歸測試的維護成本高於價值。

## 視覺方向

手機優先，直式大卡片。層級以配色區分（破冰明亮、三星沉靜）。支援深淺色主題。

細節於實作階段處理。
