import { Home } from '@/components/Home';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({ locale: 'fa' });

export default function Page() {
  return <Home locale="fa" />;
}
