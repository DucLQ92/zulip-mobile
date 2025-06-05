/* @flow strict-local */
import { PixelRatio } from 'react-native';
import invariant from 'invariant';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import * as poll_data from '@zulip/shared/lib/poll_data';

import enUS from 'date-fns/locale/en-US';
import vi from 'date-fns/locale/vi';
import template from './template';
import type {
  AggregatedReaction,
  FlagsState,
  GetText,
  Message,
  MessageLike,
  MessageMessageListElement,
  Outbox,
  Reaction,
  SubmessageData,
  UserId,
  UserStatus,
  WidgetData,
} from '../../types';
import type { BackgroundData } from '../backgroundData';
import { shortTime } from '../../utils/date';
import aggregateReactions from '../../reactions/aggregateReactions';
import { displayCharacterForUnicodeEmojiCode } from '../../emoji/data';
import processAlertWords from './processAlertWords';
import * as logging from '../../utils/logging';
import { getUserStatusFromModel } from '../../user-statuses/userStatusesCore';
import { getFullNameOrMutedUserText, getFullNameText } from '../../users/userSelectors';

// Map locale code với module tương ứng
const localeMap = {
  en: enUS,
  vi,
};

// Get device locale and convert to date-fns locale
const getDeviceLocale = () => {
  try {
    // Sử dụng Intl API để lấy locale hiện tại
    const deviceLocale = Intl.DateTimeFormat().resolvedOptions().locale;

    // Kiểm tra nếu deviceLocale undefined/null thì dùng fallback
    if (!deviceLocale || typeof deviceLocale !== 'string') {
      return vi; // Fallback to English
    }

    // Convert locale format (e.g. 'vi-VN' to 'vi')
    const localeCode = deviceLocale.split('-')[0];
    return localeMap[localeCode] || vi;
  } catch (error) {
    // Fallback nếu có lỗi
    return vi;
  }
};

const messageTagsAsHtml = (isStarred: boolean, timeEdited: number | void, _: GetText): string => {
  const pieces = [];
  if (timeEdited !== undefined) {
    const editedTime = formatDistanceToNow(timeEdited * 1000, { locale: getDeviceLocale() });
    pieces.push(template`<span class="message-tag">${_('edited {time} ago', { time: editedTime })}</span>`);
  }
  if (isStarred) {
    pieces.push(template`<span class="message-tag">${_('starred')}</span>`);
  }
  return !pieces.length ? '' : template`<div class="message-tags">$!${pieces.join('')}</div>`;
};

// Like get_display_full_names in the web app's people.js, but also gives
// "You" so callers don't have to.
const  getDisplayFullNames = (userIds, backgroundData, _) => {
  const { allUsersById, mutedUsers, ownUser, enableGuestUserIndicator } = backgroundData;
  return userIds.map(id => {
    const user = allUsersById.get(id);
    if (!user) {
      logging.warn('render reaction: no user for ID', { id });
      return '?';
    }

    if (id === ownUser.user_id) {
      return _('You');
    }

    // TODO use italics for "(guest)"
    return _(getFullNameOrMutedUserText({ user, mutedUsers, enableGuestUserIndicator }));
  });
};

const messageReactionAsHtml = (
  backgroundData: BackgroundData,
  reaction: AggregatedReaction,
  shouldShowNames: boolean,
  _: GetText,
  isOwn: boolean,
  messageId: number,
): string => {
  const { allImageEmojiById, allUsersById } = backgroundData;

  // Lấy tối đa 3 user đầu tiên để hiện avatar
  const displayUsers = reaction.users.slice(0, 3);
  const remainingCount = reaction.users.length - displayUsers.length;

  // Tạo HTML cho các avatar
  const avatarsHtml = displayUsers
    .map(userId => {
      const user = allUsersById.get(userId);
      if (!user) {
        return '';
      }
      // Lấy avatar URL với kích thước 48px
      const avatarUrl = user.avatar_url
        .get(PixelRatio.getPixelSizeForLayoutSize(48))
        .toString();
      return template`<img class="reaction-avatar" src="${avatarUrl}" alt="${user.full_name || ''}" />`;
    })
    .join('');

  // Tạo HTML cho số người còn lại nếu có
  const remainingCountHtml = remainingCount > 0 ? template`<span class="reaction-count">+${remainingCount}</span>` : '';

  return template`<span onClick="(function(e) {
    e.stopPropagation();
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'reaction',
      messageId: ${messageId},
      code: '${reaction.code}',
      name: '${reaction.name}',
      reactionType: '${reaction.type}',
      voted: ${reaction.selfReacted ? 'true' : 'false'}
    }));
  })(event)" class="${isOwn ? 'reaction-own' : 'reaction'}${reaction.selfReacted ? ' self-voted' : ''}"
    data-name="${reaction.name}"
    data-code="${reaction.code}"
    data-type="${reaction.type}">
    <span class="reaction-emoji">$!${
      allImageEmojiById[reaction.code]
        ? template`<img src="${allImageEmojiById[reaction.code].source_url}"/>`
        : displayCharacterForUnicodeEmojiCode(reaction.code, backgroundData.serverEmojiData)
    }</span>
    <span class="reaction-users">$!${avatarsHtml}$!${remainingCountHtml}</span>
  </span>`;
};

