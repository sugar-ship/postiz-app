import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  CampaignIdeaStatus,
  CampaignStatus,
  CampaignType,
  CampaignVariantFormat,
} from '@prisma/client';

export class CampaignDto {
  @IsString()
  @MinLength(1)
  penNameId: string;

  @IsOptional()
  @IsString()
  bookId?: string;

  @IsOptional()
  @IsString()
  seriesId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(240)
  name: string;

  @IsEnum(CampaignType)
  type: CampaignType;

  @IsString()
  @MinLength(1)
  objective: string;

  @IsString()
  @MinLength(1)
  brief: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsEnum(CampaignStatus)
  status: CampaignStatus;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  targetPlatforms: string[];

  @IsObject()
  generationSettings: Record<string, unknown>;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  contentPillarIds: string[];

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  audienceAngleIds: string[];
}

export class CampaignIdeaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(240)
  title: string;

  @IsString()
  @MinLength(1)
  coreConcept: string;

  @IsString()
  @MinLength(1)
  hook: string;

  @IsOptional()
  @IsString()
  creativeDirection?: string;

  @IsOptional()
  @IsString()
  callToAction?: string;

  @IsObject()
  sourceRationale: Record<string, unknown>;

  @IsEnum(CampaignIdeaStatus)
  status: CampaignIdeaStatus;
}

export class CampaignVariantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  platform: string;

  @IsEnum(CampaignVariantFormat)
  format: CampaignVariantFormat;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  callToAction?: string;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  hashtags: string[];

  @IsObject()
  mediaBrief: Record<string, unknown>;

  @IsObject()
  platformSettings: Record<string, unknown>;
}
