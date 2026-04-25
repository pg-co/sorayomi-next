import { createFileRoute } from '@tanstack/react-router';
import { ExtensionsPage } from '@/features/browse/extensions-page';

export const Route = createFileRoute('/browse/extensions/')({
  component: ExtensionsPage,
});
