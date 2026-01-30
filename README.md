# 9jaSettlement v2 - Frontend

Cross-border financial platform frontend built with Vite, React, TypeScript, and TanStack Query.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 19** - UI library
- **TypeScript** - Type safety
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
   You can also use **pnpm**: run `pnpm import` to create `pnpm-lock.yaml` from `package-lock.json`, then use `pnpm install` and `pnpm run dev` going forward. It's not too late to switch.

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── api/              # API clients and configuration
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── routes/          # Route definitions
├── screens/         # Page components
│   ├── auth/       # Authentication screens
│   ├── dashboard/  # Dashboard screens
│   ├── error/      # Error screens
│   └── onboarding/ # Onboarding flows
├── services/        # Service layer
├── store/           # Zustand stores
└── utils/           # Utility functions
```

## Onboarding Flow

The onboarding flow supports three account types:
- **Individual** - Personal accounts
- **Business** - Business accounts
- **Agent** - Agent accounts

### Flow Steps

1. Select Account Type
2. Create Account (email, password, referral/promo codes)
3. Verify Email (6-digit OTP)
4. Success Screen
5. Limited Dashboard Access
6. KYC/KYB Completion

## Development

Follow the troott-web-app paradigm:
- Use TanStack Query for data fetching
- Use Zustand for global state
- Use React Router for navigation
- Follow the existing folder structure
- Use TypeScript for type safety
