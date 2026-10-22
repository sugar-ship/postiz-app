import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ContentPillarDto {
  @IsString()
  @MinLength(1)
  penNameId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  examples: string[];

  @IsBoolean()
  active: boolean;

  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class AudienceAngleDto {
  @IsString()
  @MinLength(1)
  penNameId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  readerNeed?: string;

  @IsOptional()
  @IsString()
  desiredReaction?: string;

  @IsArray()
  @IsString({ each: true })
  objections: string[];

  @IsObject()
  platformNotes: Record<string, unknown>;

  @IsBoolean()
  active: boolean;
}
