/* @flow strict-local */

import React from 'react';
import type { Node } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Narrow } from '../types';
import ZulipTextIntl from '../common/ZulipTextIntl';
import { TimeoutError } from '../utils/async';
import ZulipButton from '../common/ZulipButton';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    paddingLeft: 10,
    padding: 8,
    textAlign: 'center',
  },
  button: { marginTop: 8, paddingHorizontal: 32, width: '100%' },
});

type Props = $ReadOnly<{|
  narrow: Narrow,
  error: mixed,
  onPressRetry: mixed,
|}>;

export default function FetchError(props: Props): Node {
  return (
    <View style={styles.container}>
      {(() => {
        if (props.error instanceof TimeoutError) {
          return <ZulipTextIntl style={styles.text} text="Request timed out." />;
        } else if (props.error?.code === 'RATE_LIMIT_HIT') {
          return (
            <View style={{ alignItems: 'center' }}>
              <ZulipTextIntl
                style={styles.text}
                text={{
                      text: 'Your requests to NextPay Talk server have reached limit. Please wait {second}s and retry.',
                      values: { second: Math.ceil(props.error?.data['retry-after'] ?? 0) },
                    }}
              />
              <ZulipButton
                style={styles.button}
                text="Retry"
                onPress={props.onPressRetry}
                isPressHandledWhenDisabled
              />
            </View>
          );
        } else {
          return <ZulipTextIntl style={styles.text} text="Oops! Something went wrong." />;
        }
      })()}
    </View>
  );
}
