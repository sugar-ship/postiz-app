'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { FormProvider, useForm } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { Textarea } from '@gitroom/react/form/textarea';
import { Checkbox } from '@gitroom/react/form/checkbox';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { AuthorStudioShell, EmptyState } from './author-studio.shell';
import { BrandProfileRecord, PenNameRecord } from './types';
import {
  arrayToLines,
  linesToArray,
  readApiResponse,
} from './author-studio.utils';

type PenNameForm = {
  name: string;
  slug: string;
  description: string;
  websiteUrl: string;
  defaultCallToAction: string;
  active: boolean;
};

type BrandForm = {
  voiceSummary: string;
  toneRules: string;
  preferredLanguage: string;
  avoidLanguage: string;
  formattingRules: string;
  examples: string;
  contentBoundaries: string;
  version: number;
};

const emptyPenName: PenNameForm = {
  name: '',
  slug: '',
  description: '',
  websiteUrl: '',
  defaultCallToAction: '',
  active: true,
};

export function PenNamesComponent() {
  const fetch = useFetch();
  const toast = useToaster();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data = [], mutate } = useSWR<PenNameRecord[]>(
    'author-studio-pen-names',
    async () =>
      readApiResponse<PenNameRecord[]>(await fetch('/author-studio/pen-names'))
  );
  const { data: selected, mutate: mutateSelected } = useSWR<PenNameRecord>(
    selectedId ? `author-studio-pen-name-${selectedId}` : null,
    async () =>
      readApiResponse<PenNameRecord>(
        await fetch(`/author-studio/pen-names/${selectedId}`)
      )
  );

  useEffect(() => {
    if (!selectedId && data.length) setSelectedId(data[0].id);
  }, [data, selectedId]);

  const saved = async (record: PenNameRecord) => {
    setSelectedId(record.id);
    await mutate();
    await mutateSelected();
  };

  const archive = async () => {
    if (!selectedId || !(await deleteDialog('Archive this pen name?'))) return;
    try {
      await readApiResponse(
        await fetch(`/author-studio/pen-names/${selectedId}`, {
          method: 'DELETE',
        })
      );
      setSelectedId(null);
      await mutate();
      toast.show('Pen name archived', 'success');
    } catch (error) {
      toast.show((error as Error).message, 'warning');
    }
  };

  return (
    <AuthorStudioShell
      active="pen-names"
      title="Pen Names"
      description="Maintain each author identity and its current brand voice profile."
    >
      <div className="grid grid-cols-[280px_1fr] mobile:grid-cols-1 gap-[20px]">
        <div className="flex flex-col gap-[8px]">
          <Button onClick={() => setSelectedId(null)}>New pen name</Button>
          {data.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`text-start border rounded-[10px] p-[14px] cursor-pointer ${
                selectedId === item.id
                  ? 'border-forth bg-newBgColorInner'
                  : 'border-newTableBorder'
              }`}
            >
              <div className="font-[600]">{item.name}</div>
              <div className="text-[12px] text-customColor18 mt-[4px]">
                {item._count?.books || 0} books · {item._count?.series || 0}{' '}
                series
              </div>
            </button>
          ))}
          {!data.length && <EmptyState>No pen names yet.</EmptyState>}
        </div>
        <div className="flex flex-col gap-[20px]">
          <PenNameEditor
            record={selectedId ? selected : undefined}
            onSaved={saved}
          />
          {selectedId && selected && (
            <>
              <BrandProfileEditor
                penNameId={selectedId}
                profile={selected.brandProfile}
                onSaved={mutateSelected}
              />
              <Button secondary onClick={archive} className="self-start">
                Archive pen name
              </Button>
            </>
          )}
        </div>
      </div>
    </AuthorStudioShell>
  );
}

