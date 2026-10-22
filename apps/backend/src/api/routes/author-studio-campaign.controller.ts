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
import { AuthorStudioEnabledGuard } from '@gitroom/nestjs-libraries/author-studio/author-studio-enabled.guard';
import { CampaignService } from '@gitroom/nestjs-libraries/database/prisma/author-studio/campaign.service';
import {
  CampaignDto,
  CampaignIdeaDto,
  CampaignVariantDto,
} from '@gitroom/nestjs-libraries/dtos/author-studio/campaign.dto';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';

@ApiTags('Author Studio Campaigns')
@UseGuards(AuthorStudioEnabledGuard)
@Controller('/author-studio')
export class AuthorStudioCampaignController {
  constructor(private readonly campaigns: CampaignService) {}

  @Get('/campaigns')
  listCampaigns(@GetOrgFromRequest() org: Organization) {
    return this.campaigns.listCampaigns(org.id);
  }

  @Post('/campaigns')
  createCampaign(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CampaignDto
  ) {
    return this.campaigns.createCampaign(org.id, body);
  }

  @Get('/campaigns/:id')
  getCampaign(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this.campaigns.getCampaign(org.id, id);
  }

  @Put('/campaigns/:id')
  updateCampaign(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: CampaignDto
  ) {
    return this.campaigns.updateCampaign(org.id, id, body);
  }

  @Delete('/campaigns/:id')
  archiveCampaign(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.campaigns.archiveCampaign(org.id, id);
  }

  @Post('/campaigns/:campaignId/ideas')
  createIdea(
    @GetOrgFromRequest() org: Organization,
    @Param('campaignId') campaignId: string,
    @Body() body: CampaignIdeaDto
  ) {
    return this.campaigns.createIdea(org.id, campaignId, body);
  }

  @Get('/campaign-ideas/:id')
  getIdea(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this.campaigns.getIdea(org.id, id);
  }

  @Put('/campaign-ideas/:id')
  updateIdea(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: CampaignIdeaDto
  ) {
    return this.campaigns.updateIdea(org.id, id, body);
  }

  @Delete('/campaign-ideas/:id')
  archiveIdea(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this.campaigns.archiveIdea(org.id, id);
  }

  @Post('/campaign-ideas/:ideaId/variants')
  createVariant(
    @GetOrgFromRequest() org: Organization,
    @Param('ideaId') ideaId: string,
    @Body() body: CampaignVariantDto
  ) {
    return this.campaigns.createVariant(org.id, ideaId, body);
  }

  @Get('/campaign-variants/:id')
  getVariant(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this.campaigns.getVariant(org.id, id);
  }

  @Put('/campaign-variants/:id')
  updateVariant(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: CampaignVariantDto
  ) {
    return this.campaigns.updateVariant(org.id, id, body);
  }

  @Post('/campaign-variants/:id/approve')
  approveVariant(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.campaigns.decideVariant(org.id, id, 'APPROVED');
  }

  @Post('/campaign-variants/:id/reject')
  rejectVariant(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.campaigns.decideVariant(org.id, id, 'REJECTED');
  }

  @Delete('/campaign-variants/:id')
  archiveVariant(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.campaigns.archiveVariant(org.id, id);
  }
}
