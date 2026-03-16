/// <reference types="vite/client" />

// Allow importing CSS files in TypeScript without type errors.
// This is needed for imports like `import './index.css';`.
declare module "*.css";
