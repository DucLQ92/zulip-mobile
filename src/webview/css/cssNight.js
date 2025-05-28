/* @flow strict-local */

export default `
body {
  color: rgb(255, 255, 255);
  background: hsl(212, 28%, 18%);
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
  background-color: rgba(51, 57, 63, 0.95);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.content-own {
  background-color: rgba(121, 68, 198, 0.95);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.static-timestamp-own {
  color: rgba(255, 255, 255, 0.5);
}
.blockquote {
  background: rgb(66, 47, 39);
  border-radius: 4px;
  border-color: rgb(199, 124, 56);
}
.blockquote-own {
  background: rgb(146, 95, 236);
  border-radius: 4px;
  border-color: #ffffff;
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
`;
