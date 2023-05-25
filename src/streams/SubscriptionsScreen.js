/* @flow strict-local */

import React, { useCallback, useContext, useState } from 'react';
import type { Node } from 'react';
import { View, SectionList, Text, FlatList, TouchableOpacity } from 'react-native';

// eslint-disable-next-line import/no-extraneous-dependencies
import Collapsible from 'react-native-collapsible';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from '../react-navigation';
import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import type { Subscription } from '../types';
import { BRAND_COLOR, createStyleSheet, HIGHLIGHT_COLOR } from '../styles';
import { useDispatch, useSelector } from '../react-redux';
import LoadingBanner from '../common/LoadingBanner';
import SearchEmptyState from '../common/SearchEmptyState';
import { streamNarrow, topicNarrow } from '../utils/narrow';
import {
    getAuth, getFlags, getOwnUser, getStreamsById, getSubscriptionsById,
    getTopicsAll,
    getUnreadByStream, getZulipFeatureLevel,
} from '../selectors';
import { getSubscriptions } from '../directSelectors';
import { doNarrow, fetchTopics } from '../actions';
import StreamItem from './StreamItem';
import ModalNavBar from '../nav/ModalNavBar';
import NavRow from '../common/NavRow';
import Touchable from '../common/Touchable';
import ZulipTextIntl from '../common/ZulipTextIntl';
import UnreadCount from '../common/UnreadCount';
import { showTopicActionSheet } from '../action-sheets';
import type { ShowActionSheetWithOptions } from '../action-sheets';
import { TranslationContext } from '../boot/TranslationProvider';
import { getMute } from '../mute/muteModel';
import { getUnread } from '../unread/unreadModel';
import { getOwnUserRole } from '../permissionSelectors';

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

function ListTopicByStream(topic, navigation, streamId, showActionSheetWithOptions, dispatch, context, backgroundData): Node {
  return (
    <View>
      <Touchable
        onPress={() => navigation.push('chat', { narrow: topicNarrow(streamId, topic.name), editMessage: null })}
        style={{ paddingLeft: 40, paddingVertical: 8 }}
        onLongPress={() => {
          showTopicActionSheet({
              showActionSheetWithOptions,
              callbacks: { dispatch, navigation, _: context },
              backgroundData,
              streamId,
              topic: topic.name,
          });
      }}
      >
        <View style={{ flexDirection: 'row', paddingRight: 16 }}>
          <Text style={{ color: topic.isMuted ? 'gainsboro' : 'grey', fontSize: 14, flex: 1, marginLeft: topic.name.indexOf('✔') === 0 ? 0 : 16 }}>{topic.name}</Text>
          <UnreadCount color={BRAND_COLOR} count={topic.unreadCount} />
        </View>
      </Touchable>
    </View>
  );
}

function ListStreamSubscriptions({ item, listIdStreamExpanded, setListIdStreamExpanded, listIdStreamShowedMore, setListIdStreamShowedMore }: { item: Subscription, ... }) {
  const showLessCountItem = 3;
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const unreadByStream = useSelector(getUnreadByStream);
  const handleNarrow = useCallback(
      stream => dispatch(doNarrow(streamNarrow(stream.stream_id))),
      [dispatch],
  );
  const streamId = item.stream_id;
  const streamColor = item.color;
  const collapsed = listIdStreamExpanded.indexOf(streamId) < 0;
  const handlePressStream = useCallback(
      stream => {
          if (collapsed) {
              dispatch(fetchTopics(stream.stream_id));
          }
          setListIdStreamExpanded(collapsed ? [...listIdStreamExpanded, stream.stream_id] : [...(listIdStreamExpanded.filter(e => e !== stream.stream_id))]);
      },
      [collapsed, dispatch, listIdStreamExpanded, setListIdStreamExpanded],
  );

    const showActionSheetWithOptions: ShowActionSheetWithOptions =
        useActionSheet().showActionSheetWithOptions;
    const context = useContext(TranslationContext);
    const backgroundData = useSelector(state => ({
        auth: getAuth(state),
        mute: getMute(state),
        streams: getStreamsById(state),
        subscriptions: getSubscriptionsById(state),
        unread: getUnread(state),
        ownUser: getOwnUser(state),
        ownUserRole: getOwnUserRole(state),
        flags: getFlags(state),
        zulipFeatureLevel: getZulipFeatureLevel(state),
        showRenameTopic: false,
    }));
  const topics = item.topics;
  const showedMoreFeatureShow = (item.topics ?? []).length > showLessCountItem;
  const showedMore = listIdStreamShowedMore.indexOf(streamId) > -1;
    const handlePressShowedMore = useCallback(
        streamIdShowedMore => {
            setListIdStreamShowedMore(!showedMore ? [...listIdStreamShowedMore, streamIdShowedMore] : [...(listIdStreamShowedMore.filter(e => e !== streamIdShowedMore))]);
        },
        [listIdStreamShowedMore, setListIdStreamShowedMore, showedMore],
    );
    let topicsShow;
    if (!showedMoreFeatureShow || showedMore) {
        topicsShow = topics;
    } else {
        topicsShow = topics.slice(0, showLessCountItem);
    }
  return (
    <View>
      <StreamItem
        streamId={streamId}
        name={item.name}
        iconSize={16}
        isPrivate={item.invite_only}
        isWebPublic={item.is_web_public}
        description=""
        color={streamColor}
        unreadCount={unreadByStream[streamId]}
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
          data={topicsShow}
          keyExtractor={topic => topic.max_id.toString()}
          renderItem={({ item }) => ListTopicByStream(item, navigation, streamId, showActionSheetWithOptions, dispatch, context, backgroundData)}
          ListFooterComponent={(
            <View style={{ marginBottom: 8, marginHorizontal: 40 }}>
              {showedMoreFeatureShow ? (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}
                  onPress={() => handlePressShowedMore(streamId)}
                >
                  <Text style={{
                            color: streamColor,
                            fontSize: 18,
                            fontWeight: 'bold',
                        }}
                  >
                    {'-  '}
                  </Text>
                  <ZulipTextIntl
                    style={{
                                color: streamColor,
                                fontSize: 14,
                            }}
                    text={!showedMore ? 'Show more' : 'Show less'}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  />
                </TouchableOpacity>
                ) : <View />}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}
                onPress={() => {
                          navigation.push('create-topic', { 'isEdit': false, 'streamId': streamId, 'topic': null });
                      }}
              >
                <Text style={{
                          color: streamColor,
                          fontSize: 18,
                          fontWeight: 'bold',
                      }}
                >
                  {'+ '}
                </Text>
                <ZulipTextIntl
                  style={{
                              color: streamColor,
                              fontSize: 14,
                          }}
                  text="New topic"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                />
              </TouchableOpacity>
            </View>
          )}
        />
      </Collapsible>
    </View>
  );
}

