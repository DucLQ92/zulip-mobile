/* @flow strict-local */

import React, { useCallback, useMemo, useState } from 'react';
import type { Node } from 'react';
import { FlatList, Platform, View } from 'react-native';

import removeAccents from 'remove-accents';
import Screen from '../common/Screen';
import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import { createStyleSheet, HIGHLIGHT_COLOR } from '../styles';
import { useDispatch, useSelector } from '../react-redux';
import ZulipButton from '../common/ZulipButton';
import SearchEmptyState from '../common/SearchEmptyState';
import * as api from '../api';
import { delay } from '../utils/async';
import { streamNarrow } from '../utils/narrow';
import { getAuth, getCanCreateStreams, getStreams } from '../selectors';
import { doNarrow } from '../actions';
import { caseInsensitiveCompareFunc } from '../utils/misc';
import StreamItem from '../streams/StreamItem';
import { getSubscriptionsById } from './subscriptionSelectors';
import { IconSearch } from '../common/Icons';
import Input from '../common/Input';

const styles = createStyleSheet({
  button: {
    margin: 16,
  },
  list: {
    flex: 1,
    flexDirection: 'column',
  },
});

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'all-streams'>,
  route: RouteProp<'all-streams', void>,
|}>;

export default function StreamListScreen(props: Props): Node {
  const { navigation } = props;
  const dispatch = useDispatch();
  const auth = useSelector(getAuth);
  const canCreateStreams = useSelector(getCanCreateStreams);
  const subscriptions = useSelector(getSubscriptionsById);
  const streams = useSelector(getStreams);
  const [filterStreamText, setFilterStreamText] = useState<string>('');

  const sortedStreams = useMemo(
    () => streams.slice().sort((a, b) => caseInsensitiveCompareFunc(a.name, b.name)),
    [streams],
  );

  const filteredStreams = filterStreamText.trim() === '' ? sortedStreams : sortedStreams.filter(s => removeAccents(s.name).toUpperCase().indexOf(removeAccents(filterStreamText.trim()).toUpperCase()) > -1);

  const handleSubscribeButtonPressed = useCallback(
    (stream, value: boolean) => {
      if (value) {
        // This still uses a stream name (#3918) because the API method does; see there.
        api.subscriptionAdd(auth, [{ name: stream.name }]);
      } else {
        // This still uses a stream name (#3918) because the API method does; see there.
        api.subscriptionRemove(auth, [stream.name]);
      }
    },
    [auth],
  );

  const handleNarrow = useCallback(
    stream => dispatch(doNarrow(streamNarrow(stream.stream_id))),
    [dispatch],
  );

  return (
    <Screen scrollEnabled={false} title="All streams">
      {canCreateStreams && (
        <ZulipButton
          style={styles.button}
          secondary
          text="Create new stream"
          onPress={() =>
            delay(() => {
              navigation.push('create-stream');
            })
          }
        />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 8 }}>
        <IconSearch style={{ marginLeft: 4, marginRight: Platform.OS === 'ios' ? 4 : 0 }} size={24} color={HIGHLIGHT_COLOR} />
        <Input
          style={{ flex: 1, fontSize: 16 }}
          placeholder="Filter streams"
          defaultValue=""
          onChangeText={setFilterStreamText}
          returnKeyType="done"
          placeholderTextColor={HIGHLIGHT_COLOR}
          underlineColorAndroid={HIGHLIGHT_COLOR}
        />
      </View>
      {streams.length === 0 ? (
        <SearchEmptyState text="No streams found" />
      ) : (
        <FlatList
          style={styles.list}
          data={filteredStreams}
          initialNumToRender={20}
          keyExtractor={item => item.stream_id.toString()}
          renderItem={({ item }) => (
            <StreamItem
              streamId={item.stream_id}
              name={item.name}
              iconSize={16}
              isPrivate={item.invite_only}
              isWebPublic={item.is_web_public}
              description={item.description}
              color={
                /* Even if the user happens to be subscribed to this stream,
                   we don't show their subscription color. */
                undefined
              }
              unreadCount={undefined}
              isMuted={
                /* This stream may in reality be muted.
                   But in this UI, we don't show that distinction. */
                false
              }
              offersSubscribeButton
              isSubscribed={subscriptions.has(item.stream_id)}
              onPress={handleNarrow}
              onSubscribeButtonPressed={handleSubscribeButtonPressed}
            />
          )}
        />
      )}
    </Screen>
  );
}
