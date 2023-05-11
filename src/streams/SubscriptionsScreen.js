/* @flow strict-local */

import React, { useCallback, useMemo, useState } from 'react';
import type { Node } from 'react';
import { View, SectionList, Text, FlatList } from 'react-native';

// eslint-disable-next-line import/no-extraneous-dependencies
import Collapsible from 'react-native-collapsible';
import { useNavigation } from '../react-navigation';
import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import type { Subscription } from '../types';
import { createStyleSheet } from '../styles';
import { useDispatch, useSelector } from '../react-redux';
import LoadingBanner from '../common/LoadingBanner';
import SectionSeparatorBetween from '../common/SectionSeparatorBetween';
import SearchEmptyState from '../common/SearchEmptyState';
import { streamNarrow, topicNarrow } from '../utils/narrow';
import { getTopicsForStream, getUnreadByStream } from '../selectors';
import { getSubscriptions } from '../directSelectors';
import { doNarrow, fetchTopics } from '../actions';
import { caseInsensitiveCompareFunc } from '../utils/misc';
import StreamItem from './StreamItem';
import ModalNavBar from '../nav/ModalNavBar';
import NavRow from '../common/NavRow';
import Touchable from '../common/Touchable';

const styles = createStyleSheet({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  list: {
    flex: 1,
    flexDirection: 'column',
  },
});

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'subscribed'>,
  route: RouteProp<'subscribed', void>,
|}>;

type FooterProps = $ReadOnly<{||}>;

function AllStreamsButton(props: FooterProps): Node {
  const navigation = useNavigation();
  const handlePressAllScreens = useCallback(() => {
    navigation.push('all-streams');
  }, [navigation]);

  return <NavRow title="All streams" titleBoldUppercase onPress={handlePressAllScreens} />;
}

function ListTopicByStream(topic, navigation, streamId): Node {
  return (
    <View>
      <Touchable onPress={() => navigation.push('chat', { narrow: topicNarrow(streamId, topic.name), editMessage: null })} style={{ paddingLeft: 40, paddingVertical: 8 }}>
        <Text style={{ color: 'grey', fontSize: 14 }}>{topic.name}</Text>
      </Touchable>
    </View>
  );
}

function ListStreamSubscriptions({ item }: { item: Subscription, ... }) {
  const [listIdStreamExpanded, setListIdStreamExpanded] = useState([]);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const unreadByStream = useSelector(getUnreadByStream);
  const handleNarrow = useCallback(
      stream => dispatch(doNarrow(streamNarrow(stream.stream_id))),
      [dispatch],
  );
  const collapsed = listIdStreamExpanded.indexOf(item.stream_id) < 0;
  const handlePressStream = useCallback(
      stream => setListIdStreamExpanded(collapsed ? [...listIdStreamExpanded, stream.stream_id] : [...(listIdStreamExpanded.filter(e => e !== stream.stream_id))]),
      [collapsed, listIdStreamExpanded, setListIdStreamExpanded],
  );
  const topics = useSelector(state => getTopicsForStream(state, item.stream_id));
  const streamId = item.stream_id;
  return (
    <View>
      <StreamItem
        streamId={item.stream_id}
        name={item.name}
        iconSize={16}
        isPrivate={item.invite_only}
        isWebPublic={item.is_web_public}
        description=""
        color={item.color}
        unreadCount={unreadByStream[item.stream_id]}
        isMuted={item.in_home_view === false} // if 'undefined' is not muted
        offersSubscribeButton={false}
          // isSubscribed is ignored when offersSubscribeButton false
        onPress={handlePressStream}
        showButtonAllTopics
        onPressAllMessage={() => handleNarrow(item)}
      />
      <Collapsible collapsed={collapsed} renderChildrenCollapsed={false}>
        <FlatList
          initialNumToRender={20}
          data={topics}
          keyExtractor={topic => topic.max_id.toString()}
          renderItem={({ item }) => ListTopicByStream(item, navigation, streamId)}
        />
      </Collapsible>
    </View>
  );
}

export default function SubscriptionsScreen(props: Props): Node {
  const dispatch = useDispatch();
  const subscriptions = useSelector(getSubscriptions);
  const unreadByStream = useSelector(getUnreadByStream);
  const sortedSubscriptions = subscriptions
      .slice()
      .sort((a, b) => caseInsensitiveCompareFunc(a.name, b.name));
  const sections = useMemo(() => [
      { key: 'Pinned', data: sortedSubscriptions.filter(x => x.pin_to_top) },
      { key: 'Unpinned', data: sortedSubscriptions.filter(x => !x.pin_to_top) },
    ], [sortedSubscriptions]);

  sortedSubscriptions.map(streamItem => dispatch(fetchTopics(streamItem.stream_id)));

  return (
    <View style={styles.container}>
      {/* Consumes the top inset. */}
      <ModalNavBar canGoBack={false} title="Streams" />
      <LoadingBanner />
      {subscriptions.length === 0 ? (
        <SearchEmptyState text="No streams found" />
      ) : (
        <SectionList
          style={styles.list}
          sections={sections}
          extraData={unreadByStream}
          initialNumToRender={20}
          keyExtractor={item => item.stream_id}
          renderItem={({ item }) => ListStreamSubscriptions({ item })}
          SectionSeparatorComponent={SectionSeparatorBetween}
          ListFooterComponent={AllStreamsButton}
        />
      )}
    </View>
  );
}
