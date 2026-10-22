'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
  AudienceAngleRecord,
  BookRecord,
  CampaignIdeaRecord,
  CampaignRecord,
  CampaignVariantRecord,
  ContentPillarRecord,
  PenNameRecord,
  SeriesRecord,
} from './types';
import {
  arrayToLines,
  linesToArray,
  linesToObject,
  objectToLines,
  readApiResponse,
} from './author-studio.utils';

const platforms = [
  'facebook',
  'instagram',
  'linkedin',
  'pinterest',
  'threads',
  'tiktok',
  'x',
  'youtube',
];

type CampaignForm = {
  penNameId: string;
  bookId: string;
  seriesId: string;
  name: string;
  type: CampaignRecord['type'];
  objective: string;
  brief: string;
  startDate: string;
  endDate: string;
  status: CampaignRecord['status'];
  targetPlatforms: string[];
  contentPillarIds: string[];
  audienceAngleIds: string[];
};

type IdeaForm = {
  title: string;
  coreConcept: string;
  hook: string;
  creativeDirection: string;
  callToAction: string;
  sourceRationale: string;
  status: CampaignIdeaRecord['status'];
};

type VariantForm = {
  platform: string;
  format: CampaignVariantRecord['format'];
  headline: string;
  content: string;
  callToAction: string;
  hashtags: string;
  mediaBrief: string;
  platformSettings: string;
};

function useCollection<T>(key: string, path: string) {
  const fetch = useFetch();
  return useSWR<T[]>(key, async () => readApiResponse<T[]>(await fetch(path)));
}

export function CampaignsComponent() {
  const fetch = useFetch();
  const toast = useToaster();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: campaigns = [], mutate } = useCollection<CampaignRecord>(
    'author-studio-campaigns',
    '/author-studio/campaigns'
  );
  const { data: selected, mutate: mutateSelected } = useSWR<CampaignRecord>(
    selectedId ? `author-studio-campaign-${selectedId}` : null,
    async () =>
      readApiResponse<CampaignRecord>(
        await fetch(`/author-studio/campaigns/${selectedId}`)
      )
  );
  const { data: penNames = [] } = useCollection<PenNameRecord>(
    'author-studio-pen-names',
    '/author-studio/pen-names'
  );
  const { data: books = [] } = useCollection<BookRecord>(
    'author-studio-books',
    '/author-studio/books'
  );
  const { data: series = [] } = useCollection<SeriesRecord>(
    'author-studio-series',
    '/author-studio/series'
  );
  const { data: pillars = [] } = useCollection<ContentPillarRecord>(
    'author-studio-content-pillars',
    '/author-studio/content-pillars'
  );
  const { data: angles = [] } = useCollection<AudienceAngleRecord>(
    'author-studio-audience-angles',
    '/author-studio/audience-angles'
  );

  const archive = async () => {
    if (!selected || !(await deleteDialog(`Archive “${selected.name}”?`)))
      return;
    try {
      await readApiResponse(
        await fetch(`/author-studio/campaigns/${selected.id}`, {
          method: 'DELETE',
        })
      );
      setSelectedId(null);
      await mutate();
      toast.show('Campaign archived', 'success');
    } catch (error) {
      toast.show((error as Error).message, 'warning');
    }
  };

  return (
    <AuthorStudioShell
      active="campaigns"
      title="Campaigns"
      description="Assemble campaign briefs, curate manual ideas, and review platform variants before AI is connected."
    >
      <div className="grid grid-cols-[320px_1fr] mobile:grid-cols-1 gap-[20px]">
        <div className="flex flex-col gap-[8px]">
          <Button onClick={() => setSelectedId(null)}>New campaign</Button>
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => setSelectedId(campaign.id)}
              className={`text-start border rounded-[10px] p-[14px] cursor-pointer ${
                selectedId === campaign.id
                  ? 'border-forth bg-newBgColorInner'
                  : 'border-newTableBorder'
              }`}
            >
              <div className="font-[600]">{campaign.name}</div>
              <div className="text-[12px] text-customColor18 mt-[4px]">
                {campaign.penName?.name} · {campaign.status} ·{' '}
                {campaign._count?.ideas || 0} ideas
              </div>
            </button>
          ))}
          {!campaigns.length && <EmptyState>No campaigns yet.</EmptyState>}
        </div>
        <div className="flex flex-col gap-[16px]">
          <CampaignEditor
            record={selectedId ? selected : undefined}
            penNames={penNames}
            books={books}
            series={series}
            pillars={pillars}
            angles={angles}
            onSaved={async (record) => {
              setSelectedId(record.id);
              await mutate();
              await mutateSelected();
            }}
          />
          {selected && (
            <div className="flex gap-[8px] flex-wrap">
              <Link
                href={`/author-studio/campaigns/${selected.id}`}
                className="bg-forth text-white rounded-[8px] px-[18px] py-[10px] text-[14px]"
              >
                Open idea and variant planner
              </Link>
              <Button secondary onClick={archive}>
                Archive campaign
              </Button>
            </div>
          )}
        </div>
      </div>
    </AuthorStudioShell>
  );
}

