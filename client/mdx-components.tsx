import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { APIPage } from '@/components/api-page';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    APIPage,
    Tab,
    Tabs,
    ...components,
  };
}
