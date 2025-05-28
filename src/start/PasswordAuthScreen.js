/* @flow strict-local */
import React, { PureComponent } from 'react';
import type { ComponentType } from 'react';
import { View } from 'react-native';

import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import type { GlobalDispatch } from '../types';
import type { ServerSettings } from '../api/settings/getServerSettings';
import { createStyleSheet } from '../styles';
import { connectGlobal } from '../react-redux';
import * as api from '../api';
import ErrorMsg from '../common/ErrorMsg';
import Input from '../common/Input';
import PasswordInput from '../common/PasswordInput';
import Screen from '../common/Screen';
import WebLink from '../common/WebLink';
import ZulipButton from '../common/ZulipButton';
import ViewPlaceholder from '../common/ViewPlaceholder';
import ZulipText from '../common/ZulipText';
import { isValidEmailFormat } from '../utils/misc';
import { loginSuccess } from '../actions';
import ZulipTextIntl from '../common/ZulipTextIntl';
import RealmInfo from './RealmInfo';
import Centerer from '../common/Centerer';

const styles = createStyleSheet({
  linksTouchable: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    textAlign: 'right',
  },
});

type OuterProps = $ReadOnly<{|
  // These should be passed from React Navigation
  navigation: AppNavigationProp<'password-auth'>,
  route: RouteProp<'password-auth', {|
    realm: URL,
    requireEmailFormat: boolean,
    serverSettings: ServerSettings,
  |}>,
|}>;

type SelectorProps = $ReadOnly<{||}>;

type Props = $ReadOnly<{|
  ...OuterProps,

  dispatch: GlobalDispatch,
  ...SelectorProps,
|}>;

type State = {|
  email: string,
  password: string,
  error: string,
  progress: boolean,
|};

class PasswordAuthScreenInner extends PureComponent<Props, State> {
  state = {
    progress: false,
    email: '',
    password: '',
    error: '',
  };

  tryPasswordLogin = async () => {
    const { dispatch, route } = this.props;
    const { requireEmailFormat, realm } = route.params;
    const { email, password } = this.state;

    this.setState({ progress: true, error: undefined });

    try {
      const fetchedKey = await api.fetchApiKey({ realm, apiKey: '', email }, email, password);
      this.setState({ progress: false });
      dispatch(loginSuccess(realm, fetchedKey.email, fetchedKey.api_key));
    } catch (e) {
      // TODO: show message for *actual* error, from server; e.g. #4571
      const errorMessage = e.message === 'Your username or password is incorrect'
          ? requireEmailFormat
              ? 'Wrong email or password. Try again.'
              : 'Wrong username or password. Try again.'
          : e.message;
      this.setState({
        progress: false,
        error: errorMessage,
      });
    }
  };

  validateForm = () => {
    const { requireEmailFormat } = this.props.route.params;
    const { email, password } = this.state;

    if (requireEmailFormat && !isValidEmailFormat(email)) {
      this.setState({ error: 'Enter a valid email address' });
    } else if (!requireEmailFormat && email.length === 0) {
      this.setState({ error: 'Enter a username' });
    } else if (!password) {
      this.setState({ error: 'Enter a password' });
    } else {
      this.tryPasswordLogin();
    }
  };

  render() {
    const { requireEmailFormat, serverSettings } = this.props.route.params;
    const { email, password, progress, error } = this.state;
    const isButtonDisabled =
      password.length === 0
      || email.length === 0
      || (requireEmailFormat && !isValidEmailFormat(email));

    return (
      <Screen
        title="Log in"
        centerContent
        padding
        keyboardShouldPersistTaps="always"
        shouldShowLoadingBanner={false}
      >
        <Centerer>
          <RealmInfo
            name={serverSettings.realm_name}
            iconUrl={new URL(serverSettings.realm_icon, serverSettings.realm_uri).toString()}
          />
          <ViewPlaceholder height={32} />
          <Input
            autoFocus={email.length === 0}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            keyboardType={requireEmailFormat ? 'email-address' : 'default'}
            placeholder={requireEmailFormat ? 'Email' : 'Username'}
            defaultValue={email}
            onChangeText={newEmail => this.setState({ email: newEmail })}
          />
          <ViewPlaceholder height={8} />
          <PasswordInput
            autoFocus={email.length !== 0}
            placeholder="Password"
            value={password}
            onChangeText={newPassword => this.setState({ password: newPassword })}
            blurOnSubmit={false}
            onSubmitEditing={this.validateForm}
          />
          <ViewPlaceholder height={16} />
          <ZulipButton
            disabled={isButtonDisabled}
            text="Log in"
            progress={progress}
            onPress={this.validateForm}
          />
          <ErrorMsg error={error} />
          <View style={{ flexDirection: 'row' }}>
            <View style={styles.linksTouchable}>
              <ZulipText style={styles.forgotPasswordText}>
                <WebLink url={new URL('/nextpay-talk-register', 'https://tech.nextpay.vn')}>
                  <ZulipTextIntl inheritColor text="Register" />
                </WebLink>
              </ZulipText>
            </View>
            <View style={{ flex: 1 }} />
            <View style={styles.linksTouchable}>
              <ZulipText style={styles.forgotPasswordText}>
                <WebLink url={new URL('/request-reset-password', 'https://dir.nextpay.vn')}>
                  <ZulipTextIntl inheritColor text="Forgot password?" />
                </WebLink>
              </ZulipText>
            </View>
          </View>
        </Centerer>
      </Screen>
    );
  }
}

const PasswordAuthScreen: ComponentType<OuterProps> = connectGlobal<{||}, _, _>()(
  PasswordAuthScreenInner,
);

export default PasswordAuthScreen;
