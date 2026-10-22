import { CampaignRepository } from './campaign.repository';

const model = {
  campaign: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  campaignContentPillar: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  campaignAudienceAngle: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  campaignIdea: {
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  campaignVariant: {
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  penName: { findFirst: jest.fn() },
  book: { findFirst: jest.fn() },
  series: { findFirst: jest.fn() },
  contentPillar: { findMany: jest.fn() },
  audienceAngle: { findMany: jest.fn() },
};

const transaction = { model: { $transaction: jest.fn() } };

const campaignDto = {
  penNameId: 'pen-1',
  name: 'Launch',
  type: 'LAUNCH' as const,
  objective: 'Preorders',
  brief: 'A focused launch campaign.',
  status: 'DRAFT' as const,
  targetPlatforms: ['instagram'],
  generationSettings: {},
  contentPillarIds: ['pillar-1'],
  audienceAngleIds: ['angle-1'],
};

describe('CampaignRepository organization scoping', () => {
  const repository = new CampaignRepository(
    { model } as never,
    transaction as never
  );

  beforeEach(() => {
    jest.clearAllMocks();
    model.penName.findFirst.mockResolvedValue({ id: 'pen-1' });
    model.contentPillar.findMany.mockResolvedValue([{ id: 'pillar-1' }]);
    model.audienceAngle.findMany.mockResolvedValue([{ id: 'angle-1' }]);
  });

  it('scopes campaign lists to the authenticated organization', async () => {
    model.campaign.findMany.mockResolvedValue([]);
    await repository.listCampaigns('org-a');
    expect(model.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-a', deletedAt: null },
      })
    );
  });

  it('rejects taxonomy records belonging to another organization', async () => {
    model.contentPillar.findMany.mockResolvedValue([]);
    await expect(repository.createCampaign('org-a', campaignDto)).resolves.toBe(
      null
    );
    expect(model.contentPillar.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-a' }),
      })
    );
    expect(model.campaign.create).not.toHaveBeenCalled();
  });

  it('scopes campaign updates and join replacement to the organization', async () => {
    model.campaign.findFirst
      .mockResolvedValueOnce({ id: 'campaign-1' })
      .mockResolvedValueOnce({ id: 'campaign-1' });
    model.campaign.update.mockReturnValue({ operation: 'campaign-update' });
    model.campaignContentPillar.deleteMany.mockReturnValue({
      operation: 'pillar-delete',
    });
    model.campaignAudienceAngle.deleteMany.mockReturnValue({
      operation: 'angle-delete',
    });
    model.campaignContentPillar.createMany.mockReturnValue({
      operation: 'pillar-create',
    });
    model.campaignAudienceAngle.createMany.mockReturnValue({
      operation: 'angle-create',
    });
    transaction.model.$transaction.mockResolvedValue([]);

    await repository.updateCampaign('org-a', 'campaign-1', campaignDto);

    expect(model.campaign.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        id: 'campaign-1',
        organizationId: 'org-a',
        deletedAt: null,
      },
      select: { id: true },
    });
    expect(model.campaignContentPillar.deleteMany).toHaveBeenCalledWith({
      where: { campaignId: 'campaign-1', organizationId: 'org-a' },
    });
    expect(model.campaignAudienceAngle.createMany).toHaveBeenCalledWith({
      data: [
        {
          organizationId: 'org-a',
          campaignId: 'campaign-1',
          audienceAngleId: 'angle-1',
        },
      ],
    });
  });

  it('verifies idea ownership before creating a nested variant', async () => {
    model.campaignIdea.findFirst.mockResolvedValue(null);
    const result = await repository.createVariant('org-a', 'foreign-idea', {
      platform: 'instagram',
      format: 'TEXT',
      content: 'Copy',
      hashtags: [],
      mediaBrief: {},
      platformSettings: {},
    });
    expect(result).toBeNull();
    expect(model.campaignIdea.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'foreign-idea',
        organizationId: 'org-a',
        deletedAt: null,
        campaign: { deletedAt: null },
      },
      select: { id: true },
    });
    expect(model.campaignVariant.create).not.toHaveBeenCalled();
  });

  it('preserves generation provenance when a manual edit is saved', async () => {
    model.campaignVariant.updateMany.mockResolvedValue({ count: 0 });
    await repository.updateVariant('org-a', 'variant-1', {
      platform: 'instagram',
      format: 'TEXT',
      content: 'Edited copy',
      hashtags: [],
      mediaBrief: {},
      platformSettings: {},
    });
    const data = model.campaignVariant.updateMany.mock.calls[0][0].data;
    expect(data).not.toHaveProperty('generationMetadata');
    expect(data).not.toHaveProperty('model');
    expect(data).not.toHaveProperty('promptVersion');
    expect(data.status).toBe('EDITED');
  });
});
