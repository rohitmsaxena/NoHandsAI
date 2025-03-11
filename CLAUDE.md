# CLAUDE.md - Project Guidelines

## Build/Test Commands
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Fix ESLint issues automatically
- `npm run clean` - Clean build artifacts and node_modules

## Code Style
- Indentation: 4 spaces
- Quotes: Double quotes
- Semicolons: Required
- Max line length: 140 characters
- No comma dangle
- Imports ordered: builtin > external > internal
- Camelcase naming convention
- Explicit member accessibility in TypeScript
- Error handling: Use try/catch with console.error

## TypeScript
- Types defined in shared electron/src state files
- Shared RPC definitions between main and renderer
- Use 'as const' for immutable objects
- Prefer explicit types over 'any'