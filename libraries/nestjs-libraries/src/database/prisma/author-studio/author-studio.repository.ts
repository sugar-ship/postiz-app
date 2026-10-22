import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import {
  BrandProfileDto,
  PenNameDto,
} from '@gitroom/nestjs-libraries/dtos/author-studio/pen-name.dto';
import { SeriesDto } from '@gitroom/nestjs-libraries/dtos/author-studio/series.dto';
import {
  BookDto,
  BookSourceDto,
} from '@gitroom/nestjs-libraries/dtos/author-studio/book.dto';
import {
  AudienceAngleDto,
  ContentPillarDto,
} from '@gitroom/nestjs-libraries/dtos/author-studio/taxonomy.dto';

type AuthorStudioModels =
  | 'penName'
  | 'brandProfile'
  | 'series'
  | 'book'
  | 'bookSource'
  | 'contentPillar'
  | 'audienceAngle';

@Injectable()
export class AuthorStudioRepository {
  constructor(private readonly _db: PrismaRepository<AuthorStudioModels>) {}

  listPenNames(organizationId: string) {
    return this._db.model.penName.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        brandProfile: { where: { deletedAt: null } },
        _count: {
          select: {
            books: { where: { deletedAt: null } },
            series: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  getPenName(organizationId: string, id: string) {
    return this._db.model.penName.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        brandProfile: { where: { deletedAt: null } },
        series: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
        books: { where: { deletedAt: null }, orderBy: { title: 'asc' } },
        contentPillars: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
        audienceAngles: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  createPenName(organizationId: string, dto: PenNameDto) {
    return this._db.model.penName.create({
      data: { organizationId, ...dto },
    });
  }

  async updatePenName(organizationId: string, id: string, dto: PenNameDto) {
    const result = await this._db.model.penName.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: dto,
    });
    return result.count ? this.getPenName(organizationId, id) : null;
  }

  archivePenName(organizationId: string, id: string) {
    return this._db.model.penName.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { active: false, deletedAt: new Date() },
    });
  }

  async upsertBrandProfile(
    organizationId: string,
    penNameId: string,
    dto: BrandProfileDto
  ) {
    if (!(await this.penNameExists(organizationId, penNameId))) return null;
    const data = {
      organizationId,
      penNameId,
      voiceSummary: dto.voiceSummary,
      toneRules: dto.toneRules as Prisma.InputJsonValue,
      preferredLanguage: dto.preferredLanguage as Prisma.InputJsonValue,
      avoidLanguage: dto.avoidLanguage as Prisma.InputJsonValue,
      formattingRules: dto.formattingRules as Prisma.InputJsonValue,
      examples: dto.examples as Prisma.InputJsonValue,
      contentBoundaries: dto.contentBoundaries as Prisma.InputJsonValue,
      version: dto.version || 1,
      deletedAt: null as Date | null,
    };
    return this._db.model.brandProfile.upsert({
      where: { penNameId },
      create: data,
      update: data,
    });
  }

