/* @flow strict-local */
import React, { useContext, useMemo } from 'react';
import { View, Text } from 'react-native';
import type { Message, Outbox, UserOrBot } from '../types';
import { ThemeContext, createStyleSheet } from '../styles';
import Touchable from '../common/Touchable';
import { IconCloseCircle } from '../common/Icons';

type Props = $ReadOnly<{|
  message: Message | Outbox,
  user: UserOrBot,
  rawContent: string,
  onRemove: () => void,
|}>;

// Hàm để extract content chính, loại bỏ nested quotes
function extractMainContent(rawContent: string): string {
  let mainContent = rawContent;
  let previousContent = '';
  let iterations = 0;
  const maxIterations = 10; // Safety limit để tránh infinite loop

  // Lặp lại cho đến khi không còn thay đổi gì (để handle nested quotes)
  while (mainContent !== previousContent && iterations < maxIterations) {
    previousContent = mainContent;
    iterations++;

    // Loại bỏ quote blocks với 4 backticks trước
    const quoteBlock4Regex = /````quote\n[\s\S]*?\n````/g;
    mainContent = mainContent.replace(quoteBlock4Regex, '');

    // Loại bỏ quote blocks với 3 backticks
    const quoteBlock3Regex = /```quote\n[\s\S]*?\n```/g;
    mainContent = mainContent.replace(quoteBlock3Regex, '');

    // Loại bỏ các mention links có thể có format:
    // @**name|id** [said](link): hoặc @_**name|id** [said](link):
    const mentionLinkRegex = /@_?\*\*[^*]+\*\*\s*\[said\]\([^)]+\):\s*/g;
    mainContent = mainContent.replace(mentionLinkRegex, '');

    // Loại bỏ các dòng trống liên tiếp
    mainContent = mainContent.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Trim whitespace và newlines
    mainContent = mainContent.trim();
  }

  return mainContent || rawContent; // Fallback to original if nothing left
}

export default function QuotePreview(props: Props): React$Node {
  const { message, user, rawContent, onRemove } = props;
  const { backgroundColor, color, themeName } = useContext(ThemeContext);

  const styles = useMemo(
    () =>
      createStyleSheet({
        outerContainer: {
          backgroundColor: 'hsla(0, 0%, 50%, 0.1)', // Giống composeBox background
          paddingTop: 8, // Padding top để tránh lẫn với chat
        },
        container: {
          marginHorizontal: 8,
          marginBottom: 8,
          backgroundColor: themeName === 'dark'
            ? 'rgba(255, 193, 7, 0.15)' // Amber cho dark mode
            : 'rgba(255, 152, 0, 0.1)', // Orange cho light mode
          borderLeftWidth: 3,
          borderLeftColor: themeName === 'dark'
            ? 'rgba(255, 193, 7, 0.8)' // Amber border cho dark mode
            : 'rgba(255, 152, 0, 0.8)', // Orange border cho light mode
          borderRadius: 6,
          padding: 12,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        },
        authorText: {
          fontSize: 14,
          fontWeight: '600',
          color: themeName === 'dark'
            ? 'rgba(255, 193, 7, 1)' // Amber text cho dark mode
            : 'rgba(255, 152, 0, 1)', // Orange text cho light mode
        },
        removeButton: {
          // Không có padding, icon to bằng button
        },
        contentText: {
          fontSize: 14,
          color,
          opacity: 0.8,
          lineHeight: 18,
        },
      }),
    [backgroundColor, color, themeName],
  );

  // Extract main content, loại bỏ nested quotes
  const mainContent = extractMainContent(rawContent);

  // Màu icon xám tùy theo theme
  const iconColor = themeName === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)';

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.authorText}>
            {user.full_name}
            :
          </Text>
          <Touchable style={styles.removeButton} onPress={onRemove}>
            <IconCloseCircle size={20} color={iconColor} />
          </Touchable>
        </View>
        <Text style={styles.contentText} numberOfLines={2}>
          {mainContent}
        </Text>
      </View>
    </View>
  );
}
