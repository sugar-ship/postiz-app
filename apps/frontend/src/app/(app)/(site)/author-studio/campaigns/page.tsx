import { Metadata } from 'next';
import { requireAuthorStudio } from '@gitroom/frontend/components/author-studio/author-studio.feature';
import { CampaignsComponent } from '@gitroom/frontend/components/author-studio/campaigns.component';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Author Studio · Campaigns' };

export default function CampaignsPage() {
  requireAuthorStudio();
  return <CampaignsComponent />;
}
