# 切切 CHAT CHAT

**聊點日常，也聊點心裡的事。**

新朋友、老朋友，坐下來切切。從一張卡開始，聊到哪裡都可以。

切切是一個適合聚會時一起使用的聊天卡牌網站，以柔和的色彩、微笑小花和四種深淺不同的話題，陪大家輕鬆開口。想到什麼就說什麼，不想聊就換一張。

## 怎麼玩

1. 在首頁選擇今天想切的話題，可以複選；預設選取「輕鬆開個頭」。
2. 按「抽張卡，切切吧」開始。話題由淺入深出現，同一階段的卡片會隨機排序。
3. 分享完按「下一張」，不想回答可以按「換一張」。
4. 想換個深度時，按「跳到下一階段」，直接前往這一回有選取的下一階段。
5. 想休息時，點左上角「切切」返回首頁，下次可以接著上次的進度繼續。

最後一個階段不顯示跳階段按鈕。每次開始新的一回，都會重新洗牌並取代先前進度。

### 四種話題

| 階段 | 適合切的內容 |
| --- | --- |
| 輕鬆開個頭 | 日常、喜好與輕鬆的小互動 |
| 多認識一點 | 小故事、回憶與彼此的共鳴 |
| 分享心情 | 感受、關係與在意的事 |
| 聊聊心裡話 | 價值觀與平常比較少說的心裡話 |

## 本機開發

需要安裝 Node.js 與 npm。Node.js 版本需符合專案使用的 Vite 6 套件要求。

```bash
git clone https://github.com/nckuhst/chatchat.git
cd chatchat
npm ci
npm run dev
```

開啟終端機顯示的本機網址。

### 常用指令

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 啟動開發伺服器 |
| `npm test` | 執行全部測試 |
| `npm run test:watch` | 修改程式時持續執行測試 |
| `npm run build` | 檢查 TypeScript 並建置至 `dist/` |
| `npm run preview` | 本機預覽已建置的網站，需先執行 build |

## 修改題目

四個階段各有獨立檔案：

| 階段 | 題庫檔案 |
| --- | --- |
| 輕鬆開個頭 | [warmup.ts](src/data/questions/warmup.ts) |
| 多認識一點 | [star1.ts](src/data/questions/star1.ts) |
| 分享心情 | [star2.ts](src/data/questions/star2.ts) |
| 聊聊心裡話 | [star3.ts](src/data/questions/star3.ts) |

直接修改 `text` 即可，既有題目的 `id` 與 `tier` 請保留：

```ts
{ id: 'w-01', tier: 'warmup', text: '分享一件最近讓你開心的小事' },
```

可以新增或刪除題目，每個階段至少留一題；內容可以是問句，也可以是分享或互動邀請。新增題目時請使用唯一的 ID。修改完執行 `npm test` 和 `npm run build` 檢查。

完整規則與存檔影響請見[題庫編輯說明](src/data/questions/README.md)。

## 進度儲存

- 進度儲存在瀏覽器的 `localStorage`，重新整理或返回首頁後可以繼續。
- 進度只存在同一裝置、同一瀏覽器與同一網站來源，不會跨裝置同步。
- 清除網站資料會移除進度；瀏覽器限制儲存時，進度可能無法保留。
- 若題庫刪除了舊存檔中的題目，該存檔會失效，需要開始新的一回。

網站沒有登入、後端或資料庫，也不提供輸入或儲存聊天回答的功能。

## 部署

這是純前端的靜態網站，部署內容為 `npm run build` 產生的 `dist/`。`npm run preview` 僅供本機預覽。

### GitHub Pages

專案已包含 [部署 workflow](.github/workflows/deploy.yml)，推送至 `main` 時會自動測試、建置並部署。初次啟用可參考 [Vite 官方 GitHub Pages 指南](https://vite.dev/guide/static-deploy#github-pages) 設定：

1. 在 repository 的 **Settings → Pages → Build and deployment**，將 **Source** 設為 **GitHub Actions**。
2. 確認 `.github/workflows/deploy.yml` 已提交至 `main`。Workflow 使用 Node.js 22，執行 `npm ci`、`npm test`、`npm run build`，並發布 `dist/`。
3. 確認資源路徑：目前 `vite.config.ts` 使用 `base: './'`，讓資源採相對路徑。若依官方指南使用固定專案路徑，此 repository 對應的設定為 `base: '/chatchat/'`。
4. 提交並推送 workflow，待 GitHub Actions 部署成功後，從 **Settings → Pages** 開啟網站。

以目前 repository 名稱，未設定自訂網域時，預期網址為 `https://nckuhst.github.io/chatchat/`；實際網址以 Pages 顯示的結果為準。

### 其他靜態網站平台

也可以部署至 Vercel、Netlify 或 Cloudflare Pages。基本建置設定如下：

| 設定 | 值 |
| --- | --- |
| 建置指令 | `npm run build` |
| 輸出目錄 | `dist` |

各平台操作方式請參考 [Vite 官方部署指南](https://vite.dev/guide/static-deploy)。

## 專案結構

```text
src/
├── components/       # 卡片、小花與返回首頁的標題
├── data/
│   ├── questions/    # 四個階段的獨立題庫與編輯說明
│   └── questions.ts  # 題庫彙整入口
├── game/             # 洗牌、遊戲狀態與進度儲存
├── screens/          # 首頁、抽卡、階段過場與結尾畫面
├── App.tsx           # 遊戲流程與畫面切換
└── styles.css        # 色彩、排版與互動樣式
```

使用 React、TypeScript、Vite 與 Vitest 開發。
