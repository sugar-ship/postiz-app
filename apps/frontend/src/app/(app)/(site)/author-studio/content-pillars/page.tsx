import { Metadata } from 'next';
import { requireAuthorStudio } from '@gitroom/frontend/components/author-studio/author-studio.feature';
import { ContentPillarsComponent } from '@gitroom/frontend/components/author-studio/taxonomy.component';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Author Studio · Content Pillars' };

export default function ContentPillarsPage() {
  requireAuthorStudio();
  return <ContentPillarsComponent />;
}
