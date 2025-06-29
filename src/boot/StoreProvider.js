/* @flow strict-local */
import React, { useEffect } from 'react';
import type { Node } from 'react';

import type { Dispatch } from '../reduxTypes';
import { observeStore } from '../redux';
import { Provider } from '../react-redux';
import * as logging from '../utils/logging';
import { getHasAuth, getAccount, tryGetActiveAccountState } from '../selectors';
import store, { restore } from './store';
import { registerAndStartPolling } from '../events/eventActions';
import { sendOutbox } from '../outbox/outboxActions';
import { initNotifications } from '../notification/notifTokens';
import { resetAccountData } from '../account/logoutActions';

type Props = $ReadOnly<{|
  children: Node,
|}>;

export default function StoreProvider(props: Props): Node {
  useEffect(
    () =>
      observeStore(
        store,
        // onChange will fire when this value changes
        state => {
          const perAccountState = tryGetActiveAccountState(state);
          if (!perAccountState) {
            return undefined;
          }
          return getAccount(perAccountState).zulipVersion;
        },
        zulipVersion => {
          // TODO(#5005): This is for the *active* account; that may not be
          //   the one a given piece of code is working with!
          //
          // On fetch, we'll have called this already before entering the
          // reducers, so this will be redundant.  But on switching accounts,
          // this is the call that will make the change.
          logging.setTagsFromServerVersion(zulipVersion);
        },
      ),
    [],
  );

  useEffect(() => {
    restore(() => {
      (async () => {
        try {
          const hasAuth = getHasAuth(store.getState());

          // The `store` type isn't complete: it ignores thunk actions, etc.
          // $FlowFixMe[incompatible-type]
          const dispatch: Dispatch = store.dispatch;

          // Init right away if there's an active, logged-in account.
          // NB `getInitialRouteInfo` depends intimately on this behavior.
          if (hasAuth) {
            // Clear server data cũ để force hiển thị FullScreenLoading với thông tin tài khoản
            dispatch(resetAccountData());

            await dispatch(registerAndStartPolling());

            // TODO(#3881): Lots of issues with outbox sending
            dispatch(sendOutbox());

            dispatch(initNotifications());
          }
        } catch (error) {
          // Handle unhandled promise rejections from registerAndStartPolling
          // Log error để debug
          logging.error('StoreProvider: Error during initial setup', { error });

          // Không cần làm gì thêm vì registerAndStartPolling đã handle lỗi internally
          // (dispatch registerAbort, hiển thị error alert, navigate về AccountPickScreen)
        }
      })();
    });
  }, []);

  return <Provider store={store}>{props.children}</Provider>;
}