export default function SubscriptionsScreen(props: Props): Node {
  const dispatch = useDispatch();
  const subscriptions = useSelector(getSubscriptions);
  const unreadByStream = useSelector(getUnreadByStream);
  // const sortedSubscriptions = subscriptions
  //     .slice()
  //     .sort((a, b) => caseInsensitiveCompareFunc(a.name, b.name));

    const allTopics = useSelector(state => getTopicsAll(state));
    for (let i = 0; i < subscriptions.length; i++) {
        const topics = allTopics[subscriptions[i].stream_id] ?? [];
        subscriptions[i].topics = topics;
        const topicWithLastMessage = (topics ?? []).length ? topics.reduce((prev, current) => (prev.max_id > current.max_id) ? prev : current) : null;
        if (topicWithLastMessage) {
            subscriptions[i].last_message_id = topicWithLastMessage.max_id;
        }
    }

    // const sortedSubscriptions = subscriptions
    //     .slice()
    //     .sort((a, b) => b.last_message_id - a.last_message_id);
    // shorting before grouping error when build release

    const sections = [
        { key: 'Pinned',
            data: subscriptions.filter(x => x.pin_to_top).slice()
                .sort((a, b) => (b.last_message_id ?? -1) - (a.last_message_id ?? -1)) },
        { key: 'Other',
            data: subscriptions.filter(x => !x.pin_to_top).slice()
                .sort((a, b) => (b.last_message_id ?? -1) - (a.last_message_id ?? -1)) },
    ];

    if (!Object.keys(allTopics).length) {
        subscriptions.map(streamItem => dispatch(fetchTopics(streamItem.stream_id)));
    }
    const [listIdStreamExpanded, setListIdStreamExpanded] = useState([]);
    const [listIdStreamShowedMore, setListIdStreamShowedMore] = useState([]);

  return (
    <View style={styles.container}>
      {/* Consumes the top inset. */}
      <ModalNavBar
        canGoBack={false}
        title="Streams"
        rightView={(listIdStreamExpanded ?? []).length
          ? (
            <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 2, paddingHorizontal: 8 }} onPress={() => setListIdStreamExpanded([])}>
              <ZulipTextIntl
                style={{
                  color: HIGHLIGHT_COLOR,
                  fontSize: 14,
                }}
                text="Collapse all"
                numberOfLines={1}
                ellipsizeMode="tail"
              />
            </TouchableOpacity>
            ) : <View />
        }
      />
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
          renderItem={({ item }) => ListStreamSubscriptions({ item, listIdStreamExpanded, setListIdStreamExpanded, listIdStreamShowedMore, setListIdStreamShowedMore })}
          // SectionSeparatorComponent={SectionSeparatorBetween}
          ListFooterComponent={AllStreamsButton}
          renderSectionHeader={({ section: { key } }) => (
            <View style={{ paddingVertical: 6, paddingHorizontal: 8, backgroundColor: HIGHLIGHT_COLOR }}>
              <ZulipTextIntl style={{ color: 'black', fontSize: 14 }} text={key} />
            </View>
          )}
        />
      )}
    </View>
  );
}
