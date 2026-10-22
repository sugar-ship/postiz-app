import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CampaignService } from './campaign.service';

const campaignDto = {
  penNameId: 'pen-1',
  name: 'Launch',
  type: 'LAUNCH' as const,
  objective: 'Preorders',
  brief: 'A focused launch campaign.',
  status: 'DRAFT' as const,
  targetPlatforms: ['instagram'],
  generationSettings: {},
  contentPillarIds: [] as string[],
  audienceAngleIds: [] as string[],
};

describe('CampaignService CRUD and state transitions', () => {
  const repository = {
    listCampaigns: jest.fn(),
    getCampaign: jest.fn(),
    createCampaign: jest.fn(),
    updateCampaign: jest.fn(),
    archiveCampaign: jest.fn(),
    createIdea: jest.fn(),
    getIdea: jest.fn(),
    updateIdea: jest.fn(),
    archiveIdea: jest.fn(),
    createVariant: jest.fn(),
    getVariant: jest.fn(),
    updateVariant: jest.fn(),
    decideVariant: jest.fn(),
    archiveVariant: jest.fn(),
  };
  const service = new CampaignService(repository as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates campaigns as drafts within the authenticated organization', async () => {
    repository.createCampaign.mockResolvedValue({ id: 'campaign-1' });
    await service.createCampaign('org-a', campaignDto);
    expect(repository.createCampaign).toHaveBeenCalledWith(
      'org-a',
      campaignDto
    );
    await expect(
      service.createCampaign('org-a', { ...campaignDto, status: 'ACTIVE' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects reversed campaign dates', async () => {
    await expect(
      service.createCampaign('org-a', {
        ...campaignDto,
        startDate: '2026-12-10',
        endDate: '2026-12-01',
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createCampaign).not.toHaveBeenCalled();
  });

  it('allows documented campaign transitions and rejects invalid jumps', async () => {
    repository.getCampaign.mockResolvedValue({
      id: 'campaign-1',
      status: 'DRAFT',
    });
    repository.updateCampaign.mockResolvedValue({ id: 'campaign-1' });
    await expect(
      service.updateCampaign('org-a', 'campaign-1', {
        ...campaignDto,
        status: 'REVIEW',
      })
    ).resolves.toEqual({ id: 'campaign-1' });
    await expect(
      service.updateCampaign('org-a', 'campaign-1', {
        ...campaignDto,
        status: 'COMPLETE',
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('supports manual idea and variant CRUD with organization scope', async () => {
    const idea = { id: 'idea-1' };
    const variant = { id: 'variant-1' };
    const ideaDto = {
      title: 'Hook',
      coreConcept: 'Concept',
      hook: 'Question?',
      sourceRationale: {},
      status: 'SHORTLISTED' as const,
    };
    const variantDto = {
      platform: 'instagram',
      format: 'TEXT' as const,
      content: 'Copy',
      hashtags: [] as string[],
      mediaBrief: {},
      platformSettings: {},
    };
    repository.createIdea.mockResolvedValue(idea);
    repository.createVariant.mockResolvedValue(variant);
    await service.createIdea('org-a', 'campaign-1', ideaDto);
    await service.createVariant('org-a', 'idea-1', variantDto);
    expect(repository.createIdea).toHaveBeenCalledWith(
      'org-a',
      'campaign-1',
      ideaDto
    );
    expect(repository.createVariant).toHaveBeenCalledWith(
      'org-a',
      'idea-1',
      variantDto
    );
  });

  it('does not allow manual ideas to impersonate generated ideas', async () => {
    await expect(
      service.createIdea('org-a', 'campaign-1', {
        title: 'Hook',
        coreConcept: 'Concept',
        hook: 'Question?',
        sourceRationale: {},
        status: 'GENERATED',
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createIdea).not.toHaveBeenCalled();
  });

  it('moves editable variants through approve and reject states', async () => {
    repository.getVariant.mockResolvedValue({
      id: 'variant-1',
      status: 'EDITED',
    });
    repository.decideVariant.mockResolvedValue({
      id: 'variant-1',
      status: 'APPROVED',
    });
    await expect(
      service.decideVariant('org-a', 'variant-1', 'APPROVED')
    ).resolves.toEqual({ id: 'variant-1', status: 'APPROVED' });
    expect(repository.decideVariant).toHaveBeenCalledWith(
      'org-a',
      'variant-1',
      'APPROVED'
    );
  });

  it('protects post-handoff variants and hides foreign records as 404', async () => {
    repository.getVariant.mockResolvedValueOnce({
      id: 'variant-1',
      status: 'SCHEDULED',
    });
    await expect(
      service.updateVariant('org-a', 'variant-1', {
        platform: 'instagram',
        format: 'TEXT',
        content: 'Changed',
        hashtags: [],
        mediaBrief: {},
        platformSettings: {},
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    repository.getVariant.mockResolvedValueOnce(null);
    await expect(
      service.getVariant('org-a', 'foreign-variant')
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
