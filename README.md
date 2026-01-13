# Meep Chat Room

[English](README.md) | [繁體中文](README.zh-TW.md)

---

An application demo built with Next.js 16 App Router, React 19, Zustand state management, and Tailwind CSS. This project demonstrates best practices for interactive messaging interfaces, including optimistic updates, theme switching, and responsive design.

## Features

- **Real-time Messaging**: Send and receive text messages with instant UI updates
- **Message Reactions**: React to messages with like, love, and laugh emojis
- **Image Sharing**: Upload and preview images (PNG, JPEG, WebP) with file validation (max 5MB)
- **Multiple Conversations**: Manage up to 10 conversations with different participants
- **Dark/Light Theme**: Toggle between dark and light modes with persistent preference
- **Responsive Design**: Mobile-first design with drawer sidebar for small screens
- **Optimistic Updates**: Instant UI feedback with automatic rollback on failure
- **Data Persistence**: LocalStorage integration for user messages and reactions
- **Mock API**: Realistic network delay simulation (300ms) for development

## Tech Stack

### Core Framework
- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - Latest React with automatic batching
- **TypeScript 5** - Type-safe development

### State Management
- **Zustand 5.0.9** - Lightweight state management
  - DevTools integration for debugging
  - LocalStorage persistence middleware
  - Modular slice pattern

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible headless components
  - Avatar, Dialog, Dropdown Menu, Scroll Area
- **next-themes 0.4.6** - Dark/light mode management
- **lucide-react 0.562.0** - Modern icon library
- **Class Variance Authority** - Type-safe component variants

## Installation

### Prerequisites
- Node.js 20.x or higher
- npm, yarn, pnpm, or bun

### Setup

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd meep-chat-room

# Install dependencies
pnpm install
```

## Usage

### Development Mode

Start the development server with hot reload:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Production Build

Build the optimized production bundle:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

### Code Quality

Run ESLint to check code quality:

```bash
pnpm lint
```

## Project Structure

```
meep-chat-room/
├── src/
│   ├── apis/              # API simulation and mock data handlers
│   │   └── conversation.ts
│   ├── app/               # Next.js App Router pages and layouts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/        # React components (organized by feature)
│   │   ├── chat/          # Chat messaging components
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── ReactionButton.tsx
│   │   ├── layout/        # Layout components
│   │   │   └── ChatLayout.tsx
│   │   ├── sidebar/       # Conversation list and search
│   │   │   ├── ConversationItem.tsx
│   │   │   ├── ConversationList.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── theme/         # Theme toggle component
│   │   │   └── ThemeToggle.tsx
│   │   └── ui/            # Reusable UI components (Radix UI wrapped)
│   ├── hooks/             # Custom React hooks
│   │   └── use-mobile.tsx
│   ├── lib/               # Utilities, types, and mock data
│   │   ├── chatData.json  # Mock conversation data (10 conversations, 140+ messages)
│   │   ├── types.ts       # TypeScript type definitions
│   │   └── utils.ts       # Utility functions (cn, etc.)
│   ├── stores/            # Zustand state management
│   │   ├── slices/        # Modular store slices
│   │   │   ├── ConversationSlice.ts
│   │   │   └── MessageSlice.ts
│   │   ├── utils/         # Store utilities
│   │   └── useChatStore.ts
│   └── public/            # Static assets
├── .gitignore
├── eslint.config.mjs      # ESLint configuration
├── next.config.ts         # Next.js configuration
├── package.json
├── postcss.config.mjs     # PostCSS configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Development Workflow

### State Management Architecture

The application uses Zustand with a modular slice pattern:

- **ConversationSlice**: Manages conversation list, selection, and initialization
- **MessageSlice**: Handles message CRUD operations, reactions, and persistence

Store features:
- Lazy loading for conversations
- Optimistic UI updates for messages and reactions
- Automatic rollback on API failure
- LocalStorage persistence for user-generated content

### Component Patterns

- **Server Components**: Default for static content and layouts
- **Client Components**: Used for interactive features (chat input, reactions, theme toggle)
- **Composition**: Radix UI primitives wrapped in custom components
- **Memoization**: Performance optimization for expensive renders

### Mock Data

Development uses mock data from `src/lib/chatData.json`:
- 10 predefined conversations
- 5 participant users (Alice, Bob, Charlie, David, Emma)
- 140+ sample messages
- User ID 6 represents "Me" (current user)

### API Simulation

API calls are simulated with 300ms network delay:
```typescript
// Example: Sending a message
await new Promise(resolve => setTimeout(resolve, 300))
```

## Key Features Explained

### Message Reactions

Users can react to any message with three emotion types:
- Like
- Love
- Laugh

Reactions use optimistic updates with automatic rollback on failure and 3-second error timeout.

### Image Upload

Image upload supports:
- **Formats**: PNG, JPEG, WebP
- **Max size**: 5MB
- **Validation**: Client-side format and size checking
- **Preview**: Blob URL preview with proper cleanup

### Theme Switching

Dark/light mode implementation:
- Uses `next-themes` for persistent theme preference
- CSS variables for color tokens
- System preference detection
- Smooth transition animations

### Responsive Design

Mobile-first approach:
- Desktop: Side-by-side conversation list and chat area
- Mobile: Drawer sidebar with hamburger menu
- Breakpoint: 768px (md in Tailwind)

## License

This project is private and not licensed for public use.

Built with:
- [Next.js](https://nextjs.org/) - The React Framework for the Web
- [Zustand](https://github.com/pmndrs/zustand) - Bear necessities for state management
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components
- [Lucide](https://lucide.dev/) - Beautiful & consistent icons
