# Testing Zustand Stores

## Overview

This guide covers comprehensive testing strategies for Zustand stores in Next.js applications.

## Basic Store Testing

### Unit Testing Store Actions

```typescript
// stores/useCounterStore.ts
import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))

// __tests__/useCounterStore.test.ts
import { renderHook, act } from '@testing-library/react'
import { useCounterStore } from '@/stores/useCounterStore'

describe('useCounterStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCounterStore.setState({ count: 0 })
  })

  it('should initialize with count 0', () => {
    const { result } = renderHook(() => useCounterStore())
    expect(result.current.count).toBe(0)
  })

  it('should increment count', () => {
    const { result } = renderHook(() => useCounterStore())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })

  it('should decrement count', () => {
    const { result } = renderHook(() => useCounterStore())
    
    act(() => {
      useCounterStore.setState({ count: 5 })
      result.current.decrement()
    })
    
    expect(result.current.count).toBe(4)
  })

  it('should reset count', () => {
    const { result } = renderHook(() => useCounterStore())
    
    act(() => {
      useCounterStore.setState({ count: 10 })
      result.current.reset()
    })
    
    expect(result.current.count).toBe(0)
  })
})
```

## Testing Async Actions

### Testing Async State Updates

```typescript
// stores/useUserStore.ts
interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
  fetchUser: (id: string) => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  fetchUser: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const user = await fetchUserAPI(id)
      set({ user, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },
}))

// __tests__/useUserStore.test.ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { useUserStore } from '@/stores/useUserStore'
import { fetchUserAPI } from '@/api/users'

jest.mock('@/api/users')

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, isLoading: false, error: null })
    jest.clearAllMocks()
  })

  it('should fetch user successfully', async () => {
    const mockUser = { id: '1', name: 'John Doe' }
    ;(fetchUserAPI as jest.Mock).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useUserStore())

    act(() => {
      result.current.fetchUser('1')
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.error).toBeNull()
    })
  })

  it('should handle fetch error', async () => {
    const errorMessage = 'Failed to fetch user'
    ;(fetchUserAPI as jest.Mock).mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useUserStore())

    act(() => {
      result.current.fetchUser('1')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.error).toBe(errorMessage)
    })
  })
})
```

## Testing with Components

### Integration Testing

```typescript
// components/Counter.tsx
import { useCounterStore } from '@/stores/useCounterStore'

export function Counter() {
  const count = useCounterStore((state) => state.count)
  const increment = useCounterStore((state) => state.increment)
  const decrement = useCounterStore((state) => state.decrement)

  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  )
}

// __tests__/Counter.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Counter } from '@/components/Counter'
import { useCounterStore } from '@/stores/useCounterStore'

describe('Counter', () => {
  beforeEach(() => {
    useCounterStore.setState({ count: 0 })
  })

  it('should display current count', () => {
    render(<Counter />)
    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })

  it('should increment on button click', () => {
    render(<Counter />)
    
    fireEvent.click(screen.getByText('+'))
    
    expect(screen.getByTestId('count')).toHaveTextContent('1')
  })

  it('should decrement on button click', () => {
    useCounterStore.setState({ count: 5 })
    render(<Counter />)
    
    fireEvent.click(screen.getByText('-'))
    
    expect(screen.getByTestId('count')).toHaveTextContent('4')
  })
})
```

## Testing Store Selectors

```typescript
// selectors/userSelectors.ts
export const selectUserName = (state) => state.user?.name ?? 'Guest'
export const selectIsLoggedIn = (state) => state.user !== null
export const selectUserEmail = (state) => state.user?.email

// __tests__/userSelectors.test.ts
import { renderHook } from '@testing-library/react'
import { useUserStore } from '@/stores/useUserStore'
import { selectUserName, selectIsLoggedIn } from '@/selectors/userSelectors'

describe('User Selectors', () => {
  beforeEach(() => {
    useUserStore.setState({ user: null })
  })

  it('should return Guest when user is null', () => {
    const { result } = renderHook(() => useUserStore(selectUserName))
    expect(result.current).toBe('Guest')
  })

  it('should return user name when logged in', () => {
    useUserStore.setState({ user: { id: '1', name: 'John', email: 'john@example.com' } })
    const { result } = renderHook(() => useUserStore(selectUserName))
    expect(result.current).toBe('John')
  })

  it('should return false when user is not logged in', () => {
    const { result } = renderHook(() => useUserStore(selectIsLoggedIn))
    expect(result.current).toBe(false)
  })

  it('should return true when user is logged in', () => {
    useUserStore.setState({ user: { id: '1', name: 'John', email: 'john@example.com' } })
    const { result } = renderHook(() => useUserStore(selectIsLoggedIn))
    expect(result.current).toBe(true)
  })
})
```

## Testing Persistence

```typescript
// __tests__/persistedStore.test.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString() },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Persisted Store', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should persist state to localStorage', () => {
    const useStore = create(
      persist(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
        }),
        { name: 'test-storage' }
      )
    )

    const { result } = renderHook(() => useStore())
    
    act(() => {
      result.current.increment()
    })

    const stored = JSON.parse(localStorage.getItem('test-storage'))
    expect(stored.state.count).toBe(1)
  })

  it('should hydrate from localStorage', () => {
    localStorage.setItem('test-storage', JSON.stringify({
      state: { count: 5 },
      version: 0,
    }))

    const useStore = create(
      persist(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
        }),
        { name: 'test-storage' }
      )
    )

    const { result } = renderHook(() => useStore())
    
    // Wait for hydration
    waitFor(() => {
      expect(result.current.count).toBe(5)
    })
  })
})
```

