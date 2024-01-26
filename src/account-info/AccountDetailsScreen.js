/* @flow strict-local */
import React, { useCallback } from 'react';
import type { Node } from 'react';
import { View } from 'react-native';

import invariant from 'invariant';
import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import type { UserId } from '../types';
import globalStyles, { createStyleSheet } from '../styles';
import { useSelector, useDispatch, useGlobalSelector } from '../react-redux';
import Screen from '../common/Screen';
import ZulipButton from '../common/ZulipButton';
import ZulipTextIntl from '../common/ZulipTextIntl';
import { IconAlertTriangle, IconPrivateChat } from '../common/Icons';
import { pm1to1NarrowFromUser } from '../utils/narrow';
import AccountDetails from './AccountDetails';
import ZulipText from '../common/ZulipText';
import ActivityText from '../title/ActivityText';
import { doNarrow } from '../actions';
import { getFullNameReactText, getOwnUser, getUserIsActive, tryGetUserForId } from '../users/userSelectors';
import { nowInTimeZone } from '../utils/date';
import CustomProfileFields from './CustomProfileFields';
import { getGlobalSettings, getRealm } from '../directSelectors';
import { openLinkWithUserPreference } from '../utils/openLink';

const styles = createStyleSheet({
  errorText: {
    marginHorizontal: 16,
    marginVertical: 32,
    textAlign: 'center',
  },
  pmButton: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  deactivatedText: {
    textAlign: 'center',
    paddingBottom: 20,
    fontStyle: 'italic',
    fontSize: 18,
  },
  itemWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  buttonRed: {
    flex: 1,
    backgroundColor: '#CF232A',
  },
});

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'account-details'>,
  route: RouteProp<'account-details', {| userId: UserId |}>,
|}>;

function ReportUserButton({ user, ownUser }) {
  const globalSettings = useGlobalSelector(getGlobalSettings);
  const openReportPage = useCallback(() => {
    openLinkWithUserPreference(new URL(`https://tech.nextpay.vn/nextpay-talk-user-report?me=${ownUser.full_name}&reported_user=${user.full_name}`), globalSettings);
  }, [globalSettings, ownUser, user]);
  return (
    <ZulipButton
      style={styles.buttonRed}
      text="Report user"
      Icon={IconAlertTriangle}
      onPress={openReportPage}
    />
  );
}

export default function AccountDetailsScreen(props: Props): Node {
  const dispatch = useDispatch();
  const ownUser = useSelector(getOwnUser);
  const user = useSelector(state => tryGetUserForId(state, props.route.params.userId));
  const isActive = useSelector(state => getUserIsActive(state, props.route.params.userId));
  const enableGuestUserIndicator = useSelector(state => getRealm(state).enableGuestUserIndicator);

  const handleChatPress = useCallback(() => {
    invariant(user, 'Callback handleChatPress is used only if user is known');
    dispatch(doNarrow(pm1to1NarrowFromUser(user)));
  }, [user, dispatch]);

  if (!user) {
    return (
      <Screen title="Error">
        <ZulipText style={styles.errorText} text="Could not show user profile." />
      </Screen>
    );
  }

  let localTime: string | null = null;
  // See comments at CrossRealmBot and User at src/api/modelTypes.js.
  if (user.timezone !== '' && user.timezone !== undefined) {
    try {
      localTime = `${nowInTimeZone(user.timezone)} Local time`;
    } catch {
      // The set of timezone names in the tz database is subject to change over
      // time. Handle unrecognized timezones by quietly discarding them.
    }
  }

  return (
    <Screen title={getFullNameReactText({ user, enableGuestUserIndicator })}>
      <AccountDetails user={user} showEmail showStatus />
      <View style={styles.itemWrapper}>
        <ActivityText style={globalStyles.largerText} user={user} />
      </View>
      {localTime !== null && (
        <View style={styles.itemWrapper}>
          <ZulipText style={globalStyles.largerText} text={localTime} />
        </View>
      )}
      <View style={styles.itemWrapper}>
        <CustomProfileFields user={user} />
      </View>
      {!isActive && (
        <ZulipTextIntl style={styles.deactivatedText} text="(This user has been deactivated)" />
      )}
      <ZulipButton
        style={styles.pmButton}
        text={isActive ? 'Send direct message' : 'View direct messages'}
        onPress={handleChatPress}
        Icon={IconPrivateChat}
      />
      <View style={{ height: 20 }} />
      {user.email === ownUser.email ? <View /> : (
        <View style={styles.pmButton}>
          <ReportUserButton user={user} ownUser={ownUser} />
        </View>
)}
    </Screen>
  );
}
