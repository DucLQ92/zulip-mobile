/* @flow strict-local */
import { createSelector } from 'reselect';

import type { MuteState, Narrow, Selector, TopicExtended, TopicsState } from '../types';
import { getTopics } from '../directSelectors';
import { getUnread, getUnreadCountForTopic } from '../unread/unreadModel';
import { NULL_ARRAY } from '../nullObjects';
import { isStreamNarrow, streamIdOfNarrow } from '../utils/narrow';
import { getMute, isTopicVisible } from '../mute/muteModel';
import { getSubscriptionsById } from '../subscriptions/subscriptionSelectors';
import { UserTopicVisibilityPolicy } from '../api/modelTypes';

export const getTopicsAll: Selector<Map> = createSelector(
    (state) => state.topics,
    state => getMute(state),
    state => getUnread(state),
    (topicState: TopicsState, mute: MuteState, unread) => {
        const result = {};
        Object.keys(topicState).forEach(topicStateKey => {
            const listTopics = topicState[topicStateKey];
            for (let i = 0; i < listTopics.length; i++) {
                listTopics[i].unreadCount = getUnreadCountForTopic(unread, listTopics[i].streamId, listTopics[i].name);
                listTopics[i].isMuted = mute.get(listTopics[i].streamId)?.get(listTopics[i].name) === UserTopicVisibilityPolicy.Muted;
            }
            result[topicStateKey] = topicState[topicStateKey];
        });
        // const unreadCount = getUnreadCountForTopic(unread, streamId, name);
        return result;
    },
);

export const getTopicsForNarrow: Selector<$ReadOnlyArray<string>, Narrow> = createSelector(
  (state, narrow) => narrow,
  state => getTopics(state),
  (narrow: Narrow, topics: TopicsState) => {
    if (!isStreamNarrow(narrow)) {
      return NULL_ARRAY;
    }
    const streamId = streamIdOfNarrow(narrow);

    if (!topics[streamId]) {
      return NULL_ARRAY;
    }
    return topics[streamId].map(x => x.name);
  },
);

export const getTopicsForStream: Selector<?$ReadOnlyArray<TopicExtended>, number> = createSelector(
  (state, streamId) => streamId,
  (state, streamId) => getTopics(state)[streamId],
  (state, streamId) => getSubscriptionsById(state).get(streamId),
  state => getMute(state),
  state => getUnread(state),
  (streamId, topicList, subscription, mute, unread) => {
    if (!topicList) {
      return undefined;
    }

    return topicList.map(({ name, max_id }): TopicExtended => {
      // prettier-ignore
      const isMuted = subscription
        ? !isTopicVisible(streamId, name, subscription, mute)
        // If we're looking at a stream the user isn't subscribed to, then
        // they won't see unreads from it even if they somehow have
        // individual topics set to unmuted.  So effectively it's all muted.
        : true;
      const unreadCount = getUnreadCountForTopic(unread, streamId, name);
      return { name, max_id, isMuted, unreadCount };
    });
  },
);