const messageReactionListAsHtml = (
  backgroundData: BackgroundData,
  reactions: $ReadOnlyArray<Reaction>,
  _: GetText,
  isOwn: boolean,
  messageId: number,
): string => {
  const { ownUser, displayEmojiReactionUsers } = backgroundData;

  if (reactions.length === 0) {
    return '';
  }

  // Mặc định không hiển thị tên người react
  const shouldShowNames = false;

  // See the web app's get_vote_text in its reactions.js.
  // const shouldShowNames =
  //   displayEmojiReactionUsers
  //   // The API lets clients choose the threshold. We use 3 like the web app.
  //   && reactions.length <= 3;

  const htmlList = aggregateReactions(reactions, ownUser.user_id).map(r =>
    messageReactionAsHtml(backgroundData, r, shouldShowNames, _, isOwn, messageId),
  );
  return template`<div class="reaction-list">$!${htmlList.join('')}</div>`;
};

const messageBody = (backgroundData: BackgroundData, message: Message | Outbox, _: GetText) => {
  const { alertWords, flags } = backgroundData;
  const { id, isOutbox, last_edit_timestamp, match_content, reactions } = (message: MessageLike);
  const content = match_content ?? message.content;
  const isOwn = backgroundData.ownUser.user_id === message.sender_id;

  const  handleBlockQuote = (html) => {
    try {
      const needReplace = message.typeBlock !== 'mentioned' && message.typeBlock !== 'starred' && message.typeBlock !== 'all';

      // Process quotes recursively để handle nested quotes
      const processQuotesRecursively = inputHtml => {
        let currentHtml = inputHtml;
        let previousHtml = '';
        let iterations = 0;
        const maxIterations = 10; // Safety limit để tránh infinite loop

        // Lặp cho đến khi không còn thay đổi gì (tức là đã xử lý hết tất cả quotes)
        while (currentHtml !== previousHtml && iterations < maxIterations) {
          previousHtml = currentHtml;
          iterations++;

          // Pattern để tìm <p> chứa user-mention + href, theo sau bởi blockquote
          const quotePattern = /<p[^>]*>.*?<span[^>]*class="[^"]*user-mention[^"]*"[^>]*>([^<]*)<\/span>.*?<a[^>]*href="([^"]*)"[^>]*>.*?<\/a>.*?<\/p>\s*(<blockquote[^>]*>[\s\S]*?<\/blockquote>)/gi;

          currentHtml = currentHtml.replace(quotePattern, (match, userName, href, blockquoteHtml) => {
            const cleanUserName = userName.replace(/^@/, '').trim();

            // Escape href for safe usage in onclick
            const escapedHref = href
              .replace(/&/g, '&amp;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');

            // Create onclick handler
            const onclickHandler = `(function(e) { e.stopPropagation(); window.ReactNativeWebView.postMessage(JSON.stringify({type: 'url', href: '${escapedHref}', needReplace: ${String(needReplace)}})) })(event)`;

            // Update blockquote với class và onclick
            return blockquoteHtml
                .replace(/<blockquote([^>]*)>/i, `<blockquote$1 class="${isOwn ? 'blockquote-own' : 'blockquote'}" onclick="${onclickHandler}">`)
                .replace(/(<blockquote[^>]*>)/, `$1<div class="${isOwn ? 'quote-author-own' : 'quote-author'}">${cleanUserName}:</div>`);
          });
        }

        return currentHtml;
      };

      // Process HTML với recursive logic
      return processQuotesRecursively(html);
    } catch (error) {
      // Log error và return original HTML
      logging.warn('handleBlockQuote: Error processing HTML', {
        error: error.message,
        html: html.substring(0, 100)
      });
      return html;
    }
  };

  // Xử lý quote message
  const processedContent = handleBlockQuote(content);

  return template`\
$!${processAlertWords(processedContent, id, alertWords, flags)}
$!${isOutbox === true ? '<div class="loading-spinner outbox-spinner"></div>' : ''}
$!${messageTagsAsHtml(!!flags.starred[id], last_edit_timestamp, _)}
$!${messageReactionListAsHtml(backgroundData, reactions, _, isOwn, message.id)}`;
};

