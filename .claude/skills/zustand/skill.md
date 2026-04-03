---
name: nextjs-zustand
description: Comprehensive Next.js + Zustand state management patterns and best practices. Use when building Next.js applications with Zustand for (1) Setting up Zustand stores in Next.js App Router or Pages Router, (2) Implementing state management patterns (slices, middleware, persistence), (3) Server-side rendering (SSR/SSG) with Zustand, (4) Performance optimization and code splitting, (5) TypeScript integration, (6) DevTools and debugging setup, or (7) Testing Zustand stores
---

# Next.js + Zustand Best Practices

This skill provides production-ready patterns for integrating Zustand state management in Next.js applications.

## Core Concepts

### Zustand Store Structure

Create stores with clear separation of concerns:

```typescript
// stores/useUserStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UserState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  fetchUser: () => Promise<void>
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: false,
        setUser: (user) => set({ user }),
        fetchUser: async () => {
          set({ isLoading: true })
          // fetch logic
          set({ isLoading: false })
        },
      }),
      { name: 'user-storage' }
    )
  )
)
```

### Next.js App Router Integration

**Client Component Pattern:**
```typescript
'use client'
import { useUserStore } from '@/stores/useUserStore'

export default function UserProfile() {
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  return <div>{user?.name}</div>
}
```

**SSR Hydration Pattern:**
```typescript
// app/layout.tsx
import { HydrationBoundary } from '@/components/HydrationBoundary'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <HydrationBoundary>{children}</HydrationBoundary>
      </body>
    </html>
  )
}
```

### Store Slices Pattern

For large applications, split stores into slices:

```typescript
// stores/slices/createUserSlice.ts
export const createUserSlice = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
})

// stores/slices/createCartSlice.ts
export const createCartSlice = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
})

// stores/useAppStore.ts
export const useAppStore = create()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
}))
```

## Performance Optimization

### Selector Optimization

Use shallow equality for object selectors:
```typescript
import { shallow } from 'zustand/shallow'

// ❌ Bad: Creates new object on every render
const { user, isLoading } = useUserStore()

// ✅ Good: Only re-renders when values change
const { user, isLoading } = useUserStore(
  (state) => ({ user: state.user, isLoading: state.isLoading }),
  shallow
)
```

### Split Stores for Better Performance

Create separate stores for different domains:
```typescript
// ✅ Good: Separate stores
export const useUserStore = create(/* user state */)
export const useCartStore = create(/* cart state */)
export const useUIStore = create(/* UI state */)
```

## SSR/SSG Patterns

### Initialize Store from Server Data

```typescript
// app/page.tsx (Server Component)
import { UserClient } from './UserClient'

export default async function Page() {
  const userData = await fetchUserData()
  return <UserClient initialData={userData} />
}

// UserClient.tsx (Client Component)
'use client'
export function UserClient({ initialData }) {
  const initializeUser = useUserStore((state) => state.setUser)
  
  useEffect(() => {
    if (initialData) initializeUser(initialData)
  }, [initialData, initializeUser])
  
  return <UserProfile />
}
```

## Middleware Patterns

### Common Middleware Setup

```typescript
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'

export const useStore = create<State>()(
  devtools(
    persist(
      subscribeWithSelector((set) => ({
        // state and actions
      })),
      { name: 'app-storage' }
    )
  )
)
```

### Custom Middleware Example

```typescript
const logMiddleware = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log('State before:', get())
      set(...args)
      console.log('State after:', get())
    },
    get,
    api
  )
```

## TypeScript Best Practices

### Typed Store Creation

```typescript
import { create } from 'zustand'
import type { StateCreator } from 'zustand'

interface State {
  count: number
  increment: () => void
}

const createStore: StateCreator<State> = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
})

export const useStore = create<State>()(devtools(persist(createStore, { name: 'store' })))
```

### Typed Selectors

```typescript
// utils/storeHooks.ts
import { useStore } from '@/stores/useStore'

export const useCount = () => useStore((state) => state.count)
export const useIncrement = () => useStore((state) => state.increment)
```

## Testing

### Unit Testing Stores

```typescript
import { renderHook, act } from '@testing-library/react'
import { useUserStore } from '@/stores/useUserStore'

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({ user: null })
  })

  it('should set user', () => {
    const { result } = renderHook(() => useUserStore())
    
    act(() => {
      result.current.setUser({ id: '1', name: 'Test' })
    })
    
    expect(result.current.user).toEqual({ id: '1', name: 'Test' })
  })
})
```

## Advanced Patterns

For detailed implementation guides, see:
- **Slice Pattern**: [references/slice-pattern.md](references/slice-pattern.md) - Complete guide for organizing large stores
- **SSR Hydration**: [references/ssr-hydration.md](references/ssr-hydration.md) - Advanced server-side rendering patterns
- **Middleware**: [references/middleware.md](references/middleware.md) - Custom middleware examples
- **Performance**: [references/performance.md](references/performance.md) - Optimization strategies
- **Testing**: [references/testing.md](references/testing.md) - Comprehensive testing guide

## Quick Reference

**Installation:**
```bash
npm install zustand
# For Next.js App Router
npm install zustand react
```

**Basic Store:**
```typescript
import { create } from 'zustand'

export const useStore = create((set) => ({
  data: null,
  setData: (data) => set({ data }),
}))
```

**With Persist:**
```typescript
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist((set) => ({ /* state */ }), { name: 'storage-key' })
)
```

**Selector:**
```typescript
const data = useStore((state) => state.data)
```