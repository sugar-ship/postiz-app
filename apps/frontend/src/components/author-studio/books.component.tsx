'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { FormProvider, useForm } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { Textarea } from '@gitroom/react/form/textarea';
import { Select } from '@gitroom/react/form/select';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { AuthorStudioShell, EmptyState } from './author-studio.shell';
import {
  BookRecord,
  BookSourceRecord,
  PenNameRecord,
  SeriesRecord,
} from './types';
import {
  arrayToLines,
  linesToArray,
  readApiResponse,
} from './author-studio.utils';

type BookForm = {
  penNameId: string;
  seriesId: string;
  title: string;
  subtitle: string;
  seriesNumber: string;
  status: BookRecord['status'];
  releaseDate: string;
  buyUrl: string;
  readerMagnetUrl: string;
  blurb: string;
  shortPitch: string;
  tropes: string;
  themes: string;
  hooks: string;
  characters: string;
  audience: string;
  tone: string;
  contentWarnings: string;
  marketingNotes: string;
};

type SeriesForm = {
  penNameId: string;
  name: string;
  slug: string;
  description: string;
  genre: string;
  audience: string;
  seriesOrderNotes: string;
};

type SourceForm = {
  kind: BookSourceRecord['kind'];
  title: string;
  content: string;
  mediaId: string;
  checksum: string;
  status: BookSourceRecord['status'];
};

export function BooksComponent({ initialBookId }: { initialBookId?: string }) {
  const fetch = useFetch();
  const toast = useToaster();
  const [mode, setMode] = useState<'books' | 'series'>('books');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(
    initialBookId || null
  );
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const { data: penNames = [] } = useSWR<PenNameRecord[]>(
    'author-studio-pen-names',
    async () =>
      readApiResponse<PenNameRecord[]>(await fetch('/author-studio/pen-names'))
  );
  const { data: books = [], mutate: mutateBooks } = useSWR<BookRecord[]>(
    'author-studio-books',
    async () =>
      readApiResponse<BookRecord[]>(await fetch('/author-studio/books'))
  );
  const { data: series = [], mutate: mutateSeries } = useSWR<SeriesRecord[]>(
    'author-studio-series',
    async () =>
      readApiResponse<SeriesRecord[]>(await fetch('/author-studio/series'))
  );
  const { data: selectedBook, mutate: mutateSelectedBook } = useSWR<BookRecord>(
    selectedBookId ? `author-studio-book-${selectedBookId}` : null,
    async () =>
      readApiResponse<BookRecord>(
        await fetch(`/author-studio/books/${selectedBookId}`)
      )
  );
  const { data: selectedSeries, mutate: mutateSelectedSeries } =
    useSWR<SeriesRecord>(
      selectedSeriesId ? `author-studio-series-${selectedSeriesId}` : null,
      async () =>
        readApiResponse<SeriesRecord>(
          await fetch(`/author-studio/series/${selectedSeriesId}`)
        )
    );

  const archiveBook = async () => {
    if (!selectedBookId || !(await deleteDialog('Archive this book?'))) return;
    try {
      await readApiResponse(
        await fetch(`/author-studio/books/${selectedBookId}`, {
          method: 'DELETE',
        })
      );
      setSelectedBookId(null);
      await mutateBooks();
      toast.show('Book archived', 'success');
    } catch (error) {
      toast.show((error as Error).message, 'warning');
    }
  };

  const archiveSeries = async () => {
    if (!selectedSeriesId || !(await deleteDialog('Archive this series?')))
      return;
    try {
      await readApiResponse(
        await fetch(`/author-studio/series/${selectedSeriesId}`, {
          method: 'DELETE',
        })
      );
      setSelectedSeriesId(null);
      await mutateSeries();
      toast.show('Series archived', 'success');
    } catch (error) {
      toast.show((error as Error).message, 'warning');
    }
  };

  return (
    <AuthorStudioShell
      active="books"
      title="Books & Series"
      description="Build complete book marketing profiles and attach curated source material."
    >
      <div className="flex gap-[8px]">
        <Button secondary={mode !== 'books'} onClick={() => setMode('books')}>
          Books
        </Button>
        <Button secondary={mode !== 'series'} onClick={() => setMode('series')}>
          Series
        </Button>
      </div>
      {mode === 'books' ? (
        <div className="grid grid-cols-[300px_1fr] mobile:grid-cols-1 gap-[20px]">
          <div className="flex flex-col gap-[8px]">
            <Button onClick={() => setSelectedBookId(null)}>New book</Button>
            {books.map((book) => (
              <button
                key={book.id}
                onClick={() => setSelectedBookId(book.id)}
                className={`text-start border rounded-[10px] p-[14px] cursor-pointer ${
                  selectedBookId === book.id
                    ? 'border-forth bg-newBgColorInner'
                    : 'border-newTableBorder'
                }`}
              >
                <div className="font-[600]">{book.title}</div>
                <div className="text-[12px] text-customColor18 mt-[4px]">
                  {book.penName?.name} · {book.status} ·{' '}
                  {book._count?.sources || 0} sources
                </div>
              </button>
            ))}
            {!books.length && <EmptyState>No books yet.</EmptyState>}
          </div>
          <div className="flex flex-col gap-[20px]">
            <BookEditor
              record={selectedBookId ? selectedBook : undefined}
              penNames={penNames}
              series={series}
              onSaved={async (book) => {
                setSelectedBookId(book.id);
                await mutateBooks();
                await mutateSelectedBook();
              }}
            />
            {selectedBookId && selectedBook && (
              <>
                <BookSources
                  bookId={selectedBookId}
                  sources={selectedBook.sources || []}
                  reload={async () => {
                    await mutateSelectedBook();
                    return mutateBooks();
                  }}
                />
                <Button secondary onClick={archiveBook} className="self-start">
                  Archive book
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[300px_1fr] mobile:grid-cols-1 gap-[20px]">
          <div className="flex flex-col gap-[8px]">
            <Button onClick={() => setSelectedSeriesId(null)}>
              New series
            </Button>
            {series.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedSeriesId(item.id)}
                className={`text-start border rounded-[10px] p-[14px] cursor-pointer ${
                  selectedSeriesId === item.id
                    ? 'border-forth bg-newBgColorInner'
                    : 'border-newTableBorder'
                }`}
              >
                <div className="font-[600]">{item.name}</div>
                <div className="text-[12px] text-customColor18 mt-[4px]">
                  {item.penName?.name} · {item._count?.books || 0} books
                </div>
              </button>
            ))}
            {!series.length && <EmptyState>No series yet.</EmptyState>}
          </div>
          <div className="flex flex-col gap-[20px]">
            <SeriesEditor
              record={selectedSeriesId ? selectedSeries : undefined}
              penNames={penNames}
              onSaved={async (record) => {
                setSelectedSeriesId(record.id);
                await mutateSeries();
                await mutateSelectedSeries();
              }}
            />
            {selectedSeriesId && (
              <Button secondary onClick={archiveSeries} className="self-start">
                Archive series
              </Button>
            )}
          </div>
        </div>
      )}
    </AuthorStudioShell>
  );
}

