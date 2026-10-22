export interface PenNameRecord {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  websiteUrl?: string | null;
  defaultCallToAction?: string | null;
  active: boolean;
  brandProfile?: BrandProfileRecord | null;
  _count?: { books: number; series: number };
}

export interface BrandProfileRecord {
  id: string;
  voiceSummary: string;
  toneRules: string[];
  preferredLanguage: string[];
  avoidLanguage: string[];
  formattingRules: string[];
  examples: string[];
  contentBoundaries: string[];
  version: number;
}

export interface SeriesRecord {
  id: string;
  penNameId: string;
  name: string;
  slug: string;
  description?: string | null;
  genre?: string | null;
  audience?: string | null;
  seriesOrderNotes?: string | null;
  penName?: PenNameRecord;
  _count?: { books: number };
}

export interface BookRecord {
  id: string;
  penNameId: string;
  seriesId?: string | null;
  title: string;
  subtitle?: string | null;
  seriesNumber?: number | null;
  status: 'IDEA' | 'PREORDER' | 'LIVE' | 'BACKLIST' | 'ARCHIVED';
  releaseDate?: string | null;
  buyUrl?: string | null;
  readerMagnetUrl?: string | null;
  blurb?: string | null;
  shortPitch?: string | null;
  tropes: string[];
  themes: string[];
  hooks: string[];
  characters: string[];
  audience: string[];
  tone: string[];
  contentWarnings: string[];
  marketingNotes?: string | null;
  penName?: PenNameRecord;
  series?: SeriesRecord | null;
  sources?: BookSourceRecord[];
  _count?: { sources: number };
}

export interface BookSourceRecord {
  id: string;
  bookId: string;
  kind:
    | 'EXCERPT'
    | 'MANUSCRIPT'
    | 'REVIEW'
    | 'CHARACTER_NOTE'
    | 'WORLD_NOTE'
    | 'OTHER';
  title: string;
  content: string;
  mediaId?: string | null;
  checksum?: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface ContentPillarRecord {
  id: string;
  penNameId: string;
  name: string;
  description?: string | null;
  examples: string[];
  active: boolean;
  sortOrder: number;
  penName?: PenNameRecord;
}

export interface AudienceAngleRecord {
  id: string;
  penNameId: string;
  name: string;
  description?: string | null;
  readerNeed?: string | null;
  desiredReaction?: string | null;
  objections: string[];
  platformNotes: Record<string, string>;
  active: boolean;
  penName?: PenNameRecord;
}
