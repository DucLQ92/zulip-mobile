/* @flow strict-local */
import React from 'react';
import type { Node } from 'react';
import { View } from 'react-native';

import { useGlobalSelector } from '../react-redux';
import { getGlobalLoginAccountInfo } from '../selectors';
import { BRAND_COLOR, createStyleSheet } from '../styles';
import LoadingIndicator from './LoadingIndicator';
import ZulipStatusBar from './ZulipStatusBar';
import ZulipText from './ZulipText';

const componentStyles = createStyleSheet({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND_COLOR,
  },
});

type Props = $ReadOnly<{||}>;

/**
 * Meant to be used to cover the whole screen.
 */
export default function FullScreenLoading(props: Props): Node {
  const loginAccountInfo = useGlobalSelector(getGlobalLoginAccountInfo);

  return (
    <>
      <ZulipStatusBar backgroundColor={BRAND_COLOR} />
      {
        // No need for `OfflineNoticePlaceholder` here: the content, a
        // loading indicator centered on the whole screen, isn't near the
        // top of the screen, so it doesn't need protection from being
        // hidden under the offline notice.
      }
      <View style={componentStyles.center}>
        <LoadingIndicator color="black" size={80} showLogo />
        {loginAccountInfo && (
          <View style={{ marginVertical: 24, alignItems: 'center' }}>
            <ZulipText
              style={{
                fontSize: 16,
                marginBottom: 4,
                color: 'white',
                textAlign: 'center',
              }}
              text={loginAccountInfo.realm}
            />
            <ZulipText
              style={{
                fontSize: 14,
                color: 'white',
                textAlign: 'center',
                opacity: 0.9,
              }}
              text={loginAccountInfo.email}
            />
          </View>
        )}
      </View>
    </>
  );
}
