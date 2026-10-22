import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignStatus, CampaignVariantStatus } from '@prisma/client';
import { CampaignRepository } from './campaign.repository';
import {
  CampaignDto,
  CampaignIdeaDto,
  CampaignVariantDto,
} from '@gitroom/nestjs-libraries/dtos/author-studio/campaign.dto';

type ManualVariantDecision = 'APPROVED' | 'REJECTED';

const campaignTransitions: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ['REVIEW', 'ACTIVE', 'ARCHIVED'],
  GENERATING: ['DRAFT', 'REVIEW', 'ARCHIVED'],
  REVIEW: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
  ACTIVE: ['REVIEW', 'COMPLETE', 'ARCHIVED'],
  COMPLETE: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [],
};

const variantTransitions: Record<
  ManualVariantDecision,
  CampaignVariantStatus[]
> = {
  APPROVED: ['GENERATED', 'EDITED', 'REJECTED'],
  REJECTED: ['GENERATED', 'EDITED', 'APPROVED'],
};

@Injectable()
export class CampaignService {
  constructor(private readonly repository: CampaignRepository) {}

  listCampaigns(orgId: string) {
    return this.repository.listCampaigns(orgId);
  }

  async getCampaign(orgId: string, id: string) {
    return this.required(
      await this.repository.getCampaign(orgId, id),
      'Campaign'
    );
  }

  async createCampaign(orgId: string, dto: CampaignDto) {
    if (dto.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('New campaigns must start as drafts');
    }
    this.validateDates(dto);
    return this.required(
      await this.repository.createCampaign(orgId, dto),
      'Campaign relationship'
    );
  }

  async updateCampaign(orgId: string, id: string, dto: CampaignDto) {
    this.validateDates(dto);
    if (dto.status === CampaignStatus.ARCHIVED) {
      throw new BadRequestException(
        'Use the archive action to archive campaigns'
      );
    }
    const current = await this.getCampaign(orgId, id);
    this.validateCampaignTransition(current.status, dto.status);
    return this.required(
      await this.repository.updateCampaign(orgId, id, dto),
      'Campaign'
    );
  }

  async archiveCampaign(orgId: string, id: string) {
    this.updated(await this.repository.archiveCampaign(orgId, id), 'Campaign');
    return { id };
  }

  async createIdea(orgId: string, campaignId: string, dto: CampaignIdeaDto) {
    this.validateManualIdeaStatus(dto);
    return this.required(
      await this.repository.createIdea(orgId, campaignId, dto),
      'Campaign'
    );
  }

  async getIdea(orgId: string, id: string) {
    return this.required(await this.repository.getIdea(orgId, id), 'Idea');
  }

  async updateIdea(orgId: string, id: string, dto: CampaignIdeaDto) {
    this.validateManualIdeaStatus(dto);
    return this.required(
      await this.repository.updateIdea(orgId, id, dto),
      'Idea'
    );
  }

  async archiveIdea(orgId: string, id: string) {
    this.updated(await this.repository.archiveIdea(orgId, id), 'Idea');
    return { id };
  }

  async createVariant(
    orgId: string,
    campaignIdeaId: string,
    dto: CampaignVariantDto
  ) {
    return this.required(
      await this.repository.createVariant(orgId, campaignIdeaId, dto),
      'Campaign idea'
    );
  }

  async getVariant(orgId: string, id: string) {
    return this.required(
      await this.repository.getVariant(orgId, id),
      'Campaign variant'
    );
  }

  async updateVariant(orgId: string, id: string, dto: CampaignVariantDto) {
    const current = await this.getVariant(orgId, id);
    if (
      current.status === CampaignVariantStatus.SENT_TO_COMPOSER ||
      current.status === CampaignVariantStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        'Variants already handed to Postiz cannot be edited here'
      );
    }
    return this.required(
      await this.repository.updateVariant(orgId, id, dto),
      'Campaign variant'
    );
  }

  async decideVariant(
    orgId: string,
    id: string,
    decision: ManualVariantDecision
  ) {
    const current = await this.getVariant(orgId, id);
    if (!variantTransitions[decision].includes(current.status)) {
      throw new BadRequestException(
        `Cannot move a ${current.status} variant to ${decision}`
      );
    }
    return this.required(
      await this.repository.decideVariant(orgId, id, decision),
      'Campaign variant'
    );
  }

  async archiveVariant(orgId: string, id: string) {
    this.updated(
      await this.repository.archiveVariant(orgId, id),
      'Campaign variant'
    );
    return { id };
  }

  private validateDates(dto: CampaignDto) {
    if (
      dto.startDate &&
      dto.endDate &&
      new Date(dto.endDate) < new Date(dto.startDate)
    ) {
      throw new BadRequestException('Campaign end date must follow start date');
    }
  }

  private validateManualIdeaStatus(dto: CampaignIdeaDto) {
    if (dto.status === 'ARCHIVED') {
      throw new BadRequestException('Use the archive action to archive ideas');
    }
    if (dto.status === 'GENERATED') {
      throw new BadRequestException(
        'Manual ideas cannot be marked as AI-generated'
      );
    }
  }

  private validateCampaignTransition(
    current: CampaignStatus,
    requested: CampaignStatus
  ) {
    if (current === requested) return;
    if (!campaignTransitions[current].includes(requested)) {
      throw new BadRequestException(
        `Cannot move a ${current} campaign to ${requested}`
      );
    }
  }

  private required<T>(value: T | null, resource: string): T {
    if (!value) throw new NotFoundException(`${resource} not found`);
    return value;
  }

  private updated(value: { count: number }, resource: string) {
    if (!value.count) throw new NotFoundException(`${resource} not found`);
  }
}
