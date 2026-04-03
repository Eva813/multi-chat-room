# SSR/SSG Hydration Patterns

## Overview

This guide covers advanced patterns for using Zustand with Next.js server-side rendering (SSR) and static site generation (SSG).

## Core Hydration Pattern

### Hydration Boundary Component

```typescript
// components/HydrationBoundary.tsx
'use client'
import { useEffect, useState } from 'react'

export function HydrationBoundary({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return (
    <>
      {isHydrated ? children : null}
      {!isHydrated && <div>Loading...</div>}
    </>
  )
}
```

### Server Component to Client Component Data Flow

```typescript
// app/products/page.tsx (Server Component)
import { ProductsClient } from './ProductsClient'

export default async function ProductsPage() {
  const products = await fetchProducts()
  const categories = await fetchCategories()
  
  return (
    <ProductsClient 
      initialProducts={products}
      initialCategories={categories}
    />
  )
}

// app/products/ProductsClient.tsx (Client Component)
'use client'
import { useEffect } from 'react'
import { useProductStore } from '@/stores/useProductStore'

interface Props {
  initialProducts: Product[]
  initialCategories: Category[]
}

export function ProductsClient({ initialProducts, initialCategories }: Props) {
  const setProducts = useProductStore((state) => state.setProducts)
  const setCategories = useProductStore((state) => state.setCategories)
  
  useEffect(() => {
    setProducts(initialProducts)
    setCategories(initialCategories)
  }, [initialProducts, initialCategories, setProducts, setCategories])
  
  return <ProductList />
}
```

## App Router Patterns

### Layout-Level Initialization

```typescript
// app/layout.tsx
import { StoreInitializer } from '@/components/StoreInitializer'

export default async function RootLayout({ children }) {
  const session = await getSession()
  const settings = await getSettings()
  
  return (
    <html>
      <body>
        <StoreInitializer 
          session={session}
          settings={settings}
        >
          {children}
        </StoreInitializer>
      </body>
    </html>
  )
}

// components/StoreInitializer.tsx
'use client'
import { useEffect, useRef } from 'react'
import { useUserStore } from '@/stores/useUserStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function StoreInitializer({ session, settings, children }) {
  const initialized = useRef(false)
  
  useEffect(() => {
    if (!initialized.current) {
      useUserStore.setState({ user: session?.user })
      useSettingsStore.setState({ settings })
      initialized.current = true
    }
  }, [session, settings])
  
  return children
}
```

### Route-Specific Initialization

```typescript
// app/dashboard/page.tsx
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const [userData, analytics, notifications] = await Promise.all([
    fetchUserData(),
    fetchAnalytics(),
    fetchNotifications(),
  ])
  
  return (
    <DashboardClient
      initialData={{
        user: userData,
        analytics,
        notifications,
      }}
    />
  )
}
```

## Pages Router Patterns

### getServerSideProps Pattern

```typescript
// pages/products/[id].tsx
import { GetServerSideProps } from 'next'
import { useProductStore } from '@/stores/useProductStore'

interface Props {
  product: Product
  relatedProducts: Product[]
}

export default function ProductPage({ product, relatedProducts }: Props) {
  const setProduct = useProductStore((state) => state.setProduct)
  const setRelated = useProductStore((state) => state.setRelated)
  
  useEffect(() => {
    setProduct(product)
    setRelated(relatedProducts)
  }, [product, relatedProducts, setProduct, setRelated])
  
  return <ProductDetail />
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const product = await fetchProduct(params.id)
  const relatedProducts = await fetchRelatedProducts(product.categoryId)
  
  return {
    props: {
      product,
      relatedProducts,
    },
  }
}
```

### getStaticProps Pattern

