import { Metadata } from 'next';
import { requireAuthorStudio } from '@gitroom/frontend/components/author-studio/author-studio.feature';
import { PenNamesComponent } from '@gitroom/frontend/components/author-studio/pen-names.component';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Author Studio · Pen Names' };

export default function PenNamesPage() {
  requireAuthorStudio();
  return <PenNamesComponent />;
}
