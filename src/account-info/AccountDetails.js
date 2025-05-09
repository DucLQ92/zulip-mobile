/* @flow strict-local */
import React from 'react';
import type { Node } from 'react';
import { View } from 'react-native';

import Emoji from '../emoji/Emoji';
import { emojiTypeFromReactionType } from '../emoji/data';
import type { LocalizableText, UserOrBot } from '../types';
import styles, { createStyleSheet } from '../styles';
import { useSelector } from '../react-redux';
import UserAvatar from '../common/UserAvatar';
import ComponentList from '../common/ComponentList';
import ZulipText from '../common/ZulipText';
import { getUserStatus } from '../user-statuses/userStatusesModel';
import PresenceStatusIndicator from '../common/PresenceStatusIndicator';
import { getDisplayEmailForUser } from '../selectors';
import { Role } from '../api/permissionsTypes';
import ZulipTextIntl from '../common/ZulipTextIntl';
import { getFullNameReactText } from '../users/userSelectors';

const componentStyles = createStyleSheet({
  componentListItem: {
    alignItems: 'center',
  },
  statusWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  presenceStatusIndicator: {
    position: 'relative',
    top: 2,
    marginRight: 5,
  },
  statusText: {
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
});

type Props = $ReadOnly<{|
  user: UserOrBot,
  showEmail: boolean,
  showStatus: boolean,
|}>;

const getRoleText = (role: Role): LocalizableText => {
  switch (role) {
    case Role.Owner:
      return 'Owner';
    case Role.Admin:
      return 'Admin';
    case Role.Moderator:
      return 'Moderator';
    case Role.Member:
      return 'Member';
    case Role.Guest:
      return 'Guest';
  }
};

export default function AccountDetails(props: Props): Node {
  const { user, showEmail, showStatus } = props;

  const userStatusText = useSelector(state => getUserStatus(state, props.user.user_id).status_text);
  const userStatusEmoji = useSelector(
    state => getUserStatus(state, props.user.user_id).status_emoji,
  );
  const realm = useSelector(state => state.realm);
  const { enableGuestUserIndicator } = realm;
  const displayEmail = getDisplayEmailForUser(realm, user);

  return (
    <ComponentList outerSpacing spacing={4} itemStyle={componentStyles.componentListItem} style={{ paddingVertical: 8 }}>
      <View>
        <UserAvatar avatarUrl={user.avatar_url} size={180} />
      </View>
      <View style={[componentStyles.statusWrapper, { paddingHorizontal: 16 }]}>
        <PresenceStatusIndicator
          style={componentStyles.presenceStatusIndicator}
          userId={user.user_id}
          hideIfOffline={false}
          useOpaqueBackground={false}
        />
        <ZulipTextIntl
          selectable
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[styles.largerText, componentStyles.boldText]}
          text={getFullNameReactText({ user, enableGuestUserIndicator })}
        />
      </View>
      {displayEmail !== null && showEmail && (
        <View>
          <ZulipText selectable style={styles.largeText} text={displayEmail} />
        </View>
      )}
      <View>
        <ZulipTextIntl selectable style={styles.largeText} text={getRoleText(user.role)} />
      </View>
      {showStatus && (
        <View style={[componentStyles.statusWrapper, { paddingHorizontal: 16 }]}>
          {userStatusEmoji && (
            <Emoji
              code={userStatusEmoji.emoji_code}
              type={emojiTypeFromReactionType(userStatusEmoji.reaction_type)}
              size={24}
            />
          )}
          {userStatusEmoji && userStatusText !== null && <View style={{ width: 2 }} />}
          {userStatusText !== null && (
            <ZulipText
              style={[styles.largerText, componentStyles.statusText]}
              text={userStatusText}
            />
          )}
        </View>
      )}
    </ComponentList>
  );
}