```typescript
// pages/blog/[slug].tsx
import { GetStaticProps, GetStaticPaths } from 'next'
import { useBlogStore } from '@/stores/useBlogStore'

export default function BlogPost({ post, relatedPosts }: Props) {
  const setCurrentPost = useBlogStore((state) => state.setCurrentPost)
  
  useEffect(() => {
    setCurrentPost(post)
  }, [post, setCurrentPost])
  
  return <PostContent />
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = await fetchPost(params.slug)
  const relatedPosts = await fetchRelatedPosts(post.tags)
  
  return {
    props: { post, relatedPosts },
    revalidate: 60, // ISR: revalidate every 60 seconds
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await fetchAllPosts()
  return {
    paths: posts.map((post) => ({ params: { slug: post.slug } })),
    fallback: 'blocking',
  }
}
```

## Preventing Hydration Mismatch

### Safe Hydration Pattern

```typescript
// hooks/useHydration.ts
import { useEffect, useState } from 'react'

export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)
  
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  return isHydrated
}

// Usage in component
export function ProductList() {
  const isHydrated = useHydration()
  const products = useProductStore((state) => state.products)
  
  if (!isHydrated) {
    return <ProductListSkeleton />
  }
  
  return <div>{/* render products */}</div>
}
```

### Conditional Client-Only Rendering

```typescript
// components/ClientOnly.tsx
'use client'
import { useEffect, useState } from 'react'

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  return <>{children}</>
}

// Usage
import { ClientOnly } from '@/components/ClientOnly'

export default function Page() {
  return (
    <ClientOnly>
      <StoreBasedComponent />
    </ClientOnly>
  )
}
```

## Persisted Store Hydration

### Handling localStorage with SSR

```typescript
// stores/useCartStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => {
        // Return a no-op storage on server
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }
        return localStorage
      }),
    }
  )
)
```

### Delayed Hydration for Persisted Stores

```typescript
// components/PersistedStoreProvider.tsx
'use client'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/useCartStore'

export function PersistedStoreProvider({ children }) {
  const [isHydrated, setIsHydrated] = useState(false)
  
  useEffect(() => {
    // Wait for persisted state to load
    const unsubscribe = useCartStore.persist.onFinishHydration(() => {
      setIsHydrated(true)
    })
    
    return unsubscribe
  }, [])
  
  if (!isHydrated) {
    return <LoadingFallback />
  }
  
  return children
}
```

## Streaming SSR Patterns

### Suspense with Zustand

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { DashboardStats } from './DashboardStats'

export default function DashboardPage() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <DashboardStats />
    </Suspense>
  )
}

// DashboardStats.tsx (Server Component)
async function DashboardStats() {
  const stats = await fetchStats()
  return <StatsClient initialStats={stats} />
}

// StatsClient.tsx (Client Component)
'use client'
function StatsClient({ initialStats }) {
  const setStats = useStatsStore((state) => state.setStats)
  
  useEffect(() => {
    setStats(initialStats)
  }, [initialStats, setStats])
  
  return <StatsDisplay />
}
```

## Best Practices

1. **Initialize in useEffect**: Always initialize store from server data in `useEffect`
2. **Avoid hydration mismatches**: Use `ClientOnly` or hydration checks for conditional rendering
3. **Handle persisted state**: Provide SSR-safe storage implementation
4. **Use loading states**: Show skeletons during hydration
5. **Minimize data transfer**: Only pass necessary data from server to client
6. **Cache server data**: Use Next.js caching for frequently accessed data
7. **Type safety**: Ensure server and client data types match

## Common Pitfalls

### ❌ Direct store access in Server Components

```typescript
// ❌ DON'T: This won't work in Server Components
export default async function Page() {
  const data = useStore((state) => state.data) // Error!
  return <div>{data}</div>
}
```

### ✅ Pass data to Client Components

```typescript
// ✅ DO: Fetch in Server Component, pass to Client Component
export default async function Page() {
  const data = await fetchData()
  return <ClientComponent initialData={data} />
}
```

### ❌ Hydration mismatch with localStorage

```typescript
// ❌ DON'T: This causes hydration mismatch
const theme = useThemeStore((state) => state.theme) // 'light' on server, might be 'dark' on client
```

### ✅ Handle hydration properly

```typescript
// ✅ DO: Wait for hydration
const isHydrated = useHydration()
const theme = useThemeStore((state) => state.theme)
return isHydrated ? <div className={theme}>{children}</div> : null
```