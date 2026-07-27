# Repository Rules & Constraints

## Command Execution Restrictions
- **No Build Commands**: Do NOT execute any build, bundler, or dev server commands (e.g., `npm run dev`, `npm run build`, `npx react-native run-android`, `cd ios && pod install`, `./gradlew`).
- **No Git Commands**: Do NOT execute any `git` commands (e.g., `git add`, `git commit`, `git checkout`, `git push`, `git status`).

## Code Quality & Engineering Standards
- **Explicit User Approval Before Coding**: Do NOT edit, write, or refactor code files (.ts, .tsx, etc.) until the user explicitly asks to start implementation.
- **Industry Standards**: Implement clean, maintainable, and standardized React Native solutions.
- **Avoid Code Duplication**: Prefer reusable, well-designed components and contexts over inline duplicates or parallel implementations.
- **Memory Safety & Lifecycle**: Ensure animation, event listener, and async operations handle proper cleanup (e.g., stopping animations, removing event listeners on unmount).
