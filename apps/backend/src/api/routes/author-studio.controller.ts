import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Organization } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { AuthorStudioEnabledGuard } from '@gitroom/nestjs-libraries/author-studio/author-studio-enabled.guard';
import { AuthorStudioService } from '@gitroom/nestjs-libraries/database/prisma/author-studio/author-studio.service';
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

@ApiTags('Author Studio')
@UseGuards(AuthorStudioEnabledGuard)
@Controller('/author-studio')
export class AuthorStudioController {
  constructor(private readonly authorStudio: AuthorStudioService) {}

  @Get('/pen-names')
  listPenNames(@GetOrgFromRequest() org: Organization) {
    return this.authorStudio.listPenNames(org.id);
  }

  @Post('/pen-names')
  createPenName(
    @GetOrgFromRequest() org: Organization,
    @Body() body: PenNameDto
  ) {
    return this.authorStudio.createPenName(org.id, body);
  }

  @Get('/pen-names/:id')
  getPenName(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this.authorStudio.getPenName(org.id, id);
  }

  @Put('/pen-names/:id')
  updatePenName(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: PenNameDto
  ) {
    return this.authorStudio.updatePenName(org.id, id, body);
  }

  @Delete('/pen-names/:id')
  archivePenName(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.authorStudio.archivePenName(org.id, id);
  }

  @Put('/pen-names/:id/brand-profile')
  upsertBrandProfile(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: BrandProfileDto
  ) {
    return this.authorStudio.upsertBrandProfile(org.id, id, body);
  }

  @Delete('/pen-names/:id/brand-profile')
  archiveBrandProfile(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.authorStudio.archiveBrandProfile(org.id, id);
  }

  @Get('/series')
  listSeries(@GetOrgFromRequest() org: Organization) {
    return this.authorStudio.listSeries(org.id);
  }

  @Post('/series')
  createSeries(
    @GetOrgFromRequest() org: Organization,
    @Body() body: SeriesDto
  ) {
    return this.authorStudio.createSeries(org.id, body);
  }

  @Get('/series/:id')
  getSeries(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this.authorStudio.getSeries(org.id, id);
  }

  @Put('/series/:id')
  updateSeries(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: SeriesDto
  ) {
    return this.authorStudio.updateSeries(org.id, id, body);
  }

  @Delete('/series/:id')
  archiveSeries(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.authorStudio.archiveSeries(org.id, id);
  }

  @Get('/books/:bookId/sources')
  listBookSources(
    @GetOrgFromRequest() org: Organization,
    @Param('bookId') bookId: string
  ) {
    return this.authorStudio.listBookSources(org.id, bookId);
  }

  @Post('/books/:bookId/sources')
  createBookSource(
    @GetOrgFromRequest() org: Organization,
    @Param('bookId') bookId: string,
    @Body() body: BookSourceDto
  ) {
    return this.authorStudio.createBookSource(org.id, bookId, body);
  }

  @Get('/books/:bookId/sources/:id')
  getBookSource(
    @GetOrgFromRequest() org: Organization,
    @Param('bookId') bookId: string,
    @Param('id') id: string
  ) {
    return this.authorStudio.getBookSource(org.id, bookId, id);
  }

  @Put('/books/:bookId/sources/:id')
  updateBookSource(
    @GetOrgFromRequest() org: Organization,
    @Param('bookId') bookId: string,
    @Param('id') id: string,
    @Body() body: BookSourceDto
  ) {
    return this.authorStudio.updateBookSource(org.id, bookId, id, body);
  }

  @Delete('/books/:bookId/sources/:id')
  archiveBookSource(
    @GetOrgFromRequest() org: Organization,
    @Param('bookId') bookId: string,
    @Param('id') id: string
  ) {
    return this.authorStudio.archiveBookSource(org.id, bookId, id);
  }

  @Get('/books')
  listBooks(@GetOrgFromRequest() org: Organization) {
    return this.authorStudio.listBooks(org.id);
  }

  @Post('/books')
  createBook(@GetOrgFromRequest() org: Organization, @Body() body: BookDto) {
    return this.authorStudio.createBook(org.id, body);
  }

  @Get('/books/:id')
  getBook(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this.authorStudio.getBook(org.id, id);
  }

  @Put('/books/:id')
  updateBook(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: BookDto
  ) {
    return this.authorStudio.updateBook(org.id, id, body);
  }

  @Delete('/books/:id')
  archiveBook(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this.authorStudio.archiveBook(org.id, id);
  }

  @Get('/content-pillars')
  listContentPillars(@GetOrgFromRequest() org: Organization) {
    return this.authorStudio.listContentPillars(org.id);
  }

  @Post('/content-pillars')
  createContentPillar(
    @GetOrgFromRequest() org: Organization,
    @Body() body: ContentPillarDto
  ) {
    return this.authorStudio.createContentPillar(org.id, body);
  }

  @Get('/content-pillars/:id')
  getContentPillar(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.authorStudio.getContentPillar(org.id, id);
  }

  @Put('/content-pillars/:id')
  updateContentPillar(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: ContentPillarDto
  ) {
    return this.authorStudio.updateContentPillar(org.id, id, body);
  }

  @Delete('/content-pillars/:id')
  archiveContentPillar(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.authorStudio.archiveContentPillar(org.id, id);
  }

  @Get('/audience-angles')
  listAudienceAngles(@GetOrgFromRequest() org: Organization) {
    return this.authorStudio.listAudienceAngles(org.id);
  }

  @Post('/audience-angles')
  createAudienceAngle(
    @GetOrgFromRequest() org: Organization,
    @Body() body: AudienceAngleDto
  ) {
    return this.authorStudio.createAudienceAngle(org.id, body);
  }

  @Get('/audience-angles/:id')
  getAudienceAngle(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.authorStudio.getAudienceAngle(org.id, id);
  }

  @Put('/audience-angles/:id')
  updateAudienceAngle(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: AudienceAngleDto
  ) {
    return this.authorStudio.updateAudienceAngle(org.id, id, body);
  }

  @Delete('/audience-angles/:id')
  archiveAudienceAngle(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.authorStudio.archiveAudienceAngle(org.id, id);
  }
}
