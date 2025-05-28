/* @flow strict-local */
import React, { useEffect } from 'react';
import type { Node } from 'react';
import { Keyboard, View, TextInput } from 'react-native';

import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import ZulipTextIntl from '../common/ZulipTextIntl';
import Screen from '../common/Screen';
import ZulipButton from '../common/ZulipButton';
import { tryParseUrl } from '../utils/url';
import { fetchServerSettings } from '../message/fetchActions';
import { ThemeContext } from '../styles/theme';
import { createStyleSheet, HALF_COLOR } from '../styles';
import { showErrorAlert } from '../utils/info';
import { TranslationContext } from '../boot/TranslationProvider';
import type { LocalizableText } from '../types';
import { getGlobalSettings } from '../directSelectors';
import { useGlobalSelector } from '../react-redux';
import { BRAND_COLOR } from '../styles/constants';
import ZulipText from '../common/ZulipText';
import WebLink from '../common/WebLink';
import ServerList from './ServerList';
import { defaultServers } from './defaultServers';
import { saveServer, getServers, deleteServer } from '../storage/servers';

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'realm-input'>,
  route: RouteProp<'realm-input', {| initial: boolean | void, autoSelectFirst: boolean | void |}>,
|}>;

enum ValidationError {
  Empty = 0,
  InvalidUrl = 1,
  NoUseEmail = 2,
  UnsupportedSchemeZulip = 3,
  UnsupportedSchemeOther = 4,
}

function validationErrorMsg(validationError: ValidationError): LocalizableText {
  switch (validationError) {
    case ValidationError.Empty:
      return 'Please enter a URL.';
    case ValidationError.InvalidUrl:
      return 'Please enter a valid URL.';
    case ValidationError.NoUseEmail:
      return 'Please enter the server URL, not your email.';
    case ValidationError.UnsupportedSchemeZulip:
    // TODO: What would be more helpful here? (First, maybe find out what
    //   leads people to try a "zulip://" URL, if anyone actually does that)
    case ValidationError.UnsupportedSchemeOther: // eslint-disable-line no-fallthrough
      return 'The server URL must start with http:// or https://.';
  }
}

type MaybeParsedInput =
  | {| +valid: true, value: URL |}
  | {| +valid: false, error: ValidationError |};

const tryParseInput = (realmInputValue: string): MaybeParsedInput => {
  const trimmedInputValue = realmInputValue.trim();

  if (trimmedInputValue.length === 0) {
    return { valid: false, error: ValidationError.Empty };
  }

  let url = tryParseUrl(trimmedInputValue);
  if (!/^https?:\/\//.test(trimmedInputValue)) {
    if (url && url.protocol === 'zulip:') {
      // Someone might get the idea to try one of the "zulip://" URLs that
      // are discussed sometimes.
      // TODO(?): Log to Sentry. How much does this happen, if at all? Maybe
      //   log once when the input enters this error state, but don't spam
      //   on every keystroke/render while it's in it.
      return { valid: false, error: ValidationError.UnsupportedSchemeZulip };
    } else if (url && url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { valid: false, error: ValidationError.UnsupportedSchemeOther };
    }
    url = tryParseUrl(`https://${trimmedInputValue}`);
  }

  if (!url) {
    return { valid: false, error: ValidationError.InvalidUrl };
  }
  if (url.username !== '') {
    return { valid: false, error: ValidationError.NoUseEmail };
  }

  return { valid: true, value: url };
};

type Suggestion =
  | ValidationError // Display relevant validation error message
  | string // Suggest this string as the server URL
  | null; // No suggestion

