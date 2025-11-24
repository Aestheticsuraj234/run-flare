import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Run Flare Logo"
            width={30}
            height={30}

          />
          <span className="font-bold">Run Flare</span>
        </div>
      ),
    },
  };
}
