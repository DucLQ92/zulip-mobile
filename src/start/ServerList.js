/* @flow strict-local */
import React from 'react';
import { View, FlatList } from 'react-native';
import type { Node } from 'react';

import type { Server } from '../types';
import { createStyleSheet } from '../styles';
import ServerItem from './ServerItem';
import ViewPlaceholder from '../common/ViewPlaceholder';
import ZulipTextIntl from '../common/ZulipTextIntl';

type Props = $ReadOnly<{|
  servers: Server[],
  onSelectServer: (server: Server) => void,
|}>;

const styles = createStyleSheet({
  container: {

  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {

  },
});

export default function ServerList(props: Props): Node {
  const { servers, onSelectServer } = props;

  return (
    <View style={styles.container}>
      <ZulipTextIntl
        style={styles.title}
        text="Select server"
      />
      <FlatList
        data={servers}
        renderItem={({ item }) => (
          <ServerItem server={item} onSelect={onSelectServer} />
        )}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <ViewPlaceholder height={8} />}
        style={styles.list}
      />
    </View>
  );
}
