import { Metadata } from 'next';
import { AuthorStudioOverview } from '@gitroom/frontend/components/author-studio/author-studio.overview';
import { requireAuthorStudio } from '@gitroom/frontend/components/author-studio/author-studio.feature';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Postiz Author Studio' };

export default function AuthorStudioPage() {
  requireAuthorStudio();
  return <AuthorStudioOverview />;
}
