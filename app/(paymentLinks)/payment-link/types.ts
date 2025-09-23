// Re-export the consolidated types from the directory-based module.
// This ensures imports like "../types" resolve to the richer interfaces
// defined in types/index.ts (which include fields like `url`, `linkType`, etc.).
export * from "./types";
