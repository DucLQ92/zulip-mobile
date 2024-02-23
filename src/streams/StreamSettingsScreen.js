/* @flow strict-local */
import type { Node } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import { useSelector } from '../react-redux';
import { delay } from '../utils/async';
import SwitchRow from '../common/SwitchRow';
import Screen from '../common/Screen';
import ZulipButton from '../common/ZulipButton';
import { getSettings } from '../directSelectors';
import { getAuth, getOwnUser, getStreamForId } from '../selectors';
import StreamCard from './StreamCard';
import {
  IconEdit,
  IconMute,
  IconNotifications,
  IconPeople,
  IconPin,
  IconPlusSquare
} from '../common/Icons';
import styles from '../styles';
import { getSubscriptionsById } from '../subscriptions/subscriptionSelectors';
import * as api from '../api';
import getIsNotificationEnabled from './getIsNotificationEnabled';
import { roleIsAtLeast } from '../permissionSelectors';
import { Role } from '../api/permissionsTypes';

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'stream-settings'>,
  route: RouteProp<'stream-settings', {| streamId: number |}>,
|}>;

export default function StreamSettingsScreen(props: Props): Node {
  const { navigation } = props;
  const auth = useSelector(getAuth);
  const users = useSelector(state => state.users);
  const isAtLeastAdmin = useSelector(state => roleIsAtLeast(getOwnUser(state).role, Role.Admin));
  const stream = useSelector(state => getStreamForId(state, props.route.params.streamId));
  const subscription = useSelector(state =>
    getSubscriptionsById(state).get(props.route.params.streamId),
  );
  const userSettingStreamNotification = useSelector(state => getSettings(state).streamNotification);

  const handleTogglePinStream = useCallback(
    (newValue: boolean) => {
      api.setSubscriptionProperty(auth, stream.stream_id, 'pin_to_top', newValue);
    },
    [auth, stream],
  );

  const handleToggleMuteStream = useCallback(
    (newValue: boolean) => {
      api.setSubscriptionProperty(auth, stream.stream_id, 'is_muted', newValue);
    },
    [auth, stream],
  );

  const handlePressEdit = useCallback(() => {
    navigation.push('edit-stream', { streamId: stream.stream_id });
  }, [navigation, stream.stream_id]);

  const handlePressEditSubscribers = useCallback(() => {
    navigation.push('invite-users', { streamId: stream.stream_id });
  }, [navigation, stream.stream_id]);

  const handlePressSubscribe = useCallback(() => {
    // This still uses a stream name (#3918) because the API method does; see there.
    api.subscriptionAdd(auth, [{ name: stream.name }]);
  }, [auth, stream]);

  const handlePressUnsubscribe = useCallback(() => {
    // This still uses a stream name (#3918) because the API method does; see there.
    api.subscriptionRemove(auth, [stream.name]);
  }, [auth, stream]);

  const handleToggleStreamPushNotification = useCallback(() => {
    const currentValue = getIsNotificationEnabled(subscription, userSettingStreamNotification);
    api.setSubscriptionProperty(auth, stream.stream_id, 'push_notifications', !currentValue);
  }, [auth, stream, subscription, userSettingStreamNotification]);

  const [streamsSubscribers, setStreamsSubscribers] = useState<any>([]);
  useEffect(() => {
    (async () => {
      const response = await api.getStreamsSubscribers(auth, stream.stream_id);
      if (response?.subscribers) {
        const ss = users.filter(user => response.subscribers.indexOf(user.user_id) > -1);
        setStreamsSubscribers(ss.sort((a, b) => a.full_name.localeCompare(b.full_name)));
      } else {
        setStreamsSubscribers([]);
      }
    })();
  }, [auth, stream.stream_id, users]);

  const handlePressSubscribers = useCallback(() => {
    navigation.push('new-1to1-pm', { streamsSubscribers });
  }, [navigation, streamsSubscribers]);

  return (
    <Screen title="Stream">
      <StreamCard stream={stream} subscription={subscription} />
      {subscription && (
        <>
          <SwitchRow
            Icon={IconPin}
            label="Pinned"
            value={subscription.pin_to_top}
            onValueChange={handleTogglePinStream}
          />
          <SwitchRow
            Icon={IconMute}
            label="Muted"
            value={subscription.in_home_view === false}
            onValueChange={handleToggleMuteStream}
          />
          <SwitchRow
            Icon={IconNotifications}
            label="Notifications"
            value={getIsNotificationEnabled(subscription, userSettingStreamNotification)}
            onValueChange={handleToggleStreamPushNotification}
          />
        </>
      )}
      <View style={styles.paddingHorizontal}>
        {isAtLeastAdmin && (
          // TODO: Group all the stream's attributes together (name,
          //   description, policies, etc.), with an associated "Edit"
          //   button that gives a UI for changing those attributes. For the
          //   grouping, try react-native-paper's `Card`, with a
          //   ZulipTextButton in its `Card.Actions`. See
          //     https://callstack.github.io/react-native-paper/card-actions.html
          //   Or their `Surface`:
          //     https://callstack.github.io/react-native-paper/surface.html
          <ZulipButton
            style={styles.marginTop}
            Icon={IconEdit}
            text="Edit stream"
            secondary
            onPress={() => delay(handlePressEdit)}
          />
        )}
        {(streamsSubscribers ?? []).length ? (
          <ZulipButton
            style={styles.marginTop}
            Icon={IconPeople}
            text="Subscribers"
            onPress={() => delay(handlePressSubscribers)}
          />
        ) : <View />}
        <ZulipButton
          style={styles.marginTop}
          Icon={IconPlusSquare}
          text="Add subscribers"
          secondary
          onPress={() => delay(handlePressEditSubscribers)}
        />
        {subscription ? (
          <ZulipButton
            style={styles.marginTop}
            text="Unsubscribe"
            secondary
            onPress={() => delay(handlePressUnsubscribe)}
          />
        ) : (
          <ZulipButton
            style={styles.marginTop}
            text="Subscribe"
            secondary
            onPress={() => delay(handlePressSubscribe)}
          />
        )}
      </View>
    </Screen>
  );
}
