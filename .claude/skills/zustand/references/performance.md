# Performance Optimization

## Overview

This guide covers performance optimization strategies for Zustand stores in Next.js applications.

## Selector Optimization

### Avoid Re-renders with Proper Selectors

```typescript
// ❌ Bad: Creates new object reference on every render
function UserProfile() {
  const { user, isLoading } = useUserStore()
  // Component re-renders even if only unrelated state changes
}

// ✅ Good: Selector prevents unnecessary re-renders
function UserProfile() {
  const user = useUserStore((state) => state.user)
  const isLoading = useUserStore((state) => state.isLoading)
  // Only re-renders when user or isLoading changes
}
```

### Use Shallow Equality for Multiple Values

```typescript
import { shallow } from 'zustand/shallow'

// ✅ Best: Multiple values with shallow comparison
function UserProfile() {
  const { user, isLoading } = useUserStore(
    (state) => ({ user: state.user, isLoading: state.isLoading }),
    shallow
  )
  // Only re-renders when user or isLoading values change
}
```

### Custom Equality Functions

```typescript
import { create } from 'zustand'

// Deep comparison for complex objects
function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function TodoList() {
  const todos = useStore(
    (state) => state.todos.filter((todo) => !todo.completed),
    deepEqual
  )
}
```

## Derived State

### Memoize Computed Values

```typescript
// ❌ Bad: Recomputes on every render
function ProductList() {
  const products = useProductStore((state) => state.products)
  const total = products.reduce((sum, p) => sum + p.price, 0) // Recomputes every render
  return <div>Total: {total}</div>
}

// ✅ Good: Use useMemo
function ProductList() {
  const products = useProductStore((state) => state.products)
  const total = useMemo(
    () => products.reduce((sum, p) => sum + p.price, 0),
    [products]
  )
  return <div>Total: {total}</div>
}

// ✅ Better: Derive in selector
function ProductList() {
  const total = useProductStore((state) =>
    state.products.reduce((sum, p) => sum + p.price, 0)
  )
  return <div>Total: {total}</div>
}
```

### Selector Factories

```typescript
// utils/selectors.ts
export const selectTodosByStatus = (status) => (state) =>
  state.todos.filter((todo) => todo.status === status)

export const selectTodoCount = (state) => state.todos.length

export const selectActiveTodos = (state) =>
  state.todos.filter((todo) => !todo.completed)

// Usage
function TodoList() {
  const activeTodos = useTodoStore(selectActiveTodos)
  const completedTodos = useTodoStore(selectTodosByStatus('completed'))
}
```

## Code Splitting

### Lazy Load Stores

```typescript
// stores/index.ts
export const useUserStore = create(() => ({ /* minimal initial state */ }))

// Load full store logic on demand
export async function loadUserStore() {
  const { initializeUserStore } = await import('./userStoreLogic')
  initializeUserStore(useUserStore)
}

// Usage
function App() {
  useEffect(() => {
    loadUserStore()
  }, [])
}
```

### Split Large Stores

```typescript
// Instead of one large store
const useLargeStore = create(() => ({
  user: {},
  products: [],
  cart: [],
  orders: [],
  // ... many more fields
}))

// ✅ Split into domain-specific stores
const useUserStore = create(() => ({ user: {} }))
const useProductStore = create(() => ({ products: [] }))
const useCartStore = create(() => ({ cart: [] }))
const useOrderStore = create(() => ({ orders: [] }))
```

## Action Optimization

### Batch Updates

```typescript
// ❌ Bad: Multiple separate updates
function updateUserProfile(name, email, avatar) {
  useUserStore.setState({ name })
  useUserStore.setState({ email })
  useUserStore.setState({ avatar })
}

// ✅ Good: Single batched update
function updateUserProfile(name, email, avatar) {
  useUserStore.setState({ name, email, avatar })
}
```

### Avoid Inline Functions

```typescript
// ❌ Bad: Creates new function on every render
function TodoItem({ id }) {
  return (
    <button onClick={() => useStore.getState().toggleTodo(id)}>
      Toggle
    </button>
  )
}

// ✅ Good: Stable function reference
function TodoItem({ id }) {
  const toggleTodo = useStore((state) => state.toggleTodo)
  const handleClick = useCallback(() => toggleTodo(id), [toggleTodo, id])
  
  return <button onClick={handleClick}>Toggle</button>
}
```

### Debounce Expensive Operations

