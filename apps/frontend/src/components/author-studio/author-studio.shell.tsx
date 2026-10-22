'use client';

import Link from 'next/link';
import { FC, ReactNode } from 'react';
import clsx from 'clsx';

const sections = [
  { href: '/author-studio', label: 'Overview', key: 'overview' },
  { href: '/author-studio/pen-names', label: 'Pen Names', key: 'pen-names' },
  { href: '/author-studio/books', label: 'Books & Series', key: 'books' },
  {
    href: '/author-studio/content-pillars',
    label: 'Content Pillars',
    key: 'content-pillars',
  },
  {
    href: '/author-studio/audience-angles',
    label: 'Audience Angles',
    key: 'audience-angles',
  },
];

export const AuthorStudioShell: FC<{
  active: string;
  title: string;
  description: string;
  children: ReactNode;
}> = ({ active, title, description, children }) => (
  <div className="flex flex-col gap-[24px] p-[24px] mobile:p-[12px] w-full">
    <div>
      <div className="text-[28px] font-[700]">{title}</div>
      <div className="text-customColor18 mt-[4px]">{description}</div>
    </div>
    <nav className="flex gap-[8px] flex-wrap border-b border-newTableBorder pb-[12px]">
      {sections.map((section) => (
        <Link
          key={section.key}
          href={section.href}
          className={clsx(
            'px-[14px] py-[8px] rounded-[8px] text-[14px]',
            active === section.key
              ? 'bg-forth text-white'
              : 'bg-newBgColorInner hover:bg-newTableBorder'
          )}
        >
          {section.label}
        </Link>
      ))}
    </nav>
    {children}
  </div>
);

export const EmptyState: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="border border-dashed border-newTableBorder rounded-[12px] p-[32px] text-center text-customColor18">
    {children}
  </div>
);
