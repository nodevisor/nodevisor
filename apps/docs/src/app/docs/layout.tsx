import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: 'Nodevisor Docs',
        url: '/docs',
      }}
      links={[
        {
          text: 'GitHub',
          url: 'https://github.com/nodevisor/nodevisor',
          active: 'nested-url',
        },
        {
          text: 'npm',
          url: 'https://www.npmjs.com/package/nodevisor',
          active: 'nested-url',
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