## Testing Middleware

```typescript
// middleware/logger.ts
export const logger = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log('  applying', args)
      set(...args)
      console.log('  new state', get())
    },
    get,
    api
  )

// __tests__/logger.test.ts
import { create } from 'zustand'
import { logger } from '@/middleware/logger'

describe('Logger Middleware', () => {
  let consoleLogSpy

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  it('should log state changes', () => {
    const useStore = create(
      logger((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }))
    )

    const { result } = renderHook(() => useStore())

    act(() => {
      result.current.increment()
    })

    expect(consoleLogSpy).toHaveBeenCalledWith('  applying', expect.anything())
    expect(consoleLogSpy).toHaveBeenCalledWith('  new state', expect.objectContaining({ count: 1 }))
  })
})
```

## Testing Slices

```typescript
// __tests__/slices.test.ts
import { create } from 'zustand'
import { createUserSlice } from '@/stores/slices/createUserSlice'
import { createCartSlice } from '@/stores/slices/createCartSlice'

describe('Store Slices', () => {
  it('should combine slices correctly', () => {
    const useStore = create((...a) => ({
      ...createUserSlice(...a),
      ...createCartSlice(...a),
    }))

    const { result } = renderHook(() => useStore())

    expect(result.current.user).toBeNull()
    expect(result.current.items).toEqual([])
  })

  it('should maintain slice independence', () => {
    const useStore = create((...a) => ({
      ...createUserSlice(...a),
      ...createCartSlice(...a),
    }))

    const { result } = renderHook(() => useStore())

    act(() => {
      result.current.setUser({ id: '1', name: 'John' })
    })

    expect(result.current.user).toEqual({ id: '1', name: 'John' })
    expect(result.current.items).toEqual([]) // Cart slice unaffected
  })
})
```

## Mocking Stores in Tests

### Mock Store for Component Tests

```typescript
// __tests__/mocks/stores.ts
export const mockUserStore = (overrides = {}) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser: jest.fn(),
  fetchUser: jest.fn(),
  ...overrides,
})

// __tests__/UserProfile.test.tsx
import { useUserStore } from '@/stores/useUserStore'
import { mockUserStore } from './mocks/stores'

jest.mock('@/stores/useUserStore')

describe('UserProfile', () => {
  it('should display user name', () => {
    const mockStore = mockUserStore({
      user: { id: '1', name: 'John Doe' },
    })
    
    ;(useUserStore as jest.Mock).mockImplementation((selector) =>
      selector(mockStore)
    )

    render(<UserProfile />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
```

## Test Utilities

### Reset All Stores

```typescript
// __tests__/utils/resetStores.ts
import { useUserStore } from '@/stores/useUserStore'
import { useCartStore } from '@/stores/useCartStore'
import { useProductStore } from '@/stores/useProductStore'

export function resetAllStores() {
  useUserStore.setState({ user: null, isLoading: false, error: null })
  useCartStore.setState({ items: [], total: 0 })
  useProductStore.setState({ products: [], isLoading: false })
}

// Usage in tests
beforeEach(() => {
  resetAllStores()
})
```

### Store Spy

```typescript
// __tests__/utils/storeSpy.ts
export function createStoreSpy(store) {
  const setState = jest.spyOn(store, 'setState')
  const getState = jest.spyOn(store, 'getState')
  
  return {
    setState,
    getState,
    reset: () => {
      setState.mockClear()
      getState.mockClear()
    },
  }
}

// Usage
const spy = createStoreSpy(useUserStore)
// ... run tests
expect(spy.setState).toHaveBeenCalledWith({ user: mockUser })
spy.reset()
```

## Best Practices

1. **Reset state**: Always reset stores before each test
2. **Mock APIs**: Mock external API calls to avoid network requests
3. **Test selectors**: Test complex selectors separately
4. **Integration tests**: Test stores with components for real-world scenarios
5. **Mock localStorage**: Mock storage for persistence tests
6. **Test async actions**: Use `waitFor` for async state updates
7. **Test error cases**: Always test error handling
8. **Use act()**: Wrap state updates in `act()` to avoid warnings
9. **Test middleware**: Test custom middleware in isolation
10. **Snapshot tests**: Use snapshots for complex state structures

## Common Testing Patterns

### Testing Subscriptions

```typescript
it('should notify subscribers on state change', () => {
  const listener = jest.fn()
  
  const unsubscribe = useStore.subscribe(
    (state) => state.count,
    listener
  )

  act(() => {
    useStore.getState().increment()
  })

  expect(listener).toHaveBeenCalledWith(1, 0)
  
  unsubscribe()
})
```

### Testing Computed Values

```typescript
it('should compute derived state correctly', () => {
  const { result } = renderHook(() => 
    useCartStore((state) => ({
      total: state.items.reduce((sum, item) => sum + item.price, 0),
      itemCount: state.items.length,
    }), shallow)
  )

  act(() => {
    useCartStore.getState().addItem({ id: '1', price: 10 })
  })

  expect(result.current.total).toBe(10)
  expect(result.current.itemCount).toBe(1)
})
```

### Testing Optimistic Updates

```typescript
it('should handle optimistic updates', async () => {
  const { result } = renderHook(() => useStore())

  act(() => {
    result.current.updateOptimistically({ id: '1', name: 'Updated' })
  })

  expect(result.current.item).toEqual({ id: '1', name: 'Updated' })

  await waitFor(() => {
    expect(result.current.item).toEqual({ id: '1', name: 'Server Value' })
  })
})
```