/**
 * Render the body of a message that has submessages.
 *
 * Must not be called on a message without any submessages.
 */
const widgetBody = (message: Message, ownUserId: UserId) => {
  invariant(
    message.submessages !== undefined && message.submessages.length > 0,
    'should have submessages',
  );

  const widgetSubmessages: Array<{
    sender_id: number,
    content: SubmessageData,
    ...
  }> = message.submessages
    .filter(submessage => submessage.msg_type === 'widget')
    .sort((m1, m2) => m1.id - m2.id)
    .map(submessage => ({
      sender_id: submessage.sender_id,
      content: JSON.parse(submessage.content),
    }));

  const errorMessage = template`\
$!${message.content}
<div class="special-message"
 ><p>Interactive message</p
 ><p>To use, open on web or desktop</p
></div>`;

  const pollWidget = widgetSubmessages.shift();
  if (!pollWidget || !pollWidget.content) {
    return errorMessage;
  }

  /* $FlowFixMe[incompatible-type]: The first widget submessage should be
       a `WidgetData`; see jsdoc on `SubmessageData`. */
  const pollWidgetContent: WidgetData = pollWidget.content;

  if (pollWidgetContent.widget_type !== 'poll') {
    return errorMessage;
  }

  if (pollWidgetContent.extra_data == null) {
    // We don't expect this to happen in general, but there are some malformed
    // messages lying around that will trigger this [1]. The code here is slightly
    // different the webapp code, but mostly because the current webapp
    // behaviour seems accidental: an error is printed to the console, and the
    // code that is written to handle the situation is never reached.  Instead
    // of doing that, we've opted to catch this case here, and print out the
    // message (which matches the behaviour of the webapp, minus the console
    // error, although it gets to that behaviour in a different way). The bug
    // tracking fixing this on the webapp side is zulip/zulip#19145.
    // [1]: https://chat.zulip.org/#narrow/streams/public/near/582872
    return template`$!${message.content}`;
  }

  const pollData = new poll_data.PollData({
    message_sender_id: message.sender_id,
    current_user_id: ownUserId,
    is_my_poll: message.sender_id === ownUserId,
    question: pollWidgetContent.extra_data.question ?? '',
    options: pollWidgetContent.extra_data.options ?? [],
    // TODO: Implement this.
    comma_separated_names: () => '',
    report_error_function: (msg: string) => {
      logging.error(msg);
    },
  });

  for (const pollEvent of widgetSubmessages) {
    pollData.handle_event(pollEvent.sender_id, pollEvent.content);
  }

  const parsedPollData = pollData.get_widget_data();

  return template`\
<div class="poll-widget">
  <p class="poll-question">${parsedPollData.question}</p>
  <ul>
    $!${parsedPollData.options
      .map(
        option =>
          template`
        <li>
          <button
            class="poll-vote"
            data-voted="${option.current_user_vote ? 'true' : 'false'}"
            data-key="${option.key}"
          >${option.count}</button>
          <span class="poll-option">${option.option}</span>
        </li>`,
      )
      .join('')}
  </ul>
</div>`;
};

export const flagsStateToStringList = (flags: FlagsState, id: number): $ReadOnlyArray<string> =>
  Object.keys(flags).filter(key => flags[key][id]);

const senderEmojiStatus = (
  emoji: UserStatus['status_emoji'],
  backgroundData: BackgroundData,
): string =>
  emoji
    ? backgroundData.allImageEmojiById[emoji.emoji_code]
      ? template`\
<img
  class="status-emoji"
  src="${backgroundData.allImageEmojiById[emoji.emoji_code].source_url}"
/>`
      : template`\
<span class="status-emoji">$!${displayCharacterForUnicodeEmojiCode(
          emoji.emoji_code,
          backgroundData.serverEmojiData,
        )}</span>`
    : '';

/**
 * The HTML string for a message-list element of the "message" type.
 *
 * This is a private helper of messageListElementHtml.
 */
