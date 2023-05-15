/* @flow strict-local */
import React, { useState, useCallback, useEffect, useContext } from 'react';
import type { Node } from 'react';
import { View } from 'react-native';
import type { AppNavigationMethods } from '../nav/AppNavigator';
import Input from '../common/Input';
import ZulipTextIntl from '../common/ZulipTextIntl';
import ZulipButton from '../common/ZulipButton';
import styles from '../styles';
import { TranslationContext } from '../boot/TranslationProvider';
import { showConfirmationDialog } from '../utils/info';

type PropsBase = $ReadOnly<{|
  navigation: AppNavigationMethods,

  initialValues: {|
    name: string,
  |},
|}>;

type PropsEditTopic = $ReadOnly<{|
  ...PropsBase,

  isNewTopic: false,
  onComplete: (changedValues: {|
    +name?: string,
  |}) => boolean | Promise<boolean>,
|}>;

type PropsCreateTopic = $ReadOnly<{|
  ...PropsBase,

  isNewTopic: true,
  onComplete: ({| name: string |}) =>
    | boolean
    | Promise<boolean>,
|}>;

type Props = $ReadOnly<PropsEditTopic | PropsCreateTopic>;

export default function EditTopicCard(props: Props): Node {
  const { navigation, initialValues, isNewTopic, progress } = props;
  const _ = useContext(TranslationContext);

  const [name, setName] = useState<string>(props.initialValues.name);
  // When adding more, update areInputsTouched.

  const [awaitingUserInput, setAwaitingUserInput] = useState<boolean>(true);
  const areInputsTouched =
    name !== initialValues.name;

  useEffect(
    () =>
      navigation.addListener('beforeRemove', e => {
        if (!(awaitingUserInput && areInputsTouched)) {
          return;
        }

        e.preventDefault();

        showConfirmationDialog({
          destructive: true,
          title: 'Discard changes',
          message: 'You have unsaved changes. Leave without saving?',
          onPressConfirm: () => navigation.dispatch(e.data.action),
          _,
        });
      }),
    [_, areInputsTouched, navigation, awaitingUserInput],
  );

  const handlePerformAction = useCallback(async () => {
    setAwaitingUserInput(false);
    let result = false;
    try {
      if (props.isNewTopic) {
        result = await props.onComplete({ name });
      } else {
        result = await props.onComplete({
          name: initialValues.name !== name ? name : undefined,
        });
      }
    } finally {
      if (result) {
        setName(initialValues.name);
        navigation.goBack();
      } else {
        setAwaitingUserInput(true);
      }
    }
  }, [props, navigation, initialValues, name]);

  return (
    <View>
      <ZulipTextIntl text="Name" />
      <Input
        style={styles.marginBottom}
        placeholder="Name"
        autoFocus
        defaultValue={initialValues.name}
        onChangeText={setName}
      />
      <ZulipButton
        style={styles.marginTop}
        text={isNewTopic ? 'Create' : 'Save'}
        progress={progress}
        disabled={name.length === 0}
        onPress={handlePerformAction}
      />
    </View>
  );
}
