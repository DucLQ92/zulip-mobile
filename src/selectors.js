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

  // Nếu có activeAccountState và có loginAccountInfo trong session
  if (activeAccountState && activeAccountState.session.loginAccountInfo) {
    return activeAccountState.session.loginAccountInfo;
  }

  // Fallback: lấy từ account info nếu có accounts và apiKey
  const accounts = state.accounts;
  if (accounts.length > 0 && accounts[0].apiKey !== '') {
    return {
      realm: accounts[0].realm.toString(),
      email: accounts[0].email,
    };
  }

  return null;
};
