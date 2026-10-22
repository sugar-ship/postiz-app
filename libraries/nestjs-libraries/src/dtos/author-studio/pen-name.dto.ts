import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class PenNameDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(120)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  defaultCallToAction?: string;

  @IsBoolean()
  active: boolean;
}

export class BrandProfileDto {
  @IsString()
  @MinLength(1)
  voiceSummary: string;

  @IsArray()
  @IsString({ each: true })
  toneRules: string[];

  @IsArray()
  @IsString({ each: true })
  preferredLanguage: string[];

  @IsArray()
  @IsString({ each: true })
  avoidLanguage: string[];

  @IsArray()
  @IsString({ each: true })
  formattingRules: string[];

  @IsArray()
  @IsString({ each: true })
  examples: string[];

  @IsArray()
  @IsString({ each: true })
  contentBoundaries: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}
