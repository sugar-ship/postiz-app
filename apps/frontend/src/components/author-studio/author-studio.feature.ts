import 'server-only';
import { notFound } from 'next/navigation';

export function requireAuthorStudio() {
  if (process.env.AUTHOR_STUDIO_ENABLED !== 'true') notFound();
}
