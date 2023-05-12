/* @flow strict-local */

import React, { useEffect, useState } from 'react';
import type { Node } from 'react';
import { FlatList } from 'react-native';

import type { Narrow } from '../types';
import { createStyleSheet } from '../styles';
import { useDispatch, useSelector } from '../react-redux';
import { getTopicsForNarrow } from '../selectors';
import Popup from '../common/Popup';
import ZulipText from '../common/ZulipText';
import Touchable from '../common/Touchable';
import AnimatedScaleComponent from '../animation/AnimatedScaleComponent';
import { fetchTopicsForStream } from '../topics/topicActions';

const styles = createStyleSheet({
  topic: {
    padding: 10,
  },
});

type Props = $ReadOnly<{|
  /** If null, this component won't do anything. */
  narrow: Narrow | null,

  isFocused: boolean,
  text: string,
  onAutocomplete: (name: string) => void,
|}>;

export default function TopicAutocomplete(props: Props): Node {
  const { narrow, isFocused, text, onAutocomplete, topicNameOfLastMessage } = props;
  const dispatch = useDispatch();
  const topics = useSelector(state => (narrow ? getTopicsForNarrow(state, narrow) : []));
  const [isAutoInputTopic, setIsAutoInputTopic] = useState(false);

  useEffect(() => {
    // The following should be sufficient to ensure we're up-to-date
    // with the complete list of topics at all times that we need to
    // be:
    //
    // - When we first expect to see the list, fetch all topics for
    //   the stream.
    //
    // - Afterwards, update the list when a new message arrives, if it
    //   introduces a new topic.
    //
    // The latter is already taken care of (see handling of
    // EVENT_NEW_MESSAGE in topicsReducer). So, do the former here.
    if (narrow) {
      dispatch(fetchTopicsForStream(narrow));
    }

    // auto pick topic 1st time
    if (topics.length && topicNameOfLastMessage && !isAutoInputTopic) {
      onAutocomplete(topicNameOfLastMessage, true);
      setIsAutoInputTopic(true);
    }
  }, [dispatch, isAutoInputTopic, narrow, onAutocomplete, topicNameOfLastMessage, topics]);

  if (!isFocused || !narrow) {
    return null;
  }

  const topicsToSuggest = topics.filter(
    x => x && x !== text && x.toLowerCase().indexOf(text.toLowerCase()) > -1,
  );

  return (
    <AnimatedScaleComponent visible={topicsToSuggest.length > 0}>
      <Popup>
        <FlatList
          nestedScrollEnabled
          keyboardShouldPersistTaps="always"
          initialNumToRender={10}
          data={topicsToSuggest}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <Touchable onPress={() => onAutocomplete(item)}>
              <ZulipText style={styles.topic} text={item} />
            </Touchable>
          )}
        />
      </Popup>
    </AnimatedScaleComponent>
  );
}
