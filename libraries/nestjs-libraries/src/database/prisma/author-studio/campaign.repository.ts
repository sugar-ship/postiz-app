import { Injectable } from '@nestjs/common';
import { CampaignStatus, CampaignVariantStatus, Prisma } from '@prisma/client';
import {
  PrismaRepository,
  PrismaTransaction,
} from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import {
  CampaignDto,
  CampaignIdeaDto,
  CampaignVariantDto,
} from '@gitroom/nestjs-libraries/dtos/author-studio/campaign.dto';

type CampaignModels =
  | 'campaign'
  | 'campaignContentPillar'
  | 'campaignAudienceAngle'
  | 'campaignIdea'
  | 'campaignVariant'
  | 'penName'
  | 'book'
  | 'series'
  | 'contentPillar'
  | 'audienceAngle';

const campaignInclude = {
  penName: true,
  book: true,
  series: true,
  contentPillars: {
    where: { contentPillar: { deletedAt: null as null } },
    include: { contentPillar: true },
    orderBy: { contentPillar: { name: 'asc' as const } },
  },
  audienceAngles: {
    where: { audienceAngle: { deletedAt: null as null } },
    include: { audienceAngle: true },
    orderBy: { audienceAngle: { name: 'asc' as const } },
  },
  ideas: {
    where: { deletedAt: null as null },
    include: {
      variants: {
        where: { deletedAt: null as null },
        orderBy: { createdAt: 'asc' as const },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.CampaignInclude;

@Injectable()
export class CampaignRepository {
  constructor(
    private readonly _db: PrismaRepository<CampaignModels>,
    private readonly _transaction: PrismaTransaction
  ) {}

  listCampaigns(organizationId: string) {
    return this._db.model.campaign.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        penName: true,
        book: true,
        series: true,
        _count: {
          select: { ideas: { where: { deletedAt: null } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  getCampaign(organizationId: string, id: string) {
    return this._db.model.campaign.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: campaignInclude,
    });
  }

  async createCampaign(organizationId: string, dto: CampaignDto) {
    if (!(await this.campaignParentsExist(organizationId, dto))) return null;
    return this._db.model.campaign.create({
      data: {
        ...this.campaignData(organizationId, dto),
        contentPillars: {
          create: dto.contentPillarIds.map((contentPillarId) => ({
            organizationId,
            contentPillarId,
          })),
        },
        audienceAngles: {
          create: dto.audienceAngleIds.map((audienceAngleId) => ({
            organizationId,
            audienceAngleId,
          })),
        },
      },
      include: campaignInclude,
    });
  }

  async updateCampaign(organizationId: string, id: string, dto: CampaignDto) {
    if (!(await this.campaignParentsExist(organizationId, dto))) return null;
    const existing = await this._db.model.campaign.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;
    const { organizationId: _ignored, ...data } = this.campaignData(
      organizationId,
      dto
    );
    await this._transaction.model.$transaction([
      this._db.model.campaign.update({ where: { id }, data }),
      this._db.model.campaignContentPillar.deleteMany({
        where: { campaignId: id, organizationId },
      }),
      this._db.model.campaignAudienceAngle.deleteMany({
        where: { campaignId: id, organizationId },
      }),
      this._db.model.campaignContentPillar.createMany({
        data: dto.contentPillarIds.map((contentPillarId) => ({
          organizationId,
          campaignId: id,
          contentPillarId,
        })),
      }),
      this._db.model.campaignAudienceAngle.createMany({
        data: dto.audienceAngleIds.map((audienceAngleId) => ({
          organizationId,
          campaignId: id,
          audienceAngleId,
        })),
      }),
    ]);
    return this.getCampaign(organizationId, id);
  }

  archiveCampaign(organizationId: string, id: string) {
    return this._db.model.campaign.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { status: CampaignStatus.ARCHIVED, deletedAt: new Date() },
    });
  }

  createIdea(organizationId: string, campaignId: string, dto: CampaignIdeaDto) {
    return this.campaignExists(organizationId, campaignId).then((exists) =>
      exists
        ? this._db.model.campaignIdea.create({
            data: {
              organizationId,
              campaignId,
              ...dto,
              sourceRationale: dto.sourceRationale as Prisma.InputJsonValue,
            },
            include: { variants: true },
          })
        : null
    );
  }

  getIdea(organizationId: string, id: string) {
    return this._db.model.campaignIdea.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
        campaign: { deletedAt: null },
      },
      include: {
        variants: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updateIdea(organizationId: string, id: string, dto: CampaignIdeaDto) {
    const result = await this._db.model.campaignIdea.updateMany({
      where: {
        id,
        organizationId,
        deletedAt: null,
        campaign: { deletedAt: null },
      },
      data: {
        ...dto,
        sourceRationale: dto.sourceRationale as Prisma.InputJsonValue,
      },
    });
    return result.count ? this.getIdea(organizationId, id) : null;
  }

  archiveIdea(organizationId: string, id: string) {
    return this._db.model.campaignIdea.updateMany({
      where: {
        id,
        organizationId,
        deletedAt: null,
        campaign: { deletedAt: null },
      },
      data: { status: 'ARCHIVED', deletedAt: new Date() },
    });
  }

  async createVariant(
    organizationId: string,
    campaignIdeaId: string,
    dto: CampaignVariantDto
  ) {
    if (!(await this.ideaExists(organizationId, campaignIdeaId))) return null;
    return this._db.model.campaignVariant.create({
      data: this.variantData(organizationId, campaignIdeaId, dto),
    });
  }

  getVariant(organizationId: string, id: string) {
    return this._db.model.campaignVariant.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
        campaignIdea: { deletedAt: null, campaign: { deletedAt: null } },
      },
    });
  }

  async updateVariant(
    organizationId: string,
    id: string,
    dto: CampaignVariantDto
  ) {
    const result = await this._db.model.campaignVariant.updateMany({
      where: {
        id,
        organizationId,
        deletedAt: null,
        campaignIdea: { deletedAt: null, campaign: { deletedAt: null } },
      },
      data: {
        ...this.variantFields(dto),
        status: CampaignVariantStatus.EDITED,
      },
    });
    return result.count ? this.getVariant(organizationId, id) : null;
  }

  async decideVariant(
    organizationId: string,
    id: string,
    status: 'APPROVED' | 'REJECTED'
  ) {
    const result = await this._db.model.campaignVariant.updateMany({
      where: {
        id,
        organizationId,
        deletedAt: null,
        campaignIdea: { deletedAt: null, campaign: { deletedAt: null } },
      },
      data: { status },
    });
    return result.count ? this.getVariant(organizationId, id) : null;
  }

  archiveVariant(organizationId: string, id: string) {
    return this._db.model.campaignVariant.updateMany({
      where: {
        id,
        organizationId,
        deletedAt: null,
        campaignIdea: { deletedAt: null, campaign: { deletedAt: null } },
      },
      data: { deletedAt: new Date() },
    });
  }

  private campaignExists(organizationId: string, id: string) {
    return this._db.model.campaign
      .findFirst({
        where: {
          id,
          organizationId,
          deletedAt: null,
        },
        select: { id: true },
      })
      .then(Boolean);
  }

  private ideaExists(organizationId: string, id: string) {
    return this._db.model.campaignIdea
      .findFirst({
        where: {
          id,
          organizationId,
          deletedAt: null,
          campaign: { deletedAt: null },
        },
        select: { id: true },
      })
      .then(Boolean);
  }

  private async campaignParentsExist(organizationId: string, dto: CampaignDto) {
    const penName = await this._db.model.penName.findFirst({
      where: { id: dto.penNameId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!penName) return false;
    if (dto.bookId) {
      const book = await this._db.model.book.findFirst({
        where: {
          id: dto.bookId,
          penNameId: dto.penNameId,
          organizationId,
          deletedAt: null,
        },
        select: { id: true, seriesId: true },
      });
      if (!book || (dto.seriesId && book.seriesId !== dto.seriesId))
        return false;
    }
    if (dto.seriesId) {
      const series = await this._db.model.series.findFirst({
        where: {
          id: dto.seriesId,
          penNameId: dto.penNameId,
          organizationId,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!series) return false;
    }
    const [pillars, angles] = await Promise.all([
      this._db.model.contentPillar.findMany({
        where: {
          id: { in: dto.contentPillarIds },
          penNameId: dto.penNameId,
          organizationId,
          deletedAt: null,
          active: true,
        },
        select: { id: true },
      }),
      this._db.model.audienceAngle.findMany({
        where: {
          id: { in: dto.audienceAngleIds },
          penNameId: dto.penNameId,
          organizationId,
          deletedAt: null,
          active: true,
        },
        select: { id: true },
      }),
    ]);
    return (
      pillars.length === dto.contentPillarIds.length &&
      angles.length === dto.audienceAngleIds.length
    );
  }

  private campaignData(organizationId: string, dto: CampaignDto) {
    const {
      contentPillarIds: _pillarIds,
      audienceAngleIds: _angleIds,
      ...fields
    } = dto;
    return {
      organizationId,
      ...fields,
      bookId: dto.bookId || null,
      seriesId: dto.seriesId || null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      targetPlatforms: dto.targetPlatforms as Prisma.InputJsonValue,
      generationSettings: dto.generationSettings as Prisma.InputJsonValue,
    };
  }

  private variantData(
    organizationId: string,
    campaignIdeaId: string,
    dto: CampaignVariantDto
  ) {
    return {
      organizationId,
      campaignIdeaId,
      ...this.variantFields(dto),
      generationMetadata: {} as Prisma.InputJsonValue,
      status: CampaignVariantStatus.EDITED,
    };
  }

  private variantFields(dto: CampaignVariantDto) {
    return {
      ...dto,
      hashtags: dto.hashtags as Prisma.InputJsonValue,
      mediaBrief: dto.mediaBrief as Prisma.InputJsonValue,
      platformSettings: dto.platformSettings as Prisma.InputJsonValue,
    };
  }
}
