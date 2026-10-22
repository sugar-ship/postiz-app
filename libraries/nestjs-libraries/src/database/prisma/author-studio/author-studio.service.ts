import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthorStudioRepository } from './author-studio.repository';
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

@Injectable()
export class AuthorStudioService {
  constructor(private readonly repository: AuthorStudioRepository) {}

  listPenNames(orgId: string) {
    return this.repository.listPenNames(orgId);
  }
  async getPenName(orgId: string, id: string) {
    return this.required(
      await this.repository.getPenName(orgId, id),
      'Pen name'
    );
  }
  createPenName(orgId: string, dto: PenNameDto) {
    return this.repository.createPenName(orgId, dto);
  }
  async updatePenName(orgId: string, id: string, dto: PenNameDto) {
    return this.required(
      await this.repository.updatePenName(orgId, id, dto),
      'Pen name'
    );
  }
  async archivePenName(orgId: string, id: string) {
    this.updated(await this.repository.archivePenName(orgId, id), 'Pen name');
    return { id };
  }
  async upsertBrandProfile(
    orgId: string,
    penNameId: string,
    dto: BrandProfileDto
  ) {
    return this.required(
      await this.repository.upsertBrandProfile(orgId, penNameId, dto),
      'Pen name'
    );
  }
  async archiveBrandProfile(orgId: string, penNameId: string) {
    this.updated(
      await this.repository.archiveBrandProfile(orgId, penNameId),
      'Brand profile'
    );
    return { penNameId };
  }

  listSeries(orgId: string) {
    return this.repository.listSeries(orgId);
  }
  async getSeries(orgId: string, id: string) {
    return this.required(await this.repository.getSeries(orgId, id), 'Series');
  }
  async createSeries(orgId: string, dto: SeriesDto) {
    return this.required(
      await this.repository.createSeries(orgId, dto),
      'Pen name'
    );
  }
  async updateSeries(orgId: string, id: string, dto: SeriesDto) {
    return this.required(
      await this.repository.updateSeries(orgId, id, dto),
      'Series'
    );
  }
  async archiveSeries(orgId: string, id: string) {
    this.updated(await this.repository.archiveSeries(orgId, id), 'Series');
    return { id };
  }

  listBooks(orgId: string) {
    return this.repository.listBooks(orgId);
  }
  async getBook(orgId: string, id: string) {
    return this.required(await this.repository.getBook(orgId, id), 'Book');
  }
  async createBook(orgId: string, dto: BookDto) {
    return this.required(
      await this.repository.createBook(orgId, dto),
      'Pen name or series'
    );
  }
  async updateBook(orgId: string, id: string, dto: BookDto) {
    return this.required(
      await this.repository.updateBook(orgId, id, dto),
      'Book'
    );
  }
  async archiveBook(orgId: string, id: string) {
    this.updated(await this.repository.archiveBook(orgId, id), 'Book');
    return { id };
  }

  async listBookSources(orgId: string, bookId: string) {
    await this.getBook(orgId, bookId);
    return this.repository.listBookSources(orgId, bookId);
  }
  async getBookSource(orgId: string, bookId: string, id: string) {
    return this.required(
      await this.repository.getBookSource(orgId, bookId, id),
      'Book source'
    );
  }
  async createBookSource(orgId: string, bookId: string, dto: BookSourceDto) {
    return this.required(
      await this.repository.createBookSource(orgId, bookId, dto),
      'Book'
    );
  }
  async updateBookSource(
    orgId: string,
    bookId: string,
    id: string,
    dto: BookSourceDto
  ) {
    return this.required(
      await this.repository.updateBookSource(orgId, bookId, id, dto),
      'Book source'
    );
  }
  async archiveBookSource(orgId: string, bookId: string, id: string) {
    this.updated(
      await this.repository.archiveBookSource(orgId, bookId, id),
      'Book source'
    );
    return { id };
  }

  listContentPillars(orgId: string) {
    return this.repository.listContentPillars(orgId);
  }
  async getContentPillar(orgId: string, id: string) {
    return this.required(
      await this.repository.getContentPillar(orgId, id),
      'Content pillar'
    );
  }
  async createContentPillar(orgId: string, dto: ContentPillarDto) {
    return this.required(
      await this.repository.createContentPillar(orgId, dto),
      'Pen name'
    );
  }
  async updateContentPillar(orgId: string, id: string, dto: ContentPillarDto) {
    return this.required(
      await this.repository.updateContentPillar(orgId, id, dto),
      'Content pillar'
    );
  }
  async archiveContentPillar(orgId: string, id: string) {
    this.updated(
      await this.repository.archiveContentPillar(orgId, id),
      'Content pillar'
    );
    return { id };
  }

  listAudienceAngles(orgId: string) {
    return this.repository.listAudienceAngles(orgId);
  }
  async getAudienceAngle(orgId: string, id: string) {
    return this.required(
      await this.repository.getAudienceAngle(orgId, id),
      'Audience angle'
    );
  }
  async createAudienceAngle(orgId: string, dto: AudienceAngleDto) {
    return this.required(
      await this.repository.createAudienceAngle(orgId, dto),
      'Pen name'
    );
  }
  async updateAudienceAngle(orgId: string, id: string, dto: AudienceAngleDto) {
    return this.required(
      await this.repository.updateAudienceAngle(orgId, id, dto),
      'Audience angle'
    );
  }
  async archiveAudienceAngle(orgId: string, id: string) {
    this.updated(
      await this.repository.archiveAudienceAngle(orgId, id),
      'Audience angle'
    );
    return { id };
  }

  private required<T>(value: T | null, resource: string): T {
    if (!value) throw new NotFoundException(`${resource} not found`);
    return value;
  }

  private updated(value: { count: number }, resource: string) {
    if (!value.count) throw new NotFoundException(`${resource} not found`);
  }
}
