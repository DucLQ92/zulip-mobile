/* @flow strict-local */
import React from 'react';
import type { Node } from 'react';
import { View, FlatList } from 'react-native';

import ViewPlaceholder from '../common/ViewPlaceholder';
import AccountItem from './AccountItem';
import type { AccountStatus } from './AccountPickScreen';

type Props = $ReadOnly<{|
  accountStatuses: $ReadOnlyArray<AccountStatus>,
  onAccountSelect: AccountStatus => Promise<void> | void,
  onAccountRemove: AccountStatus => Promise<void> | void,
|}>;

export default function AccountList(props: Props): Node {
  const { accountStatuses, onAccountSelect, onAccountRemove } = props;

  // Safety check: handle invalid data
  if (!Array.isArray(accountStatuses)) {
    return <View />;
  }

  if (accountStatuses.length === 0) {
    return <View />;
  }

  return (
    <View>
      <FlatList
        data={accountStatuses}
        keyExtractor={item => `${item.email}${item.realm.toString()}`}
        ItemSeparatorComponent={() => <ViewPlaceholder height={8} />}
        renderItem={({ item }) => (
          <AccountItem account={item} onSelect={onAccountSelect} onRemove={onAccountRemove} />
        )}
      />
    </View>
  );
}
