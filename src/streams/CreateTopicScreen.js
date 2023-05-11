/* @flow strict-local */
import React, { useCallback, useContext } from 'react';
import type { Node } from 'react';

import { TranslationContext } from '../boot/TranslationProvider';
import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import { useDispatch, useSelector } from '../react-redux';
import { getAuth, getTopicsForStream } from '../selectors';
import { getStreamsByName } from '../subscriptions/subscriptionSelectors';
import Screen from '../common/Screen';
import { showErrorAlert } from '../utils/info';
import { ApiError } from '../api/apiErrors';
import * as api from '../api';
import { privacyToStreamProps } from './streamsActions';
import EditTopicCard from './EditTopicCard';
import { addToOutbox } from '../outbox/outboxActions';

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'create-topic'>,
  route: RouteProp<'create-topic', {| streamId: number |}>,
|}>;

export default function CreateTopicScreen(props: Props): Node {
  const _ = useContext(TranslationContext);
  const { navigation } = props;
  const dispatch = useDispatch();
  const topics = useSelector(state => getTopicsForStream(state, props.route.params.streamId));
  const handleComplete = useCallback(
    async ({ name }) => {
      const topicFind = topics.find(e => e.name === name);
      if (topicFind) {
        showErrorAlert(_('A topic with this name already exists.'));
        return false;
      }

      try {
        dispatch(addToOutbox({ type: 'topic', streamId: props.route.params.streamId, topic: name }, '...'));
        return true;
      } catch (error) {
        if (error instanceof ApiError) {
          showErrorAlert(error.message);
          return false;
        } else {
          throw error;
        }
      }
    },
    [topics, _, dispatch, props.route.params.streamId],
  );

  return (
    <Screen title="New topic" padding>
      <EditTopicCard
        navigation={navigation}
        isNewTopic
        initialValues={{ name: '' }}
        onComplete={handleComplete}
      />
    </Screen>
  );
}
