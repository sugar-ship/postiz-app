'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { FormProvider, useForm } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { Textarea } from '@gitroom/react/form/textarea';
import { Select } from '@gitroom/react/form/select';
import { Checkbox } from '@gitroom/react/form/checkbox';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { AuthorStudioShell, EmptyState } from './author-studio.shell';
import {
  AudienceAngleRecord,
  ContentPillarRecord,
  PenNameRecord,
} from './types';
import {
  arrayToLines,
  linesToArray,
  linesToObject,
  objectToLines,
  readApiResponse,
} from './author-studio.utils';

type PillarForm = {
  penNameId: string;
  name: string;
  description: string;
  examples: string;
  active: boolean;
  sortOrder: number;
};

type AngleForm = {
  penNameId: string;
  name: string;
  description: string;
  readerNeed: string;
  desiredReaction: string;
  objections: string;
  platformNotes: string;
  active: boolean;
};

function usePenNames() {
  const fetch = useFetch();
  return useSWR<PenNameRecord[]>('author-studio-pen-names', async () =>
    readApiResponse<PenNameRecord[]>(await fetch('/author-studio/pen-names'))
  );
}

export function ContentPillarsComponent() {
  const fetch = useFetch();
  const toast = useToaster();
  const { data: penNames = [] } = usePenNames();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data = [], mutate } = useSWR<ContentPillarRecord[]>(
    'author-studio-content-pillars',
    async () =>
      readApiResponse<ContentPillarRecord[]>(
        await fetch('/author-studio/content-pillars')
      )
  );
  const selected = data.find((item) => item.id === selectedId);
  useEffect(() => {
    if (!selectedId && data.length) setSelectedId(data[0].id);
  }, [data, selectedId]);

  const archive = async () => {
    if (!selected || !(await deleteDialog(`Archive “${selected.name}”?`)))
      return;
    try {
      await readApiResponse(
        await fetch(`/author-studio/content-pillars/${selected.id}`, {
          method: 'DELETE',
        })
      );
      setSelectedId(null);
      await mutate();
      toast.show('Content pillar archived', 'success');
    } catch (error) {
      toast.show((error as Error).message, 'warning');
    }
  };

  return (
    <AuthorStudioShell
      active="content-pillars"
      title="Content Pillars"
      description="Define the repeatable themes each pen name can use to build a balanced content mix."
    >
      <div className="grid grid-cols-[300px_1fr] mobile:grid-cols-1 gap-[20px]">
        <ResourceList
          records={data}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId(null)}
          empty="No content pillars yet."
          addLabel="New content pillar"
        />
        <div className="flex flex-col gap-[16px]">
          <PillarEditor
            record={selected}
            penNames={penNames}
            onSaved={async (record) => {
              setSelectedId(record.id);
              await mutate();
            }}
          />
          {selected && (
            <Button secondary onClick={archive} className="self-start">
              Archive content pillar
            </Button>
          )}
        </div>
      </div>
    </AuthorStudioShell>
  );
}

export function AudienceAnglesComponent() {
  const fetch = useFetch();
  const toast = useToaster();
  const { data: penNames = [] } = usePenNames();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data = [], mutate } = useSWR<AudienceAngleRecord[]>(
    'author-studio-audience-angles',
    async () =>
      readApiResponse<AudienceAngleRecord[]>(
        await fetch('/author-studio/audience-angles')
      )
  );
  const selected = data.find((item) => item.id === selectedId);
  useEffect(() => {
    if (!selectedId && data.length) setSelectedId(data[0].id);
  }, [data, selectedId]);

  const archive = async () => {
    if (!selected || !(await deleteDialog(`Archive “${selected.name}”?`)))
      return;
    try {
      await readApiResponse(
        await fetch(`/author-studio/audience-angles/${selected.id}`, {
          method: 'DELETE',
        })
      );
      setSelectedId(null);
      await mutate();
      toast.show('Audience angle archived', 'success');
    } catch (error) {
      toast.show((error as Error).message, 'warning');
    }
  };

  return (
    <AuthorStudioShell
      active="audience-angles"
      title="Audience Angles"
      description="Capture reader needs, desired reactions, objections, and platform-specific positioning."
    >
      <div className="grid grid-cols-[300px_1fr] mobile:grid-cols-1 gap-[20px]">
        <ResourceList
          records={data}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId(null)}
          empty="No audience angles yet."
          addLabel="New audience angle"
        />
        <div className="flex flex-col gap-[16px]">
          <AngleEditor
            record={selected}
            penNames={penNames}
            onSaved={async (record) => {
              setSelectedId(record.id);
              await mutate();
            }}
          />
          {selected && (
            <Button secondary onClick={archive} className="self-start">
              Archive audience angle
            </Button>
          )}
        </div>
      </div>
    </AuthorStudioShell>
  );
}

function ResourceList<
  T extends { id: string; name: string; penName?: PenNameRecord }
