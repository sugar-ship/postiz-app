import { Metadata } from 'next';
import { requireAuthorStudio } from '@gitroom/frontend/components/author-studio/author-studio.feature';
import { AudienceAnglesComponent } from '@gitroom/frontend/components/author-studio/taxonomy.component';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Author Studio · Audience Angles' };

export default function AudienceAnglesPage() {
  requireAuthorStudio();
  return <AudienceAnglesComponent />;
}
