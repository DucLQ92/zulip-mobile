/* @flow strict-local */

import React from 'react';
import type { Node } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RouteProp } from '../react-navigation';
import type { MainTabsNavigationProp } from './MainTabsScreen';
import { useGlobalDispatch, useGlobalSelector } from '../react-redux';
import { HOME_NARROW, MENTIONED_NARROW, STARRED_NARROW } from '../utils/narrow';
import { TopTabButton, TopTabButtonGeneral } from '../nav/TopTabButton';
import UnreadCards from '../unread/UnreadCards';
import { doNarrow } from '../actions';
import IconUnreadMentions from '../nav/IconUnreadMentions';
import { BRAND_COLOR, createStyleSheet } from '../styles';
import LoadingBanner from '../common/LoadingBanner';
import ServerCompatBanner from '../common/ServerCompatBanner';
import ServerNotifsDisabledBanner from '../common/ServerNotifsDisabledBanner';
import { OfflineNoticePlaceholder } from '../boot/OfflineNoticeProvider';
import ServerNotifsExpiringBanner from '../common/ServerNotifsExpiringBanner';
import { IconSwap } from '../common/Icons';
import { getAccounts } from '../directSelectors';
import { accountSwitch } from '../account/accountActions';

const styles = createStyleSheet({
  wrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  iconList: {
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
});

type Props = $ReadOnly<{|
  navigation: MainTabsNavigationProp<'home'>,
  route: RouteProp<'home', void>,
|}>;

export default function HomeScreen(props: Props): Node {
  const { navigation } = props;
  const dispatch = useGlobalDispatch();
  const accounts = useGlobalSelector(getAccounts);
  const loggedInAccounts = accounts.filter(account => account.apiKey !== '');

  const handleAccountSwitch = () => {
    if (loggedInAccounts.length === 2) {
      // Nếu có đúng 2 tài khoản đã đăng nhập, chuyển đổi trực tiếp
      const currentAccount = loggedInAccounts[0];
      const otherAccount = loggedInAccounts[1];
      dispatch(accountSwitch({ realm: otherAccount.realm, email: otherAccount.email }));
    } else {
      // Nếu khác 2 tài khoản, mở màn hình AccountPick
      navigation.push('account-pick');
    }
  };

  return (
    <SafeAreaView mode="padding" edges={['top']} style={styles.wrapper}>
      <OfflineNoticePlaceholder />
      <View style={styles.iconList}>
        <TopTabButton
          name="globe"
          onPress={() => {
            dispatch(doNarrow(HOME_NARROW));
          }}
        />
        <TopTabButton
          name="star"
          onPress={() => {
            dispatch(doNarrow(STARRED_NARROW));
          }}
        />
        <TopTabButtonGeneral
          onPress={() => {
            dispatch(doNarrow(MENTIONED_NARROW));
          }}
        >
          <IconUnreadMentions color={BRAND_COLOR} />
        </TopTabButtonGeneral>
        <TopTabButton
          name="search"
          onPress={() => {
            navigation.push('search-messages');
          }}
        />
        <TopTabButtonGeneral
          onPress={handleAccountSwitch}
        >
          <IconSwap size={24} color={BRAND_COLOR} />
        </TopTabButtonGeneral>
      </View>
      <ServerCompatBanner />
      <ServerNotifsDisabledBanner navigation={navigation} />
      <ServerNotifsExpiringBanner />
      <LoadingBanner />
      <UnreadCards />
    </SafeAreaView>
  );
}
