export type IconicCategory = string;

export interface IconicIcon {
  readonly id: string;
  readonly unicodeSequence: string;
  readonly emoji: string;
  readonly name: string;
  readonly category: IconicCategory;
  readonly subcategory: string;
  readonly keywords: readonly string[];
  readonly assets: {
    readonly illustration: string;
    readonly emojiSvg: string;
    readonly emojiPng: Readonly<Record<'128' | '256' | '512', string>>;
  };
}

export declare const icons: readonly IconicIcon[];
export declare function toCodepoints(value: string, options?: { stripVariationSelectors?: boolean }): string;
export declare function getIcon(value: string): IconicIcon | undefined;
export declare function searchIcons(query: string, options?: { limit?: number }): IconicIcon[];
export declare function getAssetPath(value: string, variant?: 'illustration' | 'emoji-svg' | 'emoji-png', size?: 128 | 256 | 512): string | undefined;
