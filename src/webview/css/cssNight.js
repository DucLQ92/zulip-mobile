/* @flow strict-local */

export default `
body {
  color: rgb(255, 255, 255);
  background: hsl(220, 25%, 15%);
}
.poll-vote {
  color: hsl(210, 11%, 85%);
}
.topic-header {
  background: hsl(212, 13%, 38%);
}
.msg-timestamp {
  background: hsl(212, 28%, 25%);
}
.highlight {
  background-color: hsla(51, 100%, 64%, 0.42);
}
.message_inline_image img.image-loading-placeholder {
  content: url("images/loader-white.svg");
}
.content {
  background-color: rgba(45, 55, 72, 0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.content-own {
  background-color: rgba(52, 73, 94, 0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.static-timestamp-own {
  color: rgba(255, 255, 255, 0.5);
}
.blockquote {
  background: rgba(199, 124, 56, 0.15);
  border-color: rgb(199, 124, 56);
  border-radius: 4px;
}
.blockquote-own {
  background: rgba(146, 95, 236, 0.15);
  border-color: #ffffff;
  border-radius: 4px;
}
.quote-author {
  color: rgb(199, 124, 56);
  fontWeight: '600';
  fontSize: '0.95em';
  letterSpacing: '0.3px';
  display: inline-block;
}
.quote-author-own {
  color: #ffffff;
  fontWeight: '600';
  fontSize: '0.95em';
  letterSpacing: '0.3px';
  display: inline-block;
}
.quote-content {
  color: rgba(255, 255, 255, 0.9);
}

/* Reaction styles for dark mode */
.reaction {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
}

.reaction-own {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
}

.reaction-avatar {
  border: 1px solid rgba(51, 57, 63, 0.95);
  background: rgba(51, 57, 63, 0.95);
}

.reaction-count {
  color: rgba(255, 255, 255, 0.5);
}

.self-voted {
  color: hsl(222, 99%, 69%);
  background: rgba(222, 99%, 69%, 0.2);
}

/* Mention styles for dark mode */
.topic-mention,
.user-group-mention,
.user-mention {
  background-color: hsla(222, 99%, 69%, 0.15);
  color: hsl(222, 99%, 75%);
  box-shadow: 0 0 0 1px hsla(222, 99%, 69%, 0.3);
}

.topic-mention:hover,
.user-group-mention:hover,
.user-mention:hover {
  background-color: hsla(222, 99%, 69%, 0.2);
  box-shadow: 0 0 0 1px hsla(222, 99%, 69%, 0.4);
}
`;