function PenNameEditor({
  record,
  onSaved,
}: {
  record?: PenNameRecord;
  onSaved: (record: PenNameRecord) => Promise<void>;
}) {
  const fetch = useFetch();
  const toast = useToaster();
  const values = useMemo<PenNameForm>(
    () =>
      record
        ? {
            name: record.name,
            slug: record.slug,
            description: record.description || '',
            websiteUrl: record.websiteUrl || '',
            defaultCallToAction: record.defaultCallToAction || '',
            active: record.active,
          }
        : emptyPenName,
    [record]
  );
  const form = useForm<PenNameForm>({ values });
  const submit = form.handleSubmit(async (input) => {
    try {
      const body = {
        ...input,
        websiteUrl: input.websiteUrl || undefined,
      };
      const saved = await readApiResponse<PenNameRecord>(
        await fetch(
          record
            ? `/author-studio/pen-names/${record.id}`
            : '/author-studio/pen-names',
          {
            method: record ? 'PUT' : 'POST',
            body: JSON.stringify(body),
          }
        )
      );
      toast.show(record ? 'Pen name updated' : 'Pen name created', 'success');
      await onSaved(saved);
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
          {record ? 'Pen name details' : 'Create a pen name'}
        </div>
        <div className="grid grid-cols-2 mobile:grid-cols-1 gap-[12px]">
          <Input label="Name" name="name" required />
          <Input label="Slug" name="slug" required placeholder="author-name" />
        </div>
        <Textarea label="Description" name="description" />
        <div className="grid grid-cols-2 mobile:grid-cols-1 gap-[12px]">
          <Input label="Website URL" name="websiteUrl" type="url" />
          <Input label="Default call to action" name="defaultCallToAction" />
        </div>
        <Checkbox name="active" label="Active" />
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          className="self-start"
        >
          Save pen name
        </Button>
      </form>
    </FormProvider>
  );
}

function BrandProfileEditor({
  penNameId,
  profile,
  onSaved,
}: {
  penNameId: string;
  profile?: BrandProfileRecord | null;
  onSaved: () => Promise<unknown>;
}) {
  const fetch = useFetch();
  const toast = useToaster();
  const values = useMemo<BrandForm>(
    () => ({
      voiceSummary: profile?.voiceSummary || '',
      toneRules: arrayToLines(profile?.toneRules),
      preferredLanguage: arrayToLines(profile?.preferredLanguage),
      avoidLanguage: arrayToLines(profile?.avoidLanguage),
      formattingRules: arrayToLines(profile?.formattingRules),
      examples: arrayToLines(profile?.examples),
      contentBoundaries: arrayToLines(profile?.contentBoundaries),
      version: profile?.version || 1,
    }),
    [profile]
  );
  const form = useForm<BrandForm>({ values });
  const submit = form.handleSubmit(async (input) => {
    try {
      await readApiResponse(
        await fetch(`/author-studio/pen-names/${penNameId}/brand-profile`, {
          method: 'PUT',
          body: JSON.stringify({
            ...input,
            version: Number(input.version),
            toneRules: linesToArray(input.toneRules),
            preferredLanguage: linesToArray(input.preferredLanguage),
            avoidLanguage: linesToArray(input.avoidLanguage),
            formattingRules: linesToArray(input.formattingRules),
            examples: linesToArray(input.examples),
            contentBoundaries: linesToArray(input.contentBoundaries),
          }),
        })
      );
      await onSaved();
      toast.show('Brand profile saved', 'success');
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
        <div className="text-[20px] font-[600]">Brand profile</div>
        <Textarea label="Voice summary" name="voiceSummary" required />
        <div className="grid grid-cols-2 mobile:grid-cols-1 gap-[12px]">
          <Textarea label="Tone rules (one per line)" name="toneRules" />
          <Textarea
            label="Preferred language (one per line)"
            name="preferredLanguage"
          />
          <Textarea
            label="Avoid language (one per line)"
            name="avoidLanguage"
          />
          <Textarea
            label="Formatting rules (one per line)"
            name="formattingRules"
          />
          <Textarea label="Examples (one per line)" name="examples" />
          <Textarea
            label="Content boundaries (one per line)"
            name="contentBoundaries"
          />
        </div>
        <Input label="Profile version" name="version" type="number" min={1} />
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          className="self-start"
        >
          Save brand profile
        </Button>
      </form>
    </FormProvider>
  );
}
