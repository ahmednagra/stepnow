// Ambient type declarations for non-TS assets imported as side effects
// or as modules. This is required so TypeScript stops complaining about
// `import "./globals.css"` and similar.

declare module "*.css";
declare module "*.scss";
declare module "*.sass";

// CSS Modules — typed as a string-keyed map so `styles.foo` returns string.
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
