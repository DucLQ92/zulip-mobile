/* @flow strict-local */
import type { Auth, ApiResponseSuccess } from '../transportTypes';
import { apiGet } from '../apiFetch';

type ApiResponseStreamsSubscribers = {|
  ...$Exact<ApiResponseSuccess>,
  subscribers: $ReadOnlyArray<number>,
|};

/** See https://zulip.com/api/get-subscribers */
export default async (auth: Auth, streamId: string): Promise<ApiResponseStreamsSubscribers> => apiGet(auth, `streams/${streamId}/members`);