function BookEditor({
  record,
  penNames,
  series,
  onSaved,
}: {
  record?: BookRecord;
  penNames: PenNameRecord[];
  series: SeriesRecord[];
  onSaved: (book: BookRecord) => Promise<void>;
}) {
  const fetch = useFetch();
  const toast = useToaster();
  const values = useMemo<BookForm>(
    () => ({
      penNameId: record?.penNameId || penNames[0]?.id || '',
      seriesId: record?.seriesId || '',
      title: record?.title || '',
      subtitle: record?.subtitle || '',
      seriesNumber: record?.seriesNumber?.toString() || '',
      status: record?.status || 'IDEA',
      releaseDate: record?.releaseDate?.slice(0, 10) || '',
      buyUrl: record?.buyUrl || '',
      readerMagnetUrl: record?.readerMagnetUrl || '',
      blurb: record?.blurb || '',
      shortPitch: record?.shortPitch || '',
      tropes: arrayToLines(record?.tropes),
      themes: arrayToLines(record?.themes),
      hooks: arrayToLines(record?.hooks),
      characters: arrayToLines(record?.characters),
      audience: arrayToLines(record?.audience),
      tone: arrayToLines(record?.tone),
      contentWarnings: arrayToLines(record?.contentWarnings),
      marketingNotes: record?.marketingNotes || '',
    }),
    [record, penNames]
  );
  const form = useForm<BookForm>({ values });
  const selectedPenName = form.watch('penNameId');
  const availableSeries = series.filter(
    (item) => item.penNameId === selectedPenName
  );
  const submit = form.handleSubmit(async (input) => {
    try {
      const body = {
        ...input,
        seriesId: input.seriesId || undefined,
        seriesNumber: input.seriesNumber
          ? Number(input.seriesNumber)
          : undefined,
        releaseDate: input.releaseDate || undefined,
        buyUrl: input.buyUrl || undefined,
        readerMagnetUrl: input.readerMagnetUrl || undefined,
        tropes: linesToArray(input.tropes),
        themes: linesToArray(input.themes),
        hooks: linesToArray(input.hooks),
        characters: linesToArray(input.characters),
        audience: linesToArray(input.audience),
        tone: linesToArray(input.tone),
        contentWarnings: linesToArray(input.contentWarnings),
      };
      const saved = await readApiResponse<BookRecord>(
        await fetch(
          record ? `/author-studio/books/${record.id}` : '/author-studio/books',
          {
            method: record ? 'PUT' : 'POST',
            body: JSON.stringify(body),
          }
        )
      );
      await onSaved(saved);
      toast.show(record ? 'Book updated' : 'Book created', 'success');
    } catch (error) {
      toast.show((error as Error).message, 'warning');
    }
  });
  return (
    <FormProvider {...form}>
      <form
        onSubmit={submit}
        className="bg-newBgColorInner border border-newTableBorder rounded-[12px] p-[20px] flex flex-col gap-[12px]"
      >
        <div className="text-[20px] font-[600]">
          {record ? 'Book marketing profile' : 'Create a book'}
        </div>
        {!penNames.length && (
          <div className="text-yellow-400">
            Create a pen name before adding books.
          </div>
        )}
        <div className="grid grid-cols-2 mobile:grid-cols-1 gap-[12px]">
          <Select label="Pen name" name="penNameId" required>
            <option value="">Select a pen name</option>
            {penNames.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select label="Series" name="seriesId">
            <option value="">Standalone</option>
            {availableSeries.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Input label="Title" name="title" required />
          <Input label="Subtitle" name="subtitle" />
          <Input
            label="Series number"
            name="seriesNumber"
            type="number"
            min={0}
          />
          <Select label="Status" name="status">
            {['IDEA', 'PREORDER', 'LIVE', 'BACKLIST', 'ARCHIVED'].map(
              (status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              )
            )}
          </Select>
          <Input label="Release date" name="releaseDate" type="date" />
          <Input label="Buy URL" name="buyUrl" type="url" />
          <Input label="Reader magnet URL" name="readerMagnetUrl" type="url" />
          <Input label="Short pitch" name="shortPitch" />
        </div>
        <Textarea label="Blurb" name="blurb" />
        <div className="grid grid-cols-2 mobile:grid-cols-1 gap-[12px]">
          <Textarea label="Tropes (one per line)" name="tropes" />
          <Textarea label="Themes (one per line)" name="themes" />
          <Textarea label="Hooks (one per line)" name="hooks" />
          <Textarea label="Characters (one per line)" name="characters" />
          <Textarea label="Audience (one per line)" name="audience" />
          <Textarea label="Tone (one per line)" name="tone" />
          <Textarea
            label="Content warnings (one per line)"
            name="contentWarnings"
          />
          <Textarea label="Marketing notes" name="marketingNotes" />
        </div>
        <Button
          type="submit"
          disabled={!penNames.length}
          loading={form.formState.isSubmitting}
          className="self-start"
        >
          Save book
        </Button>
      </form>
    </FormProvider>
  );
}

function SeriesEditor({
  record,
  penNames,
  onSaved,
}: {
  record?: SeriesRecord;
  penNames: PenNameRecord[];
  onSaved: (record: SeriesRecord) => Promise<void>;
}) {
  const fetch = useFetch();
  const toast = useToaster();
  const values = useMemo<SeriesForm>(
    () => ({
      penNameId: record?.penNameId || penNames[0]?.id || '',
      name: record?.name || '',
      slug: record?.slug || '',
      description: record?.description || '',
      genre: record?.genre || '',
      audience: record?.audience || '',
      seriesOrderNotes: record?.seriesOrderNotes || '',
    }),
    [record, penNames]
  );
  const form = useForm<SeriesForm>({ values });
  const submit = form.handleSubmit(async (input) => {
    try {
      const saved = await readApiResponse<SeriesRecord>(
        await fetch(
          record
            ? `/author-studio/series/${record.id}`
            : '/author-studio/series',
          {
            method: record ? 'PUT' : 'POST',
            body: JSON.stringify(input),
          }
        )
      );
      await onSaved(saved);
      toast.show(record ? 'Series updated' : 'Series created', 'success');
    } catch (error) {
      toast.show((error as Error).message, 'warning');
    }
  });
  return (
    <FormProvider {...form}>
      <form
        onSubmit={submit}
        className="bg-newBgColorInner border border-newTableBorder rounded-[12px] p-[20px] flex flex-col gap-[12px]"
      >
        <div className="text-[20px] font-[600]">
          {record ? 'Series details' : 'Create a series'}
        </div>
        <Select label="Pen name" name="penNameId" required>
          <option value="">Select a pen name</option>
          {penNames.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 mobile:grid-cols-1 gap-[12px]">
          <Input label="Name" name="name" required />
          <Input label="Slug" name="slug" required placeholder="series-name" />
          <Input label="Genre" name="genre" />
          <Input label="Audience" name="audience" />
        </div>
        <Textarea label="Description" name="description" />
        <Textarea label="Series order notes" name="seriesOrderNotes" />
        <Button
          type="submit"
          disabled={!penNames.length}
          loading={form.formState.isSubmitting}
          className="self-start"
        >
          Save series
        </Button>
      </form>
    </FormProvider>
  );
}

function BookSources({
  bookId,
  sources,
  reload,
}: {
  bookId: string;
  sources: BookSourceRecord[];
  reload: () => Promise<unknown>;
}) {
  const fetch = useFetch();
  const toast = useToaster();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = sources.find((source) => source.id === selectedId);
  const values = useMemo<SourceForm>(
    () => ({
      kind: selected?.kind || 'EXCERPT',
      title: selected?.title || '',
      content: selected?.content || '',
      mediaId: selected?.mediaId || '',
      checksum: selected?.checksum || '',
      status: selected?.status || 'ACTIVE',
    }),
    [selected]
  );
  const form = useForm<SourceForm>({ values });
  const submit = form.handleSubmit(async (input) => {
    try {
      await readApiResponse(
        await fetch(
          selected
            ? `/author-studio/books/${bookId}/sources/${selected.id}`
            : `/author-studio/books/${bookId}/sources`,
          {
            method: selected ? 'PUT' : 'POST',
            body: JSON.stringify({
              ...input,
              mediaId: input.mediaId || undefined,
              checksum: input.checksum || undefined,
            }),
          }
        )
      );
      setSelectedId(null);
      await reload();
      toast.show(
        selected ? 'Book source updated' : 'Book source created',
        'success'
      );
    } catch (error) {
      toast.show((error as Error).message, 'warning');
    }
  });
  const archive = async (source: BookSourceRecord) => {
    if (!(await deleteDialog(`Archive source “${source.title}”?`))) return;
    try {
      await readApiResponse(
        await fetch(`/author-studio/books/${bookId}/sources/${source.id}`, {
          method: 'DELETE',
        })
      );
      if (selectedId === source.id) setSelectedId(null);
      await reload();
      toast.show('Book source archived', 'success');
    } catch (error) {
      toast.show((error as Error).message, 'warning');
    }
  };
  return (
    <div className="bg-newBgColorInner border border-newTableBorder rounded-[12px] p-[20px] flex flex-col gap-[16px]">
      <div className="flex items-center gap-[12px]">
        <div className="text-[20px] font-[600] flex-1">Curated sources</div>
        <Button onClick={() => setSelectedId(null)}>New source</Button>
      </div>
      <div className="grid grid-cols-2 mobile:grid-cols-1 gap-[8px]">
        {sources.map((source) => (
          <div
            key={source.id}
            className="border border-newTableBorder rounded-[8px] p-[12px]"
          >
            <button
              className="text-start cursor-pointer w-full"
              onClick={() => setSelectedId(source.id)}
            >
              <div className="font-[600]">{source.title}</div>
              <div className="text-[12px] text-customColor18">
                {source.kind}
              </div>
            </button>
            <Button
              secondary
              className="mt-[8px]"
              onClick={() => archive(source)}
            >
              Archive
            </Button>
          </div>
        ))}
      </div>
      <FormProvider {...form}>
        <form
          onSubmit={submit}
          className="border-t border-newTableBorder pt-[16px] flex flex-col gap-[12px]"
        >
          <div className="font-[600]">
            {selected ? 'Edit source' : 'Add source'}
          </div>
          <div className="grid grid-cols-2 mobile:grid-cols-1 gap-[12px]">
            <Select label="Kind" name="kind">
              {[
                'EXCERPT',
                'MANUSCRIPT',
                'REVIEW',
                'CHARACTER_NOTE',
                'WORLD_NOTE',
                'OTHER',
              ].map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </Select>
            <Input label="Title" name="title" required />
            <Input label="Media ID (optional)" name="mediaId" />
            <Input label="Checksum (optional)" name="checksum" />
          </div>
          <Textarea label="Curated source content" name="content" required />
          <input type="hidden" {...form.register('status')} />
          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            className="self-start"
          >
            Save source
          </Button>
        </form>
      </FormProvider>
    </div>
  );
}
