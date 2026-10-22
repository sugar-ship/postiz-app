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

export type CampaignStatus =
  | 'DRAFT'
  | 'GENERATING'
  | 'REVIEW'
  | 'ACTIVE'
  | 'COMPLETE'
  | 'ARCHIVED';

export interface CampaignRecord {
  id: string;
  penNameId: string;
  bookId?: string | null;
  seriesId?: string | null;
  name: string;
  type:
    | 'LAUNCH'
    | 'PREORDER'
    | 'BACKLIST'
    | 'READER_MAGNET'
    | 'SALE'
    | 'EVERGREEN'
    | 'CUSTOM';
  objective: string;
  brief: string;
  startDate?: string | null;
  endDate?: string | null;
  status: CampaignStatus;
  targetPlatforms: string[];
  generationSettings: Record<string, unknown>;
  penName?: PenNameRecord;
  book?: BookRecord | null;
  series?: SeriesRecord | null;
  contentPillars?: Array<{ contentPillar: ContentPillarRecord }>;
  audienceAngles?: Array<{ audienceAngle: AudienceAngleRecord }>;
  ideas?: CampaignIdeaRecord[];
  _count?: { ideas: number };
}

export interface CampaignIdeaRecord {
  id: string;
  campaignId: string;
  title: string;
  coreConcept: string;
  hook: string;
  creativeDirection?: string | null;
  callToAction?: string | null;
  sourceRationale: Record<string, string>;
  status: 'GENERATED' | 'SHORTLISTED' | 'REJECTED' | 'ARCHIVED';
  generationBatchId?: string | null;
  variants?: CampaignVariantRecord[];
}

export interface CampaignVariantRecord {
  id: string;
  campaignIdeaId: string;
  platform: string;
  format:
    | 'TEXT'
    | 'IMAGE_POST'
    | 'CAROUSEL'
    | 'SHORT_VIDEO'
    | 'STORY'
    | 'THREAD'
    | 'PIN';
  content: string;
  headline?: string | null;
  callToAction?: string | null;
  hashtags: string[];
  mediaBrief: Record<string, string>;
  platformSettings: Record<string, string>;
  status:
    | 'GENERATED'
    | 'EDITED'
    | 'APPROVED'
    | 'REJECTED'
    | 'SENT_TO_COMPOSER'
    | 'SCHEDULED';
  model?: string | null;
  promptVersion?: string | null;
  generationMetadata: Record<string, unknown>;
}
