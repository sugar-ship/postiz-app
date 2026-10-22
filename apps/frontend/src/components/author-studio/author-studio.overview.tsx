'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { AuthorStudioShell } from './author-studio.shell';
import { readApiResponse } from './author-studio.utils';

const resources = [
  { key: 'pen-names', label: 'Pen Names', href: '/author-studio/pen-names' },
  { key: 'books', label: 'Books', href: '/author-studio/books' },
  { key: 'series', label: 'Series', href: '/author-studio/books' },
  {
    key: 'content-pillars',
    label: 'Content Pillars',
    href: '/author-studio/content-pillars',
  },
  {
    key: 'audience-angles',
    label: 'Audience Angles',
    href: '/author-studio/audience-angles',
  },
];

export function AuthorStudioOverview() {
  const fetch = useFetch();
  const { data = {} } = useSWR('author-studio-overview', async () => {
    const entries = await Promise.all(
      resources.map(async ({ key }) => [
        key,
        await readApiResponse<unknown[]>(await fetch(`/author-studio/${key}`)),
      ])
    );
    return Object.fromEntries(entries) as Record<string, unknown[]>;
  });

  return (
    <AuthorStudioShell
      active="overview"
      title="Author Studio"
      description="Manage the author identity, catalogue, voice, and reusable marketing foundations for this organization."
    >
      <div className="grid grid-cols-3 mobile:grid-cols-1 gap-[16px]">
        {resources.map((resource) => (
          <Link
            href={resource.href}
            key={resource.key}
            className="bg-newBgColorInner border border-newTableBorder rounded-[12px] p-[20px] hover:border-forth"
          >
            <div className="text-[14px] text-customColor18">
              {resource.label}
            </div>
            <div className="text-[32px] font-[700] mt-[8px]">
              {data[resource.key]?.length ?? '—'}
            </div>
          </Link>
        ))}
      </div>
      <div className="bg-newBgColorInner border border-newTableBorder rounded-[12px] p-[20px]">
        Campaign planning and AI generation are intentionally unavailable in
        Milestone 1.
      </div>
    </AuthorStudioShell>
  );
}
