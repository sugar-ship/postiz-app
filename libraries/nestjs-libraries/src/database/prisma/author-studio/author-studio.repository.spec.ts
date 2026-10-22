import { BookStatus } from '@prisma/client';
import { AuthorStudioRepository } from './author-studio.repository';

const model = {
  penName: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  brandProfile: { upsert: jest.fn(), updateMany: jest.fn() },
  series: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  book: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  bookSource: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  contentPillar: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  audienceAngle: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
};

describe('AuthorStudioRepository organization scoping', () => {
  const repository = new AuthorStudioRepository({ model } as never);

  beforeEach(() => jest.clearAllMocks());

  it('scopes every pen-name list query to the authenticated organization', async () => {
    model.penName.findMany.mockResolvedValue([]);
    await repository.listPenNames('org-a');
    expect(model.penName.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-a', deletedAt: null },
      })
    );
  });

  it('cannot update a book outside the authenticated organization', async () => {
    model.penName.findFirst.mockResolvedValue({ id: 'pen-1' });
    model.book.updateMany.mockResolvedValue({ count: 0 });
    const result = await repository.updateBook('org-a', 'book-from-org-b', {
      penNameId: 'pen-1',
      title: 'Scoped book',
      status: BookStatus.IDEA,
      tropes: [],
      themes: [],
      hooks: [],
      characters: [],
      audience: [],
      tone: [],
      contentWarnings: [],
    });
    expect(result).toBeNull();
    expect(model.book.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'book-from-org-b',
          organizationId: 'org-a',
          deletedAt: null,
        },
      })
    );
  });

  it('verifies book ownership before creating a nested source', async () => {
    model.book.findFirst.mockResolvedValue(null);
    const result = await repository.createBookSource('org-a', 'foreign-book', {
      kind: 'EXCERPT',
      title: 'Opening',
      content: 'Text',
      status: 'ACTIVE',
    });
    expect(result).toBeNull();
    expect(model.book.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'foreign-book',
        organizationId: 'org-a',
        deletedAt: null,
      },
      select: { id: true },
    });
    expect(model.bookSource.create).not.toHaveBeenCalled();
  });

  it('scopes taxonomy archive operations to organization and record id', async () => {
    model.audienceAngle.updateMany.mockResolvedValue({ count: 1 });
    await repository.archiveAudienceAngle('org-a', 'angle-1');
    expect(model.audienceAngle.updateMany).toHaveBeenCalledWith({
      where: { id: 'angle-1', organizationId: 'org-a', deletedAt: null },
      data: { active: false, deletedAt: expect.any(Date) },
    });
  });
});
