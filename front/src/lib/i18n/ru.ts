import { dictRu } from "./dict-ru";

export const ru = dictRu;
export type TranslationKey = keyof typeof ru;

export type TParams = Record<string, string | number>;

export function interpolate(text: string, params?: TParams): string {
  if (!params) return text;
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    text,
  );
}