  archiveBrandProfile(organizationId: string, penNameId: string) {
    return this._db.model.brandProfile.updateMany({
      where: { penNameId, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  listSeries(organizationId: string) {
    return this._db.model.series.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        penName: true,
        _count: { select: { books: { where: { deletedAt: null } } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  getSeries(organizationId: string, id: string) {
    return this._db.model.series.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        penName: true,
        books: { where: { deletedAt: null }, orderBy: { title: 'asc' } },
      },
    });
  }

  async createSeries(organizationId: string, dto: SeriesDto) {
    if (!(await this.penNameExists(organizationId, dto.penNameId))) return null;
    return this._db.model.series.create({ data: { organizationId, ...dto } });
  }

  async updateSeries(organizationId: string, id: string, dto: SeriesDto) {
    if (!(await this.penNameExists(organizationId, dto.penNameId))) return null;
    const result = await this._db.model.series.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: dto,
    });
    return result.count ? this.getSeries(organizationId, id) : null;
  }

  archiveSeries(organizationId: string, id: string) {
    return this._db.model.series.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  listBooks(organizationId: string) {
    return this._db.model.book.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        penName: true,
        series: true,
        _count: {
          select: { sources: { where: { deletedAt: null } } },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  getBook(organizationId: string, id: string) {
    return this._db.model.book.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        penName: true,
        series: true,
        sources: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async createBook(organizationId: string, dto: BookDto) {
    if (!(await this.bookParentsExist(organizationId, dto))) return null;
    return this._db.model.book.create({
      data: this.bookData(organizationId, dto),
    });
  }

  async updateBook(organizationId: string, id: string, dto: BookDto) {
    if (!(await this.bookParentsExist(organizationId, dto))) return null;
    const { organizationId: _ignored, ...data } = this.bookData(
      organizationId,
      dto
    );
    const result = await this._db.model.book.updateMany({
      where: { id, organizationId, deletedAt: null },
      data,
    });
    return result.count ? this.getBook(organizationId, id) : null;
  }

  archiveBook(organizationId: string, id: string) {
    return this._db.model.book.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { status: 'ARCHIVED', deletedAt: new Date() },
    });
  }

  listBookSources(organizationId: string, bookId: string) {
    return this._db.model.bookSource.findMany({
      where: { organizationId, bookId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  getBookSource(organizationId: string, bookId: string, id: string) {
    return this._db.model.bookSource.findFirst({
      where: { id, organizationId, bookId, deletedAt: null },
    });
  }

  async createBookSource(
    organizationId: string,
    bookId: string,
    dto: BookSourceDto
  ) {
    if (!(await this.bookExists(organizationId, bookId))) return null;
    return this._db.model.bookSource.create({
      data: { organizationId, bookId, ...dto },
    });
  }

  async updateBookSource(
    organizationId: string,
    bookId: string,
    id: string,
    dto: BookSourceDto
  ) {
    if (!(await this.bookExists(organizationId, bookId))) return null;
    const result = await this._db.model.bookSource.updateMany({
      where: { id, organizationId, bookId, deletedAt: null },
      data: dto,
    });
    return result.count ? this.getBookSource(organizationId, bookId, id) : null;
  }

  archiveBookSource(organizationId: string, bookId: string, id: string) {
    return this._db.model.bookSource.updateMany({
      where: { id, organizationId, bookId, deletedAt: null },
      data: { status: 'ARCHIVED', deletedAt: new Date() },
    });
  }

  listContentPillars(organizationId: string) {
    return this._db.model.contentPillar.findMany({
      where: { organizationId, deletedAt: null },
      include: { penName: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  getContentPillar(organizationId: string, id: string) {
    return this._db.model.contentPillar.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { penName: true },
    });
  }

  async createContentPillar(organizationId: string, dto: ContentPillarDto) {
    if (!(await this.penNameExists(organizationId, dto.penNameId))) return null;
    return this._db.model.contentPillar.create({
      data: {
        ...dto,
        organizationId,
        examples: dto.examples as Prisma.InputJsonValue,
      },
    });
  }

  async updateContentPillar(
    organizationId: string,
    id: string,
    dto: ContentPillarDto
  ) {
    if (!(await this.penNameExists(organizationId, dto.penNameId))) return null;
    const result = await this._db.model.contentPillar.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { ...dto, examples: dto.examples as Prisma.InputJsonValue },
    });
    return result.count ? this.getContentPillar(organizationId, id) : null;
  }

  archiveContentPillar(organizationId: string, id: string) {
    return this._db.model.contentPillar.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { active: false, deletedAt: new Date() },
    });
  }

  listAudienceAngles(organizationId: string) {
    return this._db.model.audienceAngle.findMany({
      where: { organizationId, deletedAt: null },
      include: { penName: true },
      orderBy: { name: 'asc' },
    });
  }

  getAudienceAngle(organizationId: string, id: string) {
    return this._db.model.audienceAngle.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { penName: true },
    });
  }

  async createAudienceAngle(organizationId: string, dto: AudienceAngleDto) {
    if (!(await this.penNameExists(organizationId, dto.penNameId))) return null;
    return this._db.model.audienceAngle.create({
      data: {
        ...dto,
        organizationId,
        objections: dto.objections as Prisma.InputJsonValue,
        platformNotes: dto.platformNotes as Prisma.InputJsonValue,
      },
    });
  }

  async updateAudienceAngle(
    organizationId: string,
    id: string,
    dto: AudienceAngleDto
  ) {
    if (!(await this.penNameExists(organizationId, dto.penNameId))) return null;
    const result = await this._db.model.audienceAngle.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: {
        ...dto,
        objections: dto.objections as Prisma.InputJsonValue,
        platformNotes: dto.platformNotes as Prisma.InputJsonValue,
      },
    });
    return result.count ? this.getAudienceAngle(organizationId, id) : null;
  }

  archiveAudienceAngle(organizationId: string, id: string) {
    return this._db.model.audienceAngle.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { active: false, deletedAt: new Date() },
    });
  }

  private penNameExists(organizationId: string, id: string) {
    return this._db.model.penName
      .findFirst({
        where: { id, organizationId, deletedAt: null },
        select: { id: true },
      })
      .then(Boolean);
  }

  private bookExists(organizationId: string, id: string) {
    return this._db.model.book
      .findFirst({
        where: { id, organizationId, deletedAt: null },
        select: { id: true },
      })
      .then(Boolean);
  }

  private async bookParentsExist(organizationId: string, dto: BookDto) {
    if (!(await this.penNameExists(organizationId, dto.penNameId)))
      return false;
    if (!dto.seriesId) return true;
    return this._db.model.series
      .findFirst({
        where: {
          id: dto.seriesId,
          organizationId,
          penNameId: dto.penNameId,
          deletedAt: null,
        },
        select: { id: true },
      })
      .then(Boolean);
  }

  private bookData(organizationId: string, dto: BookDto) {
    return {
      organizationId,
      ...dto,
      seriesId: dto.seriesId || null,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : null,
      tropes: dto.tropes as Prisma.InputJsonValue,
      themes: dto.themes as Prisma.InputJsonValue,
      hooks: dto.hooks as Prisma.InputJsonValue,
      characters: dto.characters as Prisma.InputJsonValue,
      audience: dto.audience as Prisma.InputJsonValue,
      tone: dto.tone as Prisma.InputJsonValue,
      contentWarnings: dto.contentWarnings as Prisma.InputJsonValue,
    };
  }
}
