/* @flow strict-local */
import React, { useCallback, useContext, useRef } from 'react';
import type { Node } from 'react';

import { TranslationContext } from '../boot/TranslationProvider';
import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import { useDispatch, useSelector } from '../react-redux';
import { getAuth, getTopicsForStream } from '../selectors';
import Screen from '../common/Screen';
import { showErrorAlert } from '../utils/info';
import { ApiError } from '../api/apiErrors';
import * as api from '../api';
import EditTopicCard from './EditTopicCard';
import { addToOutbox } from '../outbox/outboxActions';
import { fetchTopics } from '../topics/topicActions';

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'create-topic'>,
  route: RouteProp<'create-topic', {| isEdit: boolean, streamId: number, topic: string |}>,
|}>;

export default function CreateTopicScreen(props: Props): Node {
  const _ = useContext(TranslationContext);
  const { navigation } = props;
  const dispatch = useDispatch();
    const [progress, setProgress] = React.useState(false);

    const initialValues = useRef({
        name: props.route.params.topic ?? '',
    }).current;

    const topics = useSelector(state => getTopicsForStream(state, props.route.params.streamId));

    const auth = useSelector(getAuth);
  const handleComplete = useCallback(
    async ({ name }) => {
        if (props.route.params.isEdit) {
            const topicFind = topics.find(e => e.name === name && e.name !== (props.route.params.topic ?? ''));
            if (topicFind) {
                showErrorAlert(_('A topic with this name already exists.'));
                return false;
            } else if (!props.route.params.firstMessageId) {
                showErrorAlert(_('Error'));
            } else {
                try {
                    setProgress(true);
                    await api.updateTopicName(auth, props.route.params.firstMessageId, name);
                    setProgress(false);
                    dispatch(fetchTopics(props.route.params.streamId));
                    return true;
                } catch (error) {
                    if (error instanceof ApiError) {
                        showErrorAlert(error.message);
                        return false;
                    } else {
                        throw error;
                    }
                }
            }
        } else {
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
        }
    },
    [props.route.params.isEdit, props.route.params.firstMessageId, props.route.params.topic, props.route.params.streamId, topics, _, auth, dispatch],
  );

  return (
    <Screen title={props.route.params.isEdit ? 'Rename topic' : 'New topic'} padding>
      <EditTopicCard
        navigation={navigation}
        isNewTopic={!props.route.params.isEdit}
        initialValues={initialValues}
        onComplete={handleComplete}
        progress={progress}
      />
    </Screen>
  );
}
