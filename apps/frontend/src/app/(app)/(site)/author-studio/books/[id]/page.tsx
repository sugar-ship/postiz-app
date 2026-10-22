import { Metadata } from 'next';
import { requireAuthorStudio } from '@gitroom/frontend/components/author-studio/author-studio.feature';
import { BooksComponent } from '@gitroom/frontend/components/author-studio/books.component';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Author Studio · Book' };

export default async function BookPage({
  params,
}: PageProps<'/author-studio/books/[id]'>) {
  requireAuthorStudio();
  const { id } = await params;
  return <BooksComponent initialBookId={id} />;
}
