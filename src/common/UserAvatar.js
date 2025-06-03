/* @flow strict-local */
import React, { useContext, useState } from 'react';
import type { Node } from 'react';
import { Image, View, PixelRatio, ActivityIndicator } from 'react-native';

import { useSelector } from '../react-redux';
import { getAuthHeaders } from '../api/transport';
import { getAuth } from '../account/accountsSelectors';
import Touchable from './Touchable';
import { AvatarURL, FallbackAvatarURL } from '../utils/avatar';
import { IconUserBlank } from './Icons';
import { ThemeContext } from '../styles';

type Props = $ReadOnly<{|
  avatarUrl: AvatarURL | null,
  size: number,
  isMuted?: boolean,
  children?: Node,
  onPress?: () => void,
|}>;

/**
 * Renders an image of the user's avatar.
 *
 * @prop avatarUrl
 * @prop size - Sets width and height in logical pixels.
 * @prop [children] - If provided, will render inside the component body.
 * @prop [onPress] - Event fired on pressing the component.
 */
function UserAvatar(props: Props): Node {
  const { avatarUrl, children, size, isMuted = false, onPress } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const borderRadius = size / 8;
  const style = {
    height: size,
    width: size,
    borderRadius,
  };
  const iconStyle = {
    height: size,
    width: size,
    textAlign: 'center',
  };

  const { color } = useContext(ThemeContext);

  const auth = useSelector(state => getAuth(state));

  let userImage;
  if (isMuted || !avatarUrl || hasError) {
    // Hiển thị fallback icon khi muted, không có avatar, hoặc load lỗi
    userImage = <IconUserBlank size={size} color={color} style={iconStyle} />;
  } else {
    userImage = (
      <View style={style}>
        <Image
          source={{
            uri: avatarUrl.get(PixelRatio.getPixelSizeForLayoutSize(size)).toString(),
            ...(avatarUrl instanceof FallbackAvatarURL
              ? { headers: getAuthHeaders(auth) }
              : undefined),
          }}
          style={style}
          resizeMode="cover"
          onLoadStart={() => {
            setIsLoading(true);
            setHasError(false);
          }}
          onLoadEnd={() => {
            setIsLoading(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
        {/* Hiển thị loading spinner khi đang tải ảnh */}
        {isLoading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderRadius,
            }}
          >
            <ActivityIndicator size="small" color={color} />
          </View>
        )}
      </View>
    );
  }

  return (
    <Touchable onPress={onPress}>
      <View accessibilityIgnoresInvertColors>
        {userImage}
        {children}
      </View>
    </Touchable>
  );
}

export default UserAvatar;
