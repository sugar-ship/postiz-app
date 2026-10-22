import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CampaignDto,
  CampaignIdeaDto,
  CampaignVariantDto,
} from './campaign.dto';

describe('Campaign DTO validation', () => {
  it('accepts a complete manual campaign brief', async () => {
    const dto = plainToInstance(CampaignDto, {
      penNameId: 'pen-1',
      bookId: 'book-1',
      name: 'Launch week',
      type: 'LAUNCH',
      objective: 'Drive preorders',
      brief: 'Introduce the emotional promise of the book.',
      startDate: '2026-11-01',
      endDate: '2026-11-14',
      status: 'DRAFT',
      targetPlatforms: ['instagram', 'linkedin'],
      generationSettings: {},
      contentPillarIds: ['pillar-1'],
      audienceAngleIds: ['angle-1'],
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects malformed campaign collections and enums', async () => {
    const dto = plainToInstance(CampaignDto, {
      penNameId: '',
      name: '',
      type: 'BOOK_LAUNCH',
      objective: '',
      brief: '',
      status: 'PUBLISHED',
      targetPlatforms: 'instagram',
      generationSettings: [],
      contentPillarIds: ['duplicate', 'duplicate'],
      audienceAngleIds: [],
    });
    const properties = (await validate(dto)).map((error) => error.property);
    expect(properties).toEqual(
      expect.arrayContaining([
        'penNameId',
        'name',
        'type',
        'objective',
        'brief',
        'status',
        'targetPlatforms',
        'generationSettings',
        'contentPillarIds',
      ])
    );
  });

  it('validates manual ideas and variants without generation fields', async () => {
    const idea = plainToInstance(CampaignIdeaDto, {
      title: 'The impossible choice',
      coreConcept: 'Invite readers to choose between two costs.',
      hook: 'What would you sacrifice?',
      sourceRationale: { bookField: 'themes' },
      status: 'SHORTLISTED',
    });
    const variant = plainToInstance(CampaignVariantDto, {
      platform: 'instagram',
      format: 'IMAGE_POST',
      content: 'Every desire has a price.',
      hashtags: ['bookstagram'],
      mediaBrief: {},
      platformSettings: {},
    });
    expect(await validate(idea)).toHaveLength(0);
    expect(await validate(variant)).toHaveLength(0);
  });
});
