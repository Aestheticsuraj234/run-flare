import { openapi } from '@/lib/openapi';
import { createAPIPage } from 'fumadocs-openapi/ui';
import client from './api-page.client';

// When developing locally, point the API playground to the local worker
const defaultBaseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8787' : undefined;

export const APIPage = createAPIPage(openapi, {
  client,

});