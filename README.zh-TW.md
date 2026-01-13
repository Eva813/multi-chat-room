# Meep Chat Room

[English](README.md) | [繁體中文](README.zh-TW.md)

---

一個使用 Next.js 16 App Router、React 19、Zustand 狀態管理和 Tailwind CSS 建立聊天應用程式展示專案。本專案展現互動式訊息介面的最佳實踐，包含樂觀更新、主題切換和響應式設計。

## 功能特點

- **即時訊息傳送**：發送和接收文字訊息，UI 即時更新
- **訊息反應**：使用讚、愛心和大笑表情符號對訊息做出反應
- **圖片分享**：上傳和預覽圖片（PNG、JPEG、WebP），支援檔案驗證（最大 5MB）
- **多重對話**：管理多達 10 個不同參與者的對話
- **深色/淺色主題**：在深色和淺色模式之間切換，並保存偏好設定
- **響應式設計**：行動優先設計，小螢幕使用抽屜式側邊欄
- **樂觀更新**：即時 UI 回饋，失敗時自動復原
- **資料持久化**：LocalStorage 整合，保存使用者訊息和反應
- **模擬 API**：模擬網路延遲（300ms）以供開發使用

## 技術堆疊

### 核心框架
- **Next.js 16.1.1** - React 框架，搭配 App Router
- **React 19.2.3** - 最新版 React，支援自動批次處理
- **TypeScript 5** - 型別安全開發

### 狀態管理
- **Zustand 5.0.9** - 輕量級狀態管理
  - DevTools 整合用於除錯
  - LocalStorage 持久化中介軟體
  - 模組化切片模式

### UI 與樣式
- **Tailwind CSS 4** - Utility-first CSS 框架
- **Radix UI** - 無障礙的 Headless 元件
  - Avatar、Dialog、Dropdown Menu、Scroll Area
- **next-themes 0.4.6** - 深色/淺色模式管理
- **lucide-react 0.562.0** - 現代化圖示庫
- **Class Variance Authority** - 型別安全的元件變體

## 安裝指南

### 前置需求
- Node.js 20.x 或更高版本
- npm、yarn、pnpm 或 bun

### 設定步驟

```bash
# 複製專案
git clone <repository-url>

# 進入專案目錄
cd meep-chat-room

# 安裝相依套件
pnpm install
```

## 使用說明

### 開發模式

啟動具有熱重載功能的開發伺服器：

```bash
pnpm dev
```

在瀏覽器中開啟 [http://localhost:3000](http://localhost:3000) 查看應用程式。

### 正式環境建置

建置最佳化的正式環境套件：

```bash
pnpm build
```

啟動正式環境伺服器：

```bash
pnpm start
```

### 程式碼品質檢查

執行 ESLint 檢查程式碼品質：

```bash
pnpm lint
```

## 專案結構

```
meep-chat-room/
├── src/
│   ├── apis/              # API 模擬和模擬資料處理器
│   │   └── conversation.ts
│   ├── app/               # Next.js App Router 頁面和佈局
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/        # React 元件（按功能組織）
│   │   ├── chat/          # 聊天訊息元件
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── ReactionButton.tsx
│   │   ├── layout/        # 佈局元件
│   │   │   └── ChatLayout.tsx
│   │   ├── sidebar/       # 對話列表和搜尋元件
│   │   │   ├── ConversationItem.tsx
│   │   │   ├── ConversationList.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── theme/         # 主題切換元件
│   │   │   └── ThemeToggle.tsx
│   │   └── ui/            # 可重複使用的 UI 元件（Radix UI 封裝）
│   ├── hooks/             # 自訂 React Hooks
│   │   └── use-mobile.tsx
│   ├── lib/               # 工具函式、型別和模擬資料
│   │   ├── chatData.json  # 模擬對話資料（10 個對話，140+ 則訊息）
│   │   ├── types.ts       # TypeScript 型別定義
│   │   └── utils.ts       # 工具函式（cn 等）
│   ├── stores/            # Zustand 狀態管理
│   │   ├── slices/        # 模組化 store 切片
│   │   │   ├── ConversationSlice.ts
│   │   │   └── MessageSlice.ts
│   │   ├── utils/         # Store 工具函式
│   │   └── useChatStore.ts
│   └── public/            # 靜態資源
├── .gitignore
├── eslint.config.mjs      # ESLint 設定
├── next.config.ts         # Next.js 設定
├── package.json
├── postcss.config.mjs     # PostCSS 設定
├── tailwind.config.ts     # Tailwind CSS 設定
└── tsconfig.json          # TypeScript 設定
```

## 開發流程

### 狀態管理架構

應用程式使用 Zustand 與模組化切片模式：

- **ConversationSlice**：管理對話列表、選擇和初始化
- **MessageSlice**：處理訊息 CRUD 操作、反應和持久化

Store 功能：
- 對話的延遲載入
- 訊息和反應的樂觀 UI 更新
- API 失敗時自動復原
- 使用者生成內容的 LocalStorage 持久化

### 元件模式

- **Server Components**：用於靜態內容和佈局的預設選項
- **Client Components**：用於互動功能（聊天輸入、反應、主題切換）
- **組合模式**：Radix UI 原始元件封裝為自訂元件
- **記憶化**：針對昂貴渲染的效能最佳化

### 模擬資料

開發環境使用來自 `src/lib/chatData.json` 的模擬資料：
- 10 個預定義對話
- 5 個參與者使用者（Alice、Bob、Charlie、David、Emma）
- 140+ 則範例訊息
- 使用者 ID 6 代表「我」（當前使用者）

### API 模擬

API 呼叫使用 300ms 網路延遲模擬：
```typescript
// 範例：發送訊息
await new Promise(resolve => setTimeout(resolve, 300))
```

## 主要功能說明

### 訊息反應

使用者可以使用三種情緒類型對任何訊息做出反應：
- 讚
- 愛心
- 大笑

反應使用樂觀更新，失敗時自動復原，並設有 3 秒錯誤逾時清除。

### 圖片上傳

圖片上傳支援：
- **格式**：PNG、JPEG、WebP
- **最大檔案大小**：5MB
- **驗證**：客戶端格式和大小檢查
- **預覽**：Blob URL 預覽，並妥善清理

### 主題切換

深色/淺色模式實作：
- 使用 `next-themes` 持久化主題偏好
- CSS 變數用於色彩標記
- 系統偏好偵測
- 平滑過渡動畫

### 響應式設計

行動優先方法：
- 桌面版：並排顯示對話列表和聊天區域
- 行動版：抽屜式側邊欄配漢堡選單
- 斷點：768px（Tailwind 中的 md）

## 授權

本專案為私有專案，不對外公開授權使用。


使用以下工具構建：
- [Next.js](https://nextjs.org/) - 用於 Web 的 React 框架
- [Zustand](https://github.com/pmndrs/zustand) - 狀態管理的必需品
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS 框架
- [Radix UI](https://www.radix-ui.com/) - 無樣式、無障礙元件
- [Lucide](https://lucide.dev/) - 美觀且一致的圖示
