import { Metadata } from 'next';
import { requireAuthorStudio } from '@gitroom/frontend/components/author-studio/author-studio.feature';
import { CampaignPlannerComponent } from '@gitroom/frontend/components/author-studio/campaigns.component';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Author Studio · Campaign planner' };

export default async function CampaignPlannerPage({
  params,
}: PageProps<'/author-studio/campaigns/[id]'>) {
  requireAuthorStudio();
  const { id } = await params;
  return <CampaignPlannerComponent campaignId={id} />;
}