function getSuggestion(realmInputValue, maybeParsedInput): Suggestion {
  if (!maybeParsedInput.valid) {
    switch (maybeParsedInput.error) {
      case ValidationError.NoUseEmail:
      case ValidationError.UnsupportedSchemeZulip:
      case ValidationError.UnsupportedSchemeOther:
        // Flag high-signal errors
        return maybeParsedInput.error;

      case ValidationError.Empty:
      case ValidationError.InvalidUrl:
      // Don't flag more noisy errors, which will often happen when the user
      // just hasn't finished typing a good URL. They'll still show up if
      // they apply at submit time; see the submit handler.
    }
  }

  const normalizedValue = realmInputValue.trim().replace(/^https?:\/\//, '');

  if (
    // This couldn't be a valid Zulip Cloud server subdomain. (Criteria
    // copied from check_subdomain_available in zerver/forms.py.)
    normalizedValue.length < 3
    || !/^[a-z0-9-]*$/.test(normalizedValue)
    || normalizedValue[0] === '-'
    || normalizedValue[normalizedValue.length - 1] === '-'
    // TODO(?): Catch strings hard-coded as off-limits, like "your-org".
    //   (See check_subdomain_available in zerver/forms.py.)
  ) {
    return null;
  }

  if ('talk'.startsWith(normalizedValue)) {
    return 'https://talk.nextpay.vn/';
  }

  return `https://${normalizedValue}.nextpay.vn/`;
}

export default function RealmInputScreen(props: Props): Node {
  const { navigation, route } = props;
  const { autoSelectFirst = false } = route.params || {};

  const globalSettings = useGlobalSelector(getGlobalSettings);

  const _ = React.useContext(TranslationContext);
  const themeContext = React.useContext(ThemeContext);

  const [progress, setProgress] = React.useState(false);
  // const [realmInputValue, setRealmInputValue] = React.useState('dev-talk.nextpay.vn');
  // const [realmInputValue, setRealmInputValue] = React.useState('talk.nextpay.vn');
  const [realmInputValue, setRealmInputValue] = React.useState('');
  const [savedServers, setSavedServers] = React.useState([]);
  const maybeParsedInput = tryParseInput(realmInputValue);

  const textInputRef = React.useRef<React$ElementRef<typeof TextInput> | null>(null);

  // Load danh sách server từ storage
  useEffect(() => {
    const loadServers = async () => {
      const servers = await getServers();
      setSavedServers(servers);
    };
    loadServers();
  }, []);

  const handleDeleteServer = React.useCallback(async (serverId: string) => {
    await deleteServer(serverId);
    const servers = await getServers();
    setSavedServers(servers);
  }, []);

  const tryRealm = React.useCallback(async () => {
    if (!maybeParsedInput.valid) {
      showErrorAlert(_('Invalid input'), _(validationErrorMsg(maybeParsedInput.error)));
      return;
    }

    setProgress(true);
    const result = await fetchServerSettings(maybeParsedInput.value);
    setProgress(false);
    if (result.type === 'error') {
      showErrorAlert(
        _(result.title),
        _(result.message),
        result.learnMoreButton && {
          url: result.learnMoreButton.url,
          text: result.learnMoreButton.text != null ? _(result.learnMoreButton.text) : undefined,
          globalSettings,
        },
      );
      return;
    }
    const serverSettings = result.value;

    // Lưu server mới vào danh sách
    const newServer = {
      id: Date.now().toString(),
      name: serverSettings.realm_name,
      url: serverSettings.realm_uri,
      icon: serverSettings.realm_icon,
      isDefault: false,
    };
    await saveServer(newServer);
    const servers = await getServers();
    setSavedServers(servers);

    navigation.push('password-auth', {
      realm: serverSettings.realm_uri,
      requireEmailFormat: serverSettings.require_email_format_usernames,
      serverSettings,
    });
    Keyboard.dismiss();
  }, [navigation, maybeParsedInput, globalSettings, _]);

  const handleSelectServer = React.useCallback((server) => {
    const parsedInput = tryParseInput(server.url);
    if (parsedInput.valid) {
      setProgress(true);
      fetchServerSettings(parsedInput.value)
        .then(result => {
          setProgress(false);
          if (result.type === 'error') {
            showErrorAlert(
              _(result.title),
              _(result.message),
              result.learnMoreButton && {
                url: result.learnMoreButton.url,
                text: result.learnMoreButton.text != null ? _(result.learnMoreButton.text) : undefined,
                globalSettings,
              },
            );
            return;
          }
          const serverSettings = result.value;
          navigation.push('password-auth', {
            realm: serverSettings.realm_uri,
            requireEmailFormat: serverSettings.require_email_format_usernames,
            serverSettings,
          });
          Keyboard.dismiss();
        })
        .catch(error => {
          setProgress(false);
          showErrorAlert(_('Error'), error.message);
        });
    }
  }, [navigation, globalSettings, _]);

  useEffect(() => {
    if (textInputRef.current) {
      // textInputRef.current.focus();
    }
    if (autoSelectFirst && defaultServers.length > 0) {
      handleSelectServer(defaultServers[0]);
    }
  }, []); // Chỉ chạy 1 lần khi mount

  const suggestion = getSuggestion(realmInputValue, maybeParsedInput);

  const handlePressSuggestion = React.useCallback(suggestion_ => {
    setRealmInputValue(suggestion_);
  }, []);

  const styles = React.useMemo(
    () =>
      createStyleSheet({
        inputWrapper: {
          flexDirection: 'row',
          opacity: 0.8,
          marginTop: 16,
          marginBottom: 8,
        },
        input: {
          flex: 1,
          padding: 0,
          fontSize: 20,
          color: themeContext.color,
        },
        suggestionText: { fontSize: 12, fontStyle: 'italic' },
        suggestionTextLink: {
          fontStyle: 'normal',
          color: BRAND_COLOR, // chosen to mimic WebLink
        },
        button: { marginTop: 8 },
      }),
    [themeContext],
  );

  const suggestionContent = React.useMemo(() => {
    if (suggestion === null) {
      // Vertical spacer so the layout doesn't jump when a suggestion
      // appears or disappears. (The empty string might be neater, but it
      // doesn't give the right height… probably lots of people wanted it to
      // be treated just like false/null/undefined in conditional rendering,
      // and React or RN gave in to that. I've tried the obvious ways to use
      // RN's PixelRatio.getFontScale() and never got the right height
      // either; dunno why.)
      return '\u200b'; // U+200B ZERO WIDTH SPACE
    } else if (typeof suggestion === 'string') {
      return (
        <ZulipTextIntl
          inheritFontSize
          text={{
            text: 'Suggestion: <z-link>{suggestedServerUrl}</z-link>',
            values: {
              suggestedServerUrl: suggestion,
              'z-link': chunks => (
                <ZulipText
                  inheritFontSize
                  style={styles.suggestionTextLink}
                  onPress={() => handlePressSuggestion(suggestion)}
                >
                  {chunks}
                </ZulipText>
              ),
            },
          }}
        />
      );
    } else {
      return <ZulipTextIntl inheritFontSize text={validationErrorMsg(suggestion)} />;
    }
  }, [suggestion, handlePressSuggestion, styles]);

  return (
    <Screen
      title="Welcome"
      canGoBack={!route.params.initial}
      padding
      keyboardShouldPersistTaps="always"
      shouldShowLoadingBanner={false}
    >
      <ServerList
        servers={[...defaultServers, ...savedServers]}
        onSelectServer={handleSelectServer}
        onDeleteServer={handleDeleteServer}
      />
      <ZulipTextIntl
        text={{
          text: 'Enter your Zulip server URL: <z-link>(What’s this?)</z-link>',
          values: {
            'z-link': chunks => (
              <WebLink url={new URL('https://zulip.com/help/logging-in#find-the-zulip-log-in-url')}>
                {chunks}
              </WebLink>
            ),
          },
        }}
        style={{ marginTop: 32 }}
      />
      <View style={styles.inputWrapper}>
        <TextInput
          value={realmInputValue}
          placeholder="vd: talk.nextpay.vn"
          placeholderTextColor={HALF_COLOR}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="go"
          onChangeText={setRealmInputValue}
          blurOnSubmit={false}
          keyboardType="url"
          underlineColorAndroid="transparent"
          onSubmitEditing={tryRealm}
          enablesReturnKeyAutomatically
          disableFullscreenUI
          ref={textInputRef}
        />
      </View>
      <ZulipText style={styles.suggestionText}>{suggestionContent}</ZulipText>
      <ZulipButton
        style={styles.button}
        text="Enter"
        progress={progress}
        onPress={tryRealm}
        isPressHandledWhenDisabled
        disabled={!maybeParsedInput.valid}
      />
    </Screen>
  );
}
