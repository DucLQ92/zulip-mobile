/* @flow strict-local */
import type { GlobalState } from './types';
import { tryGetActiveAccountState } from './account/accountsSelectors';

export * from './account/accountsSelectors';
export * from './pm-conversations/pmConversationsSelectors';
export * from './caughtup/caughtUpSelectors';
export * from './chat/narrowsSelectors';
export * from './chat/fetchingSelectors';
export * from './directSelectors';
export * from './emoji/emojiSelectors';
export * from './message/messageSelectors';
export * from './subscriptions/subscriptionSelectors';
export * from './topics/topicSelectors';
export * from './typing/typingSelectors';
export * from './unread/unreadSelectors';
export * from './users/userSelectors';

export const getGlobalLoginAccountInfo = (state: GlobalState): {| realm: string, email: string |} | null => {
  const activeAccountState = tryGetActiveAccountState(state);
  return activeAccountState ? activeAccountState.session.loginAccountInfo : null;
};
