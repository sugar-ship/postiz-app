import { NotFoundException } from '@nestjs/common';
import { AuthorStudioService } from './author-studio.service';

describe('AuthorStudioService CRUD', () => {
  const repository = {
    listPenNames: jest.fn(),
    getPenName: jest.fn(),
    createPenName: jest.fn(),
    updatePenName: jest.fn(),
    archivePenName: jest.fn(),
    upsertBrandProfile: jest.fn(),
    archiveBrandProfile: jest.fn(),
    listSeries: jest.fn(),
    getSeries: jest.fn(),
    createSeries: jest.fn(),
    updateSeries: jest.fn(),
    archiveSeries: jest.fn(),
    listBooks: jest.fn(),
    getBook: jest.fn(),
    createBook: jest.fn(),
    updateBook: jest.fn(),
    archiveBook: jest.fn(),
    listBookSources: jest.fn(),
    getBookSource: jest.fn(),
    createBookSource: jest.fn(),
    updateBookSource: jest.fn(),
    archiveBookSource: jest.fn(),
    listContentPillars: jest.fn(),
    getContentPillar: jest.fn(),
    createContentPillar: jest.fn(),
    updateContentPillar: jest.fn(),
    archiveContentPillar: jest.fn(),
    listAudienceAngles: jest.fn(),
    getAudienceAngle: jest.fn(),
    createAudienceAngle: jest.fn(),
    updateAudienceAngle: jest.fn(),
    archiveAudienceAngle: jest.fn(),
  };
  const service = new AuthorStudioService(repository as never);

  beforeEach(() => jest.clearAllMocks());

  it('passes the authenticated organization through create and update operations', async () => {
    const pen = { id: 'pen-1', name: 'Dahlia' };
    repository.createPenName.mockResolvedValue(pen);
    repository.updatePenName.mockResolvedValue(pen);
    const dto = { name: 'Dahlia', slug: 'dahlia', active: true };

    await expect(service.createPenName('org-a', dto)).resolves.toBe(pen);
    await expect(service.updatePenName('org-a', 'pen-1', dto)).resolves.toBe(
      pen
    );
    expect(repository.createPenName).toHaveBeenCalledWith('org-a', dto);
    expect(repository.updatePenName).toHaveBeenCalledWith(
      'org-a',
      'pen-1',
      dto
    );
  });

  it.each([
    ['archivePenName', 'archivePenName'],
    ['archiveSeries', 'archiveSeries'],
    ['archiveBook', 'archiveBook'],
    ['archiveContentPillar', 'archiveContentPillar'],
    ['archiveAudienceAngle', 'archiveAudienceAngle'],
  ] as const)(
    'supports soft archive through %s',
    async (serviceMethod, repoMethod) => {
      repository[repoMethod].mockResolvedValue({ count: 1 });
      await expect(
        service[serviceMethod]('org-a', 'record-1')
      ).resolves.toEqual({
        id: 'record-1',
      });
      expect(repository[repoMethod]).toHaveBeenCalledWith('org-a', 'record-1');
    }
  );

  it('supports nested book-source CRUD with organization and book scope', async () => {
    const source = { id: 'source-1' };
    const dto = {
      kind: 'EXCERPT' as const,
      title: 'Opening',
      content: 'Text',
      status: 'ACTIVE' as const,
    };
    repository.createBookSource.mockResolvedValue(source);
    repository.updateBookSource.mockResolvedValue(source);
    await service.createBookSource('org-a', 'book-1', dto);
    await service.updateBookSource('org-a', 'book-1', 'source-1', dto);
    expect(repository.createBookSource).toHaveBeenCalledWith(
      'org-a',
      'book-1',
      dto
    );
    expect(repository.updateBookSource).toHaveBeenCalledWith(
      'org-a',
      'book-1',
      'source-1',
      dto
    );
  });

  it('turns missing or cross-organization records into 404 responses', async () => {
    repository.getBook.mockResolvedValue(null);
    repository.updateSeries.mockResolvedValue(null);
    await expect(
      service.getBook('org-a', 'foreign-book')
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.updateSeries('org-a', 'foreign-series', {
        penNameId: 'pen-1',
        name: 'Series',
        slug: 'series',
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
