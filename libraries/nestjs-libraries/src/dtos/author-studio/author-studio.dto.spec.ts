import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BookStatus } from '@prisma/client';
import { PenNameDto } from './pen-name.dto';
import { BookDto } from './book.dto';
import { AudienceAngleDto } from './taxonomy.dto';

describe('Author Studio DTO validation', () => {
  it('accepts a complete pen name and rejects invalid slugs and URLs', async () => {
    const valid = plainToInstance(PenNameDto, {
      name: 'Dahlia North',
      slug: 'dahlia-north',
      websiteUrl: 'https://example.com',
      active: true,
    });
    expect(await validate(valid)).toHaveLength(0);

    const invalid = plainToInstance(PenNameDto, {
      name: 'Dahlia North',
      slug: 'Not A Slug',
      websiteUrl: 'not-a-url',
      active: 'yes',
    });
    const properties = (await validate(invalid)).map((error) => error.property);
    expect(properties).toEqual(
      expect.arrayContaining(['slug', 'websiteUrl', 'active'])
    );
  });

  it('validates structured book profile fields', async () => {
    const book = plainToInstance(BookDto, {
      penNameId: 'pen-1',
      title: 'Existential Kink',
      status: BookStatus.LIVE,
      releaseDate: '2026-09-30',
      tropes: ['forbidden desire'],
      themes: ['identity'],
      hooks: ['What if desire knows first?'],
      characters: ['Dahlia'],
      audience: ['dark romance readers'],
      tone: ['intimate'],
      contentWarnings: [],
    });
    expect(await validate(book)).toHaveLength(0);

    const invalid = plainToInstance(BookDto, {
      penNameId: 'pen-1',
      title: '',
      status: 'PUBLISHED',
      releaseDate: 'not-a-date',
      tropes: 'not-an-array',
    });
    const properties = (await validate(invalid)).map((error) => error.property);
    expect(properties).toEqual(
      expect.arrayContaining(['title', 'status', 'releaseDate', 'tropes'])
    );
  });

  it('requires audience-angle platform notes to be an object', async () => {
    const angle = plainToInstance(AudienceAngleDto, {
      penNameId: 'pen-1',
      name: 'Permission to want',
      objections: [],
      platformNotes: [],
      active: true,
    });
    expect((await validate(angle)).map((error) => error.property)).toContain(
      'platformNotes'
    );
  });
});
