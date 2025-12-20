/**
 * Type declarations for CSS module imports
 * Allows importing .css files as strings via esbuild css-text plugin
 */
declare module '*.css' {
  const content: string;
  export default content;
}
