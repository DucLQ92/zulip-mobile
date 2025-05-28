/* @flow strict-local */
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import type { Server } from '../types';
import { createStyleSheet } from '../styles';
import ZulipText from '../common/ZulipText';
import { Icon } from '../common/Icons';

type Props = $ReadOnly<{|
  server: Server,
  onSelect: (server: Server) => void,
  onDelete?: (serverId: string) => void,
|}>;

const styles = createStyleSheet({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  url: {
    fontSize: 14,
    opacity: 0.7,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
});

export default function ServerItem(props: Props): React$Node {
  const { server, onSelect, onDelete } = props;

  return (
    <TouchableOpacity style={styles.container} onPress={() => onSelect(server)} activeOpacity={0.8}>
      <View style={styles.content}>
        <ZulipText style={styles.name}>{server.name}</ZulipText>
        <ZulipText style={styles.url}>{server.url}</ZulipText>
      </View>
      {onDelete && (
      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(server.id)}>
        <Icon name="trash" size={20} color="red" />
      </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