>({
  records,
  selectedId,
  onSelect,
  onNew,
  empty,
  addLabel,
}: {
  records: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  empty: string;
  addLabel: string;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <Button onClick={onNew}>{addLabel}</Button>
      {records.map((record) => (
        <button
          key={record.id}
          onClick={() => onSelect(record.id)}
          className={`text-start border rounded-[10px] p-[14px] cursor-pointer ${
            selectedId === record.id
              ? 'border-forth bg-newBgColorInner'
              : 'border-newTableBorder'
          }`}
        >
          <div className="font-[600]">{record.name}</div>
          <div className="text-[12px] text-customColor18 mt-[4px]">
            {record.penName?.name}
          </div>
        </button>
      ))}
      {!records.length && <EmptyState>{empty}</EmptyState>}
    </div>
  );
}

function PillarEditor({
  record,
  penNames,
  onSaved,
}: {
  record?: ContentPillarRecord;
  penNames: PenNameRecord[];
  onSaved: (record: ContentPillarRecord) => Promise<void>;
}) {
  const fetch = useFetch();
  const toast = useToaster();
  const values = useMemo<PillarForm>(
    () => ({
      penNameId: record?.penNameId || penNames[0]?.id || '',
      name: record?.name || '',
      description: record?.description || '',
      examples: arrayToLines(record?.examples),
      active: record?.active ?? true,
      sortOrder: record?.sortOrder || 0,
    }),
    [record, penNames]
  );
  const form = useForm<PillarForm>({ values });
  const submit = form.handleSubmit(async (input) => {
    try {
      const saved = await readApiResponse<ContentPillarRecord>(
        await fetch(
          record
            ? `/author-studio/content-pillars/${record.id}`
            : '/author-studio/content-pillars',
          {
            method: record ? 'PUT' : 'POST',
            body: JSON.stringify({
              ...input,
              sortOrder: Number(input.sortOrder),
              examples: linesToArray(input.examples),
            }),
          }
        )
      );
      await onSaved(saved);
      toast.show(
        record ? 'Content pillar updated' : 'Content pillar created',
        'success'
      );
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
          {record ? 'Content pillar details' : 'Create a content pillar'}
        </div>
        <Select label="Pen name" name="penNameId" required>
          <option value="">Select a pen name</option>
          {penNames.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Input label="Name" name="name" required />
        <Textarea label="Description" name="description" />
        <Textarea label="Examples (one per line)" name="examples" />
        <Input label="Sort order" name="sortOrder" type="number" min={0} />
        <Checkbox name="active" label="Active" />
        <Button
          type="submit"
          disabled={!penNames.length}
          loading={form.formState.isSubmitting}
          className="self-start"
        >
          Save content pillar
        </Button>
      </form>
    </FormProvider>
  );
}

function AngleEditor({
  record,
  penNames,
  onSaved,
}: {
  record?: AudienceAngleRecord;
  penNames: PenNameRecord[];
  onSaved: (record: AudienceAngleRecord) => Promise<void>;
}) {
  const fetch = useFetch();
  const toast = useToaster();
  const values = useMemo<AngleForm>(
    () => ({
      penNameId: record?.penNameId || penNames[0]?.id || '',
      name: record?.name || '',
      description: record?.description || '',
      readerNeed: record?.readerNeed || '',
      desiredReaction: record?.desiredReaction || '',
      objections: arrayToLines(record?.objections),
      platformNotes: objectToLines(record?.platformNotes),
      active: record?.active ?? true,
    }),
    [record, penNames]
  );
  const form = useForm<AngleForm>({ values });
  const submit = form.handleSubmit(async (input) => {
    try {
      const saved = await readApiResponse<AudienceAngleRecord>(
        await fetch(
          record
            ? `/author-studio/audience-angles/${record.id}`
            : '/author-studio/audience-angles',
          {
            method: record ? 'PUT' : 'POST',
            body: JSON.stringify({
              ...input,
              objections: linesToArray(input.objections),
              platformNotes: linesToObject(input.platformNotes),
            }),
          }
        )
      );
      await onSaved(saved);
      toast.show(
        record ? 'Audience angle updated' : 'Audience angle created',
        'success'
      );
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
          {record ? 'Audience angle details' : 'Create an audience angle'}
        </div>
        <Select label="Pen name" name="penNameId" required>
          <option value="">Select a pen name</option>
          {penNames.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Input label="Name" name="name" required />
        <Textarea label="Description" name="description" />
        <Textarea label="Reader need" name="readerNeed" />
        <Textarea label="Desired reaction" name="desiredReaction" />
        <Textarea label="Objections (one per line)" name="objections" />
        <Textarea
          label="Platform notes (platform: note, one per line)"
          name="platformNotes"
        />
        <Checkbox name="active" label="Active" />
        <Button
          type="submit"
          disabled={!penNames.length}
          loading={form.formState.isSubmitting}
          className="self-start"
        >
          Save audience angle
        </Button>
      </form>
    </FormProvider>
  );
}