```typescript
import { debounce } from 'lodash'

export const useSearchStore = create((set) => ({
  query: '',
  results: [],
  setQuery: debounce((query) => {
    set({ query })
    // Expensive search operation
    searchAPI(query).then((results) => set({ results }))
  }, 300),
}))
```

## Memory Management

### Clean Up Subscriptions

```typescript
function Component() {
  useEffect(() => {
    const unsubscribe = useStore.subscribe(
      (state) => state.data,
      (data) => console.log('Data changed:', data)
    )
    
    return () => unsubscribe() // Clean up on unmount
  }, [])
}
```

### Reset Store on Unmount

```typescript
function Dashboard() {
  useEffect(() => {
    return () => {
      // Clean up when leaving dashboard
      useDashboardStore.setState({
        data: null,
        isLoading: false,
        error: null,
      })
    }
  }, [])
}
```

## Persistence Optimization

### Selective Persistence

```typescript
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set) => ({
      // Persisted fields
      preferences: {},
      theme: 'light',
      // Non-persisted fields
      tempData: null,
      isLoading: false,
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        theme: state.theme,
        // Exclude tempData and isLoading
      }),
    }
  )
)
```

### Throttle Persistence

```typescript
import { throttle } from 'lodash'

const throttledSet = throttle(
  (data) => localStorage.setItem('store', JSON.stringify(data)),
  1000
)

export const useStore = create(
  persist(
    (set) => ({ /* state */ }),
    {
      name: 'app-storage',
      storage: {
        getItem: (name) => JSON.parse(localStorage.getItem(name) || '{}'),
        setItem: (name, value) => throttledSet(value),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
```

## React Performance

### Avoid Context Re-renders

```typescript
// ❌ Bad: Context causes all consumers to re-render
const StoreContext = createContext(null)

function Provider({ children }) {
  const store = useStore() // All state changes cause re-render
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

// ✅ Good: Direct store usage, no context needed
function Component() {
  const data = useStore((state) => state.data)
  // Only re-renders when data changes
}
```

### Memoize Components

```typescript
import { memo } from 'react'

// Prevent re-render when props haven't changed
const TodoItem = memo(function TodoItem({ id, text, completed }) {
  const toggleTodo = useStore((state) => state.toggleTodo)
  
  return (
    <div>
      <input
        type="checkbox"
        checked={completed}
        onChange={() => toggleTodo(id)}
      />
      {text}
    </div>
  )
})
```

### Virtual Lists for Large Data

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function LargeList() {
  const items = useStore((state) => state.items) // 10,000+ items
  const parentRef = useRef()
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  })
  
  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div key={virtualItem.index} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualItem.size}px`,
            transform: `translateY(${virtualItem.start}px)`,
          }}>
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## DevTools Optimization

### Disable in Production

```typescript
import { devtools } from 'zustand/middleware'

export const useStore = create(
  devtools(
    (set) => ({ /* state */ }),
    {
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)
```

### Limit DevTools Actions

```typescript
export const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set(
        (state) => ({ count: state.count + 1 }),
        false, // Don't replace entire state
        'increment' // Action name in DevTools
      ),
    }),
    {
      name: 'CounterStore',
      maxAge: 50, // Only keep last 50 actions
    }
  )
)
```

## Profiling and Monitoring

### Performance Monitoring

```typescript
const monitor = (config) => (set, get, api) =>
  config(
    (...args) => {
      const start = performance.now()
      set(...args)
      const end = performance.now()
      
      if (end - start > 16) { // Longer than 1 frame
        console.warn('Slow state update:', end - start, 'ms')
      }
    },
    get,
    api
  )

export const useStore = create(monitor((set) => ({ /* state */ })))
```

### Track Render Count

```typescript
function Component() {
  const renderCount = useRef(0)
  renderCount.current++
  
  console.log('Render count:', renderCount.current)
  
  const data = useStore((state) => state.data)
  return <div>{data}</div>
}
```

## Best Practices Summary

1. **Selectors**: Use granular selectors to minimize re-renders
2. **Shallow comparison**: Use `shallow` for multiple values
3. **Split stores**: Separate concerns into different stores
4. **Batch updates**: Combine multiple setState calls
5. **Memoization**: Cache computed values and callbacks
6. **Clean up**: Unsubscribe and reset on unmount
7. **Selective persistence**: Only persist necessary data
8. **Virtual lists**: For rendering large datasets
9. **Production builds**: Disable devtools in production
10. **Monitor performance**: Track slow updates and re-renders