---
name: nextjs-best-practices
description: Next.js App Router fundamentals and best practices for building web applications. Use when developing Next.js 13+ applications with App Router, focusing on component patterns (Server/Client), routing conventions, data fetching, state management, and rendering optimization. Helps avoid common pitfalls with state, hydration, and component boundaries.
---

# Next.js Best Practices

## Core Principles

遵循 Next.js App Router 的基本原則，預設使用 Server Components，僅在需要互動時使用 Client Components。

### Server vs Client Components

**Server Components（預設）**
- 所有 `app/` 目錄下的 components 預設為 Server Component
- 可直接 fetch 資料、讀取環境變數、執行資料庫查詢
- 不能使用 hooks、事件處理、瀏覽器 API
- 渲染在伺服器，不包含 JavaScript 到客戶端

**Client Components（需明確標示）**
- 檔案頂部加上 `'use client'`
- 可使用 hooks (`useState`, `useEffect`, etc.)、事件處理、瀏覽器 API
- 會將 JavaScript bundle 送到客戶端
- 盡可能將 `'use client'` 邊界推到最小範圍

```tsx
// ❌ 錯誤：整個頁面標記為 Client Component
'use client'

export default function Page() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <Header /> {/* 這些都會變成 Client Component */}
      <Content />
      <Counter count={count} setCount={setCount} />
    </div>
  )
}

// ✅ 正確：只將需要互動的部分標記為 Client Component
export default function Page() {
  return (
    <div>
      <Header /> {/* Server Component */}
      <Content /> {/* Server Component */}
      <Counter /> {/* Client Component (內部使用 'use client') */}
    </div>
  )
}
```

## File Structure & Routing

**App Router 檔案慣例**
- `page.tsx` - 路由頁面
- `layout.tsx` - 共用版面（會 persist，不會重新渲染）
- `loading.tsx` - Loading UI (搭配 Suspense)
- `error.tsx` - Error boundary（必須是 Client Component）
- `not-found.tsx` - 404 頁面

**Route Groups**
```
app/
├── (marketing)/       # 不影響 URL 路徑
│   ├── layout.tsx    # 共用 layout
│   ├── about/
│   └── pricing/
└── (dashboard)/
    ├── layout.tsx
    └── settings/
```

## Data Fetching

**Server Components 中直接 fetch**
```tsx
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    cache: 'force-cache', // SSG 行為（預設）
    // cache: 'no-store',  // SSR 行為
    // next: { revalidate: 60 } // ISR 行為
  })
  return res.json()
}

export default async function PostsPage() {
  const posts = await getPosts()
  return <PostsList posts={posts} />
}
```

**並行資料抓取**
```tsx
// ✅ 正確：並行執行
async function Page() {
  const [user, posts] = await Promise.all([
    getUser(),
    getPosts()
  ])
  return <div>...</div>
}

// ❌ 錯誤：序列執行（慢）
async function Page() {
  const user = await getUser()
  const posts = await getPosts() // 要等 user 完成
  return <div>...</div>
}
```

## State Management

### URL State (推薦用於 filters/pagination)
```tsx
// app/products/page.tsx
import { useSearchParams } from 'next/navigation'

export default function Products() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  
  // URL: /products?category=electronics
  return <ProductList category={category} />
}
```

### Local State
```tsx
// components/Counter.tsx
'use client'
import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### Server State (推薦 React Query/SWR)
```tsx
// 用於 Client Component 中的資料抓取
'use client'
import useSWR from 'swr'

export function Posts() {
  const { data, error, isLoading } = useSWR('/api/posts', fetcher)
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error</div>
  return <PostsList posts={data} />
}
```

## Common Pitfalls & Solutions

### 1. Hydration Mismatch
```tsx
// ❌ 錯誤：Server 和 Client 內容不一致
'use client'
export function Time() {
  return <div>{new Date().toISOString()}</div>
  // Server render 的時間 ≠ Client hydration 的時間
}

// ✅ 解決方案 1：使用 useEffect
'use client'
import { useState, useEffect } from 'react'

export function Time() {
  const [time, setTime] = useState('')
  
  useEffect(() => {
    setTime(new Date().toISOString())
  }, [])
  
  return <div>{time || 'Loading...'}</div>
}

// ✅ 解決方案 2：禁用 SSR
import dynamic from 'next/dynamic'

const Time = dynamic(() => import('./Time'), { ssr: false })
```

### 2. Props Serialization
```tsx
// ❌ 錯誤：傳遞 function 給 Server Component
export default function Page() {
  const handleClick = () => console.log('click')
  return <ServerComponent onClick={handleClick} /> // Error!
}

// ✅ 解決方案：將 Client Component 作為 children
export default function Page() {
  return (
    <ServerComponent>
      <ClientButton /> {/* Client Component 內部處理 onClick */}
    </ServerComponent>
  )
}
```

### 3. Unnecessary Re-renders
```tsx
// ❌ 錯誤：layout 重複渲染
// app/layout.tsx
'use client'
import { useState } from 'react'

export default function RootLayout({ children }) {
  const [state, setState] = useState()
  // layout 會在路由改變時重新渲染
}

// ✅ 解決方案：Layout 保持為 Server Component
// 將 state 放在 Provider 或更小範圍的 Client Component
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <StateProvider> {/* Client Component */}
          {children}
        </StateProvider>
      </body>
    </html>
  )
}
```

## Performance Optimization

### Image Optimization
```tsx
import Image from 'next/image'

// ✅ 使用 Next.js Image
<Image
  src="/photo.jpg"
  alt="Photo"
  width={500}
  height={300}
  priority // 首屏圖片使用
/>
```

### Dynamic Imports
```tsx
// 延遲載入大型 Client Component
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false // 可選：完全在客戶端渲染
})
```

### Streaming with Suspense
```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<PostsSkeleton />}>
        <Posts /> {/* async Server Component */}
      </Suspense>
    </div>
  )
}
```

## Quick Reference

**何時使用 Server Components：**
- 資料抓取
- 存取後端資源
- 保持敏感資訊在伺服器
- 減少客戶端 JavaScript bundle

**何時使用 Client Components：**
- 事件處理（onClick, onChange, etc.）
- Hooks（useState, useEffect, etc.）
- 瀏覽器 API（localStorage, window, etc.）
- 第三方需要瀏覽器環境的套件

**記住：**
- 預設使用 Server Components
- 將 `'use client'` 邊界推到樹的最底層
- Layout 保持為 Server Component
- 使用 URL state 取代複雜的客戶端 state 管理
- Server Components 可渲染 Client Components，但反之不行