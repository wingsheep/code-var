/**
 * The unique key for LocalStorage
 */
export const CODE_VAR_HISTORY = "CODE_VAR_HISTORY";

/**
 * Turn on the type of query needed on demand
 */
export const CASES = [
  "noCase",
  "camelCase",
  "pascalCase",
  "constantCase",
  "sentenceCase",
  "dotCase",
  "headerCase",
  "paramCase",
  "pathCase",
  "snakeCase",
] as const

/** The type of query alias */
export enum CASES_ALIAS  {
  "xt" = "camelCase",
  "dt" = "pascalCase",
  "cl" = "constantCase",
  "xh" = "snakeCase",
}
