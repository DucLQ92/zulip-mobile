/* @flow strict-local */

import React, { useContext, useState } from 'react';
import type { Node } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WebView } from 'react-native-webview';
import { useWindowDimensions, View } from 'react-native';
import type { RouteProp } from '../react-navigation';
import type { MainTabsNavigationProp } from '../main/MainTabsScreen';
import { ThemeContext, createStyleSheet, BRAND_COLOR } from '../styles';
import { OfflineNoticePlaceholder } from '../boot/OfflineNoticeProvider';
import { base64Utf8Encode } from '../utils/encoding';
import { useSelector } from '../react-redux';
import { getAuth } from '../account/accountsSelectors';

const styles = createStyleSheet({
  container: {
    flex: 1,
  },
  button: {
    margin: 8,
    flex: 1,
  },
  emptySlate: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 20,
  },
  row: {
    flexDirection: 'row',
  },
});

type Props = $ReadOnly<{|
  navigation: MainTabsNavigationProp<'task-redmine'>,
  route: RouteProp<'task-redmine', void>,
|}>;

function ProgressBarWebview(props: {| +value: number, +hide: boolean, |}): Node {
  const { value, hide } = props;
  const { width } = useWindowDimensions();

  return hide ? <View /> : <View style={{ height: 2, width: width * value, backgroundColor: BRAND_COLOR }} />;
}

/**
 *
 * */
export default function TaskRedmineScreen(props: Props): Node {
  const context = useContext(ThemeContext);
  const auth = useSelector(getAuth);
  const uri = `https://task-client.nextpay.vn?talk-auth=${base64Utf8Encode(`${auth.email}:${auth.apiKey}`)}&platform=web-iframe`;
  const [loadingProgress, setLoadingProgress] = useState<number>(0.0);
  const [showLoading, setShowLoading] = useState<boolean>(false);

  return (
    <SafeAreaView
      mode="padding"
      edges={['top']}
      style={[styles.container, { backgroundColor: context.backgroundColor }]}
    >
      <OfflineNoticePlaceholder />
      <ProgressBarWebview value={loadingProgress} hide={!showLoading} />
      <WebView
        source={{ uri }}
        autoManageStatusBarEnabled={false}
        onShouldStartLoadWithRequest={(request) => {
          console.log('///---TASK REDMINE---///-onShouldStartLoadWithRequest:', request);
          return true;
        }}
        onLoadProgress={({ nativeEvent }) => {
          if (nativeEvent.progress === 1.0 && showLoading) {
            setTimeout(() => {
              setShowLoading(false);
              setLoadingProgress(0.0);
            }, 200);
          } else if (nativeEvent.progress < 1.0 && !showLoading) {
            setShowLoading(true);
          }
          setLoadingProgress(nativeEvent.progress);
        }}
      />
    </SafeAreaView>
  );
}