export default (
  backgroundData: BackgroundData,
  element: MessageMessageListElement,
  _: GetText,
): string => {
  const { message, isBrief } = element;
  const { id, timestamp } = message;
  const flagStrings = flagsStateToStringList(backgroundData.flags, id);
  const isUserMuted = !!message.sender_id && backgroundData.mutedUsers.has(message.sender_id);
  const isOwn = backgroundData.ownUser.user_id === message.sender_id;

  const linkToMessage = message.type === 'private'
      ? `${backgroundData.auth.realm.toString()}#narrow/dm/${message.display_recipient.map(e => e.id).join(',')}-group/near/${message.id}`
      : `${backgroundData.auth.realm.toString()}#narrow/stream/${message.stream_id}/topic/${encodeURIComponent(message.subject).replace(/\./g, '%2E')}/near/${message.id}`;
  const onclick = message.typeBlock === 'mentioned' || message.typeBlock === 'starred' || message.typeBlock === 'all'
      ? `(function(e) { 
          e.stopPropagation(); 
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'url',
            href: '${linkToMessage}'
          }))
        })(event)`
      : '';

  const divOpenHtml = isOwn ? template`\
<div
  class="msglist-element message ${isBrief ? 'message-brief-own' : 'message-full'}"
  id="msg-${id}"
  data-msg-id="${id}"
  data-mute-state="${isUserMuted ? 'hidden' : 'shown'}"
  style="direction: rtl"
  onclick="${onclick}"
  $!${flagStrings.map(flag => template`data-${flag}="true" `).join('')}
>` : template`\
<div
  class="msglist-element message ${isBrief ? 'message-brief' : 'message-full'}"
  id="msg-${id}"
  data-msg-id="${id}"
  data-mute-state="${isUserMuted ? 'hidden' : 'shown'}"
  style="direction: ltr"
  onclick="${onclick}"
  $!${flagStrings.map(flag => template`data-${flag}="true" `).join('')}
>`;
  const messageTime = shortTime(new Date(timestamp * 1000), backgroundData.twentyFourHourTime);

  const timestampHtml = (showOnRender: boolean) => template`\
<div class="time-container">
  <div class="msg-timestamp ${showOnRender ? 'show' : ''}">
    ${messageTime}
  </div>
</div>`;
  const bodyHtml =
    message.submessages && message.submessages.length > 0
      ? widgetBody(message, backgroundData.ownUser.user_id)
      : messageBody(backgroundData, message, _);

  if (isBrief) {
    return template`\
$!${divOpenHtml}
  <div class="${isOwn ? 'content-own' : 'content'}">
    $!${timestampHtml(false)}
    $!${bodyHtml}
  </div>
</div>`;
  }

  const { sender_id } = message;
  const sender = backgroundData.allUsersById.get(sender_id) ?? null;
  const senderFullName = _(
    // TODO use italics for "(guest)"
    getFullNameText({
      user: sender,
      enableGuestUserIndicator: backgroundData.enableGuestUserIndicator,
      fallback: message.sender_full_name,
    }),
  );
  const avatarUrl = message.avatar_url
    .get(
      // 48 logical pixels; see `.avatar` and `.avatar img` in
      // src/webview/static/base.css.
      PixelRatio.getPixelSizeForLayoutSize(48),
    )
    .toString();
  const subheaderHtml = template`\
<div class="subheader">
  <div class="name-and-status-emoji" data-sender-id="${sender_id}">
    ${senderFullName}$!${senderEmojiStatus(
    getUserStatusFromModel(backgroundData.userStatuses, sender_id).status_emoji,
    backgroundData,
  )}
  </div>
  <div class="${isOwn ? 'static-timestamp-own' : 'static-timestamp'}">${messageTime}</div>
</div>`;
  const mutedMessageHtml = isUserMuted
    ? template`\
<div class="special-message muted-message-explanation">
  ${_('This message was hidden because it is from a user you have muted. Long-press to view.')}
</div>`
    : '';

  return template`\
$!${divOpenHtml}
  <div class= "${isOwn ? 'avatar-own' : 'avatar'}">
    <img src="${avatarUrl}" alt="${senderFullName}" class="${isOwn ? 'avatar-own-img' : 'avatar-img'}" data-sender-id="${sender_id}">
  </div>
  <div class="${isOwn ? 'content-own' : 'content'}">
    $!${subheaderHtml}
    $!${bodyHtml}
  </div>
  $!${mutedMessageHtml}
</div>`;
};
