# Middleware Patterns

## Overview

Zustand middleware allows you to enhance store functionality with cross-cutting concerns like logging, persistence, devtools integration, and more.

## Built-in Middleware

### Persist Middleware

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: 'counter-storage',
      storage: createJSONStorage(() => localStorage),
      // Optional: Customize serialization
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => JSON.parse(str),
      // Optional: Partition state
      partialize: (state) => ({ count: state.count }),
      // Optional: Migration for version updates
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migrate from version 0 to 1
          return { ...persistedState, newField: 'default' }
        }
        return persistedState
      },
    }
  )
)
```

### DevTools Middleware

```typescript
import { devtools } from 'zustand/middleware'

export const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
    }),
    {
      name: 'MyStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)
```

### SubscribeWithSelector Middleware

```typescript
import { subscribeWithSelector } from 'zustand/middleware'

export const useStore = create(
  subscribeWithSelector((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }))
)

// Subscribe to specific slice
useStore.subscribe(
  (state) => state.count,
  (count, previousCount) => {
    console.log('Count changed from', previousCount, 'to', count)
  }
)
```

### Combining Multiple Middleware

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
    ),
    { name: 'AppStore' }
  )
)
```

## Custom Middleware

### Logging Middleware

```typescript
const log = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log('  applying', args)
      set(...args)
      console.log('  new state', get())
    },
    get,
    api
  )

export const useStore = create(
  log((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }))
)
```

### Immer Middleware

```typescript
import { produce } from 'immer'

const immer = (config) => (set, get, api) =>
  config(
    (fn) => set(produce(fn)),
    get,
    api
  )

export const useStore = create(
  immer((set) => ({
    todos: [],
    addTodo: (text) =>
      set((state) => {
        state.todos.push({ id: Date.now(), text, completed: false })
      }),
    toggleTodo: (id) =>
      set((state) => {
        const todo = state.todos.find((t) => t.id === id)
        if (todo) todo.completed = !todo.completed
      }),
  }))
)
```

### Validation Middleware

```typescript
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0),
})

const validate = (schema) => (config) => (set, get, api) =>
  config(
    (...args) => {
      const nextState = typeof args[0] === 'function' ? args[0](get()) : args[0]
      const result = schema.safeParse(nextState)
      
      if (!result.success) {
        console.error('Validation failed:', result.error)
        return
      }
      
      set(...args)
    },
    get,
    api
  )

export const useUserStore = create(
  validate(userSchema)((set) => ({
    name: '',
    email: '',
    age: 0,
    setUser: (user) => set(user),
  }))
)
```

### Undo/Redo Middleware

```typescript
const undo = (config) => (set, get, api) => {
  const initialState = config(set, get, api)
  
  return {
    ...initialState,
    past: [],
    future: [],
    undo: () =>
      set((state) => {
        const [previous, ...past] = state.past
        if (!previous) return state
        
        return {
          ...previous,
          past,
          future: [
            { ...state, past: state.past, future: state.future },
            ...state.future,
          ],
        }
      }),
    redo: () =>
      set((state) => {
        const [next, ...future] = state.future
        if (!next) return state
        
        return {
          ...next,
          past: [
            { ...state, past: state.past, future: state.future },
            ...state.past,
          ],
          future,
        }
      }),
    _set: set,
  }
}

// Wrap actions to track history
const trackHistory = (fn) => {
  return (...args) => {
    const state = useStore.getState()
    useStore.setState({
      past: [
        { ...state, past: state.past, future: state.future },
        ...state.past,
      ],
      future: [],
    })
    fn(...args)
  }
}
```

### Debounce Middleware

```typescript
const debounce = (config, delay = 300) => (set, get, api) => {
  let timeout
  
  return config(
    (...args) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        set(...args)
      }, delay)
    },
    get,
    api
  )
}

export const useSearchStore = create(
  debounce((set) => ({
    query: '',
    setQuery: (query) => set({ query }),
  }), 500)
)
```

### Analytics Middleware

```typescript
const analytics = (config) => (set, get, api) =>
  config(
    (...args) => {
      const previousState = get()
      set(...args)
      const newState = get()
      
      // Track state changes
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'state_change', {
          previous: previousState,
          current: newState,
        })
      }
    },
    get,
    api
  )
```

### Error Boundary Middleware

```typescript
const errorBoundary = (config) => (set, get, api) =>
  config(
    (...args) => {
      try {
        set(...args)
      } catch (error) {
        console.error('Store update failed:', error)
        // Optionally set error state
        set({ error: error.message })
      }
    },
    get,
    api
  )
```

## TypeScript Support

### Typed Middleware

```typescript
import { StateCreator } from 'zustand'

type LogMiddleware = <T>(
  config: StateCreator<T>
) => StateCreator<T>

const log: LogMiddleware = (config) => (set, get, api) =>
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

### Middleware with Extra State

```typescript
import { StateCreator } from 'zustand'

type UndoState = {
  past: any[]
  future: any[]
  undo: () => void
  redo: () => void
}

type UndoMiddleware = <T>(
  config: StateCreator<T>
) => StateCreator<T & UndoState>

const undo: UndoMiddleware = (config) => (set, get, api) => ({
  ...config(set, get, api),
  past: [],
  future: [],
  undo: () => { /* implementation */ },
  redo: () => { /* implementation */ },
})
```

## Best Practices

1. **Order matters**: Place middleware in logical order (devtools → persist → custom)
2. **Type safety**: Use TypeScript for middleware with complex state transformations
3. **Performance**: Be cautious with middleware that runs on every state change
4. **Testing**: Mock middleware in tests to isolate store logic
5. **Composition**: Keep middleware focused on single responsibilities
6. **Documentation**: Comment complex middleware behavior

## Common Patterns

### Conditional Middleware

```typescript
const conditionalMiddleware = (condition, middleware) => {
  return condition ? middleware : (config) => config
}

export const useStore = create(
  conditionalMiddleware(
    process.env.NODE_ENV === 'development',
    devtools
  )((set) => ({ /* state */ }))
)
```

### Async Middleware

```typescript
const asyncPersist = (config) => (set, get, api) => {
  const store = config(
    async (...args) => {
      set(...args)
      const state = get()
      await saveToServer(state)
    },
    get,
    api
  )
  
  // Load initial state
  loadFromServer().then((state) => set(state))
  
  return store
}
```

### Middleware Factory

```typescript
const createLoggerMiddleware = (options = {}) => {
  const { prefix = 'Store', enabled = true } = options
  
  return (config) => (set, get, api) =>
    config(
      (...args) => {
        if (!enabled) return set(...args)
        
        console.group(`${prefix} Update`)
        console.log('Previous:', get())
        set(...args)
        console.log('Next:', get())
        console.groupEnd()
      },
      get,
      api
    )
}

export const useStore = create(
  createLoggerMiddleware({ prefix: 'UserStore' })((set) => ({ /* state */ }))
)
```