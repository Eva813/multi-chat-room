# Slice Pattern Guide

## Overview

The slice pattern allows you to split a large Zustand store into smaller, manageable pieces. This improves code organization, maintainability, and enables better code splitting.

## Basic Slice Pattern

### Creating Individual Slices

```typescript
// stores/slices/createUserSlice.ts
import { StateCreator } from 'zustand'

export interface UserSlice {
  user: User | null
  setUser: (user: User | null) => void
  clearUser: () => void
}

export const createUserSlice: StateCreator<
  UserSlice & CartSlice & UISlice,
  [],
  [],
  UserSlice
> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
})
```

```typescript
// stores/slices/createCartSlice.ts
export interface CartSlice {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

export const createCartSlice: StateCreator<
  UserSlice & CartSlice & UISlice,
  [],
  [],
  CartSlice
> = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({ 
    items: [...state.items, item] 
  })),
  removeItem: (id) => set((state) => ({ 
    items: state.items.filter((item) => item.id !== id) 
  })),
  clearCart: () => set({ items: [] }),
})
```

```typescript
// stores/slices/createUISlice.ts
export interface UISlice {
  isLoading: boolean
  theme: 'light' | 'dark'
  setLoading: (isLoading: boolean) => void
  toggleTheme: () => void
}

export const createUISlice: StateCreator<
  UserSlice & CartSlice & UISlice,
  [],
  [],
  UISlice
> = (set) => ({
  isLoading: false,
  theme: 'light',
  setLoading: (isLoading) => set({ isLoading }),
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
})
```

### Combining Slices

```typescript
// stores/useAppStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createUserSlice, UserSlice } from './slices/createUserSlice'
import { createCartSlice, CartSlice } from './slices/createCartSlice'
import { createUISlice, UISlice } from './slices/createUISlice'

type StoreState = UserSlice & CartSlice & UISlice

export const useAppStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUserSlice(...a),
        ...createCartSlice(...a),
        ...createUISlice(...a),
      }),
      { name: 'app-storage' }
    )
  )
)
```

## Cross-Slice Communication

### Method 1: Using get() in Actions

```typescript
// stores/slices/createOrderSlice.ts
export const createOrderSlice: StateCreator<
  UserSlice & CartSlice & OrderSlice,
  [],
  [],
  OrderSlice
> = (set, get) => ({
  orders: [],
  createOrder: async () => {
    const { user } = get()
    const { items, clearCart } = get()
    
    if (!user) throw new Error('User not logged in')
    if (items.length === 0) throw new Error('Cart is empty')
    
    // Create order logic
    const order = await createOrderAPI({ userId: user.id, items })
    
    set((state) => ({ orders: [...state.orders, order] }))
    clearCart()
  },
})
```

### Method 2: Derived State with Selectors

```typescript
// hooks/useCartTotal.ts
import { useAppStore } from '@/stores/useAppStore'

export const useCartTotal = () => {
  return useAppStore((state) => 
    state.items.reduce((total, item) => total + item.price * item.quantity, 0)
  )
}
```

## Selective Persistence

Persist only specific slices:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUserSlice(...a),
        ...createCartSlice(...a),
        ...createUISlice(...a),
      }),
      {
        name: 'app-storage',
        // Only persist user and theme
        partialize: (state) => ({
          user: state.user,
          theme: state.theme,
        }),
      }
    )
  )
)
```

## Async Slice Actions

```typescript
// stores/slices/createProductSlice.ts
export interface ProductSlice {
  products: Product[]
  isLoading: boolean
  error: string | null
  fetchProducts: () => Promise<void>
}

export const createProductSlice: StateCreator<
  ProductSlice,
  [],
  [],
  ProductSlice
> = (set) => ({
  products: [],
  isLoading: false,
  error: null,
  fetchProducts: async () => {
    set({ isLoading: true, error: null })
    try {
      const products = await fetchProductsAPI()
      set({ products, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },
})
```

## Best Practices

1. **Keep slices focused**: Each slice should handle a single domain
2. **Avoid circular dependencies**: Don't import slices into each other
3. **Use TypeScript**: Type safety prevents cross-slice errors
4. **Selective persistence**: Only persist what's necessary
5. **Consistent naming**: Use `create[Name]Slice` convention
6. **Export interfaces**: Make slice types reusable
7. **Document dependencies**: Note which slices interact with each other

## Advanced: Dynamic Slices

Load slices conditionally:

```typescript
// stores/useDynamicStore.ts
export const createDynamicStore = (features: string[]) => {
  const slices = {
    user: features.includes('user') ? createUserSlice : undefined,
    cart: features.includes('cart') ? createCartSlice : undefined,
    // ... other slices
  }

  return create()((...a) => ({
    ...(slices.user && slices.user(...a)),
    ...(slices.cart && slices.cart(...a)),
  }))
}
```

## Common Patterns

### Reset All Slices

```typescript
// stores/useAppStore.ts
export const useAppStore = create<StoreState>()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
  ...createUISlice(...a),
  // Global reset action
  resetStore: () => {
    useAppStore.setState({
      user: null,
      items: [],
      theme: 'light',
      // ... reset other state
    })
  },
}))
```

### Slice-Specific Resets

```typescript
// Each slice includes its own reset
export const createUserSlice: StateCreator<...> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  resetUserSlice: () => set({ user: null }),
})
```