function CampaignEditor({
  record,
  penNames,
  books,
  series,
  pillars,
  angles,
  onSaved,
}: {
  record?: CampaignRecord;
  penNames: PenNameRecord[];
  books: BookRecord[];
  series: SeriesRecord[];
  pillars: ContentPillarRecord[];
  angles: AudienceAngleRecord[];
  onSaved: (record: CampaignRecord) => Promise<void>;
}) {
  const fetch = useFetch();
  const toast = useToaster();
  const values = useMemo<CampaignForm>(
    () => ({
      penNameId: record?.penNameId || penNames[0]?.id || '',
      bookId: record?.bookId || '',
      seriesId: record?.seriesId || '',
      name: record?.name || '',
      type: record?.type || 'LAUNCH',
      objective: record?.objective || '',
      brief: record?.brief || '',
      startDate: record?.startDate?.slice(0, 10) || '',
      endDate: record?.endDate?.slice(0, 10) || '',
      status: record?.status || 'DRAFT',
      targetPlatforms: record?.targetPlatforms || [],
      contentPillarIds:
        record?.contentPillars?.map((item) => item.contentPillar.id) || [],
      audienceAngleIds:
        record?.audienceAngles?.map((item) => item.audienceAngle.id) || [],
    }),
    [record, penNames]
  );
  const form = useForm<CampaignForm>({ values });
  const penNameId = form.watch('penNameId');
  const matchingBooks = books.filter((item) => item.penNameId === penNameId);
  const matchingSeries = series.filter((item) => item.penNameId === penNameId);
  const matchingPillars = pillars.filter(
    (item) => item.penNameId === penNameId
  );
  const matchingAngles = angles.filter((item) => item.penNameId === penNameId);
  const submit = form.handleSubmit(async (input) => {
    try {
      const saved = await readApiResponse<CampaignRecord>(
        await fetch(
          record
            ? `/author-studio/campaigns/${record.id}`
            : '/author-studio/campaigns',
          {
            method: record ? 'PUT' : 'POST',
            body: JSON.stringify({
              ...input,
              bookId: input.bookId || undefined,
              seriesId: input.seriesId || undefined,
              startDate: input.startDate || undefined,
              endDate: input.endDate || undefined,
              status: record ? input.status : 'DRAFT',
              targetPlatforms: input.targetPlatforms || [],
              contentPillarIds: input.contentPillarIds || [],
              audienceAngleIds: input.audienceAngleIds || [],
              generationSettings: record?.generationSettings || {},
            }),
          }
        )
      );
      await onSaved(saved);
      toast.show(record ? 'Campaign updated' : 'Campaign created', 'success');
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
          {record ? 'Campaign brief' : 'Create a campaign'}
        </div>
        <div className="grid grid-cols-2 mobile:grid-cols-1 gap-[12px]">
          <Select label="Pen name" name="penNameId" required>
            <option value="">Select a pen name</option>
            {penNames.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select label="Campaign type" name="type" required>
            {[
              'LAUNCH',
              'PREORDER',
              'BACKLIST',
              'READER_MAGNET',
              'SALE',
              'EVERGREEN',
              'CUSTOM',
            ].map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </Select>
          <Select label="Book (optional)" name="bookId">
            <option value="">No book</option>
            {matchingBooks.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </Select>
          <Select label="Series (optional)" name="seriesId">
            <option value="">No series</option>
            {matchingSeries.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <Input label="Campaign name" name="name" required />
        <Textarea label="Objective" name="objective" required />
        <Textarea label="Campaign brief" name="brief" required />
        <div className="grid grid-cols-3 mobile:grid-cols-1 gap-[12px]">
          <Input label="Start date" name="startDate" type="date" />
          <Input label="End date" name="endDate" type="date" />
          <Select label="Status" name="status" disabled={!record}>
            {['DRAFT', 'REVIEW', 'ACTIVE', 'COMPLETE'].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
        <CheckboxGroup
          label="Target platforms"
          name="targetPlatforms"
          options={platforms.map((value) => ({ value, label: value }))}
          register={form.register}
        />
        <CheckboxGroup
          label="Content pillars"
          name="contentPillarIds"
          options={matchingPillars.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          register={form.register}
          empty="Create content pillars for this pen name to attach them."
        />
        <CheckboxGroup
          label="Audience angles"
          name="audienceAngleIds"
          options={matchingAngles.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          register={form.register}
          empty="Create audience angles for this pen name to attach them."
        />
        <Button
          type="submit"
          disabled={!penNames.length}
          loading={form.formState.isSubmitting}
          className="self-start"
        >
          Save campaign
        </Button>
      </form>
    </FormProvider>
  );
}

function CheckboxGroup({
  label,
  name,
  options,
  register,
  empty,
}: {
  label: string;
  name: 'targetPlatforms' | 'contentPillarIds' | 'audienceAngleIds';
  options: Array<{ value: string; label: string }>;
  register: ReturnType<typeof useForm<CampaignForm>>['register'];
  empty?: string;
}) {
  return (
    <fieldset className="border border-newTableBorder rounded-[8px] p-[12px]">
      <legend className="px-[4px] text-[14px]">{label}</legend>
      <div className="flex flex-wrap gap-[12px]">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-[6px]">
            <input type="checkbox" value={option.value} {...register(name)} />
            <span className="text-[14px] capitalize">{option.label}</span>
          </label>
        ))}
        {!options.length && empty && (
          <span className="text-[13px] text-customColor18">{empty}</span>
        )}
      </div>
    </fieldset>
  );
}

export function CampaignPlannerComponent({
  campaignId,
}: {
  campaignId: string;
}) {
  const fetch = useFetch();
  const toast = useToaster();
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const { data: campaign, mutate } = useSWR<CampaignRecord>(
    `author-studio-campaign-${campaignId}`,
    async () =>
      readApiResponse<CampaignRecord>(
        await fetch(`/author-studio/campaigns/${campaignId}`)
      )
  );
  const ideas = campaign?.ideas || [];
  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId);
  const variants = selectedIdea?.variants || [];
  const selectedVariant = variants.find(
    (variant) => variant.id === selectedVariantId
  );

  useEffect(() => {
    if (!variants.some((variant) => variant.id === selectedVariantId)) {
      setSelectedVariantId(null);
    }
  }, [variants, selectedVariantId]);

  const reload = async () => {
    await mutate();
  };

  const archiveIdea = async () => {
    if (
      !selectedIdea ||
      !(await deleteDialog(`Archive “${selectedIdea.title}”?`))
    )
      return;
    try {
      await readApiResponse(
        await fetch(`/author-studio/campaign-ideas/${selectedIdea.id}`, {
          method: 'DELETE',
        })
      );
      setSelectedIdeaId(null);
      await reload();
      toast.show('Campaign idea archived', 'success');
    } catch (error) {
      toast.show((error as Error).message, 'warning');
    }
  };

  const archiveVariant = async () => {
    if (
      !selectedVariant ||
      !(await deleteDialog('Archive this campaign variant?'))
    )
      return;
    try {
      await readApiResponse(
        await fetch(`/author-studio/campaign-variants/${selectedVariant.id}`, {
          method: 'DELETE',
        })
      );
      setSelectedVariantId(null);
      await reload();
      toast.show('Campaign variant archived', 'success');
    } catch (error) {
      toast.show((error as Error).message, 'warning');
    }
  };

  const decide = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedVariant) return;
    try {
      await readApiResponse(
        await fetch(
          `/author-studio/campaign-variants/${selectedVariant.id}/${
            status === 'APPROVED' ? 'approve' : 'reject'
          }`,
          { method: 'POST' }
        )
      );
      await reload();
      toast.show(`Variant ${status.toLowerCase()}`, 'success');
    } catch (error) {
      toast.show((error as Error).message, 'warning');
    }
  };

  if (!campaign) {
    return (
      <AuthorStudioShell
        active="campaigns"
        title="Campaign planner"
        description="Loading campaign…"
      >
        <div />
      </AuthorStudioShell>
    );
  }

  return (
    <AuthorStudioShell
      active="campaigns"
      title={campaign.name}
      description={`${campaign.penName?.name || 'Pen name'} · ${
        campaign.type
      } · ${campaign.status}`}
    >
      <div className="bg-newBgColorInner border border-newTableBorder rounded-[12px] p-[16px]">
        <div className="font-[600]">{campaign.objective}</div>
        <div className="text-[14px] text-customColor18 mt-[6px] whitespace-pre-wrap">
          {campaign.brief}
        </div>
        <Link
          href="/author-studio/campaigns"
          className="text-forth text-[14px] inline-block mt-[10px]"
        >
          ← Edit campaign brief
        </Link>
      </div>
      <div className="grid grid-cols-[280px_1fr] mobile:grid-cols-1 gap-[20px]">
        <div className="flex flex-col gap-[8px]">
          <Button
            onClick={() => {
              setSelectedIdeaId(null);
              setSelectedVariantId(null);
            }}
          >
            New manual idea
          </Button>
          {ideas.map((idea) => (
            <button
              key={idea.id}
              onClick={() => {
                setSelectedIdeaId(idea.id);
                setSelectedVariantId(null);
              }}
              className={`text-start border rounded-[10px] p-[14px] cursor-pointer ${
                selectedIdeaId === idea.id
                  ? 'border-forth bg-newBgColorInner'
                  : 'border-newTableBorder'
              }`}
            >
              <div className="font-[600]">{idea.title}</div>
              <div className="text-[12px] text-customColor18 mt-[4px]">
                {idea.status} · {idea.variants?.length || 0} variants
              </div>
            </button>
          ))}
          {!ideas.length && <EmptyState>No campaign ideas yet.</EmptyState>}
        </div>
        <div className="flex flex-col gap-[20px]">
          <IdeaEditor
            campaignId={campaign.id}
            record={selectedIdea}
            onSaved={async (idea) => {
              setSelectedIdeaId(idea.id);
              await reload();
            }}
          />
          {selectedIdea && (
            <>
              <Button secondary onClick={archiveIdea} className="self-start">
                Archive idea
              </Button>
              <div className="border-t border-newTableBorder pt-[20px]">
                <div className="text-[20px] font-[600] mb-[12px]">
                  Platform variants
                </div>
                <div className="flex flex-wrap gap-[8px] mb-[16px]">
                  <Button onClick={() => setSelectedVariantId(null)}>
                    New manual variant
                  </Button>
                  {variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`border rounded-[8px] px-[12px] py-[8px] text-[13px] ${
                        selectedVariantId === variant.id
                          ? 'border-forth bg-newBgColorInner'
                          : 'border-newTableBorder'
                      }`}
                    >
                      {variant.platform} · {variant.status}
                    </button>
                  ))}
                </div>
                <VariantEditor
                  ideaId={selectedIdea.id}
                  record={selectedVariant}
                  defaultPlatform={campaign.targetPlatforms[0] || 'instagram'}
                  onSaved={async (variant) => {
                    setSelectedVariantId(variant.id);
                    await reload();
                  }}
                />
                {selectedVariant && (
                  <div className="flex flex-wrap gap-[8px] mt-[12px]">
                    <Button onClick={() => decide('APPROVED')}>
                      Approve variant
                    </Button>
                    <Button secondary onClick={() => decide('REJECTED')}>
                      Reject variant
                    </Button>
                    <Button secondary onClick={archiveVariant}>
                      Archive variant
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AuthorStudioShell>
  );
}

function IdeaEditor({
  campaignId,
  record,
  onSaved,
}: {
  campaignId: string;
  record?: CampaignIdeaRecord;
  onSaved: (record: CampaignIdeaRecord) => Promise<void>;
}) {
  const fetch = useFetch();
  const toast = useToaster();
  const values = useMemo<IdeaForm>(
    () => ({
      title: record?.title || '',
      coreConcept: record?.coreConcept || '',
      hook: record?.hook || '',
      creativeDirection: record?.creativeDirection || '',
      callToAction: record?.callToAction || '',
      sourceRationale: objectToLines(record?.sourceRationale),
      status: record?.status || 'SHORTLISTED',
    }),
    [record]
  );
  const form = useForm<IdeaForm>({ values });
  const submit = form.handleSubmit(async (input) => {
    try {
      const saved = await readApiResponse<CampaignIdeaRecord>(
        await fetch(
          record
            ? `/author-studio/campaign-ideas/${record.id}`
            : `/author-studio/campaigns/${campaignId}/ideas`,
          {
            method: record ? 'PUT' : 'POST',
            body: JSON.stringify({
              ...input,
              sourceRationale: linesToObject(input.sourceRationale),
            }),
          }
        )
      );
      await onSaved(saved);
      toast.show(record ? 'Idea updated' : 'Manual idea created', 'success');
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
          {record ? 'Campaign idea' : 'Create a manual idea'}
        </div>
        <Input label="Title" name="title" required />
        <Textarea label="Core concept" name="coreConcept" required />
        <Textarea label="Hook" name="hook" required />
        <Textarea label="Creative direction" name="creativeDirection" />
        <Textarea label="Call to action" name="callToAction" />
        <Textarea
          label="Source rationale (key: value per line)"
          name="sourceRationale"
        />
        <Select label="Idea status" name="status">
          <option value="SHORTLISTED">SHORTLISTED</option>
          <option value="REJECTED">REJECTED</option>
        </Select>
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          className="self-start"
        >
          Save idea
        </Button>
      </form>
    </FormProvider>
  );
}

function VariantEditor({
  ideaId,
  record,
  defaultPlatform,
  onSaved,
}: {
  ideaId: string;
  record?: CampaignVariantRecord;
  defaultPlatform: string;
  onSaved: (record: CampaignVariantRecord) => Promise<void>;
}) {
  const fetch = useFetch();
  const toast = useToaster();
  const values = useMemo<VariantForm>(
    () => ({
      platform: record?.platform || defaultPlatform,
      format: record?.format || 'TEXT',
      headline: record?.headline || '',
      content: record?.content || '',
      callToAction: record?.callToAction || '',
      hashtags: arrayToLines(record?.hashtags),
      mediaBrief: objectToLines(record?.mediaBrief),
      platformSettings: objectToLines(record?.platformSettings),
    }),
    [record, defaultPlatform]
  );
  const form = useForm<VariantForm>({ values });
  const submit = form.handleSubmit(async (input) => {
    try {
      const saved = await readApiResponse<CampaignVariantRecord>(
        await fetch(
          record
            ? `/author-studio/campaign-variants/${record.id}`
            : `/author-studio/campaign-ideas/${ideaId}/variants`,
          {
            method: record ? 'PUT' : 'POST',
            body: JSON.stringify({
              ...input,
              hashtags: linesToArray(input.hashtags),
              mediaBrief: linesToObject(input.mediaBrief),
              platformSettings: linesToObject(input.platformSettings),
            }),
          }
        )
      );
      await onSaved(saved);
      toast.show(
        record ? 'Variant updated' : 'Manual variant created',
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
        <div className="flex items-center justify-between gap-[8px]">
          <div className="text-[18px] font-[600]">
            {record ? 'Edit platform variant' : 'Create a manual variant'}
          </div>
          {record && (
            <span className="text-[12px] border border-newTableBorder rounded-full px-[10px] py-[4px]">
              {record.status}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 mobile:grid-cols-1 gap-[12px]">
          <Select label="Platform" name="platform" required>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </Select>
          <Select label="Format" name="format" required>
            {[
              'TEXT',
              'IMAGE_POST',
              'CAROUSEL',
              'SHORT_VIDEO',
              'STORY',
              'THREAD',
              'PIN',
            ].map((format) => (
              <option key={format} value={format}>
                {format.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>
        <Input label="Headline" name="headline" />
        <Textarea label="Content" name="content" required />
        <Input label="Call to action" name="callToAction" />
        <Textarea label="Hashtags (one per line)" name="hashtags" />
        <Textarea label="Media brief (key: value per line)" name="mediaBrief" />
        <Textarea
          label="Platform settings (key: value per line)"
          name="platformSettings"
        />
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          className="self-start"
        >
          Save variant
        </Button>
      </form>
    </FormProvider>
  );
}
