import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { BookSourceKind, BookSourceStatus, BookStatus } from '@prisma/client';

export class BookDto {
  @IsString()
  @MinLength(1)
  penNameId: string;

  @IsOptional()
  @IsString()
  seriesId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(240)
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  seriesNumber?: number;

  @IsEnum(BookStatus)
  status: BookStatus;

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  buyUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  readerMagnetUrl?: string;

  @IsOptional()
  @IsString()
  blurb?: string;

  @IsOptional()
  @IsString()
  shortPitch?: string;

  @IsArray()
  @IsString({ each: true })
  tropes: string[];

  @IsArray()
  @IsString({ each: true })
  themes: string[];

  @IsArray()
  @IsString({ each: true })
  hooks: string[];

  @IsArray()
  @IsString({ each: true })
  characters: string[];

  @IsArray()
  @IsString({ each: true })
  audience: string[];

  @IsArray()
  @IsString({ each: true })
  tone: string[];

  @IsArray()
  @IsString({ each: true })
  contentWarnings: string[];

  @IsOptional()
  @IsString()
  marketingNotes?: string;
}

export class BookSourceDto {
  @IsEnum(BookSourceKind)
  kind: BookSourceKind;

  @IsString()
  @MinLength(1)
  @MaxLength(240)
  title: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsString()
  mediaId?: string;

  @IsOptional()
  @IsString()
  checksum?: string;

  @IsEnum(BookSourceStatus)
  status: BookSourceStatus;
}
