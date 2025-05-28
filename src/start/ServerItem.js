/* @flow strict-local */
import React from 'react';
import type { Node } from 'react';
import { View } from 'react-native';

import type { Server } from '../types';
import { createStyleSheet, BRAND_COLOR } from '../styles';
import ZulipText from '../common/ZulipText';
import Touchable from '../common/Touchable';

type Props = $ReadOnly<{|
  server: Server,
  onSelect: Server => void,
|}>;

const styles = createStyleSheet({
  wrapper: {
    justifyContent: 'space-between',
  },
  serverItem: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: 'hsla(177, 70%, 47%, 0.1)',
  },
  details: {
    flex: 1,
  },
  text: {
    fontWeight: 'bold',
    marginVertical: 2,
    color: BRAND_COLOR,
  },
  url: {
    color: 'gray',
    marginVertical: 2,
  },
});

export default function ServerItem(props: Props): Node {
  const { server, onSelect } = props;
  const { name, url } = server;

  return (
    <Touchable style={styles.wrapper} onPress={() => onSelect(server)}>
      <View style={styles.serverItem}>
        <View style={styles.details}>
          <ZulipText style={styles.text} text={name} numberOfLines={1} />
          <ZulipText style={styles.url} text={url} numberOfLines={1} />
        </View>
      </View>
    </Touchable>
  );
}
