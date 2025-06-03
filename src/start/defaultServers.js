/* @flow strict-local */
import type { Server } from '../types';

export const defaultServers: Server[] = [
  {
    id: 'nextpay',
    name: 'NextPay',
    url: 'https://talk.nextpay.vn',
    isDefault: true,
  },
  {
    id: 'dev-nextpay',
    name: 'NextPay Dev',
    url: 'https://dev-talk.nextpay.vn',
    isDefault: true,
  },
];
