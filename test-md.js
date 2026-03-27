const markdownIt = require('markdown-it');
const md = markdownIt({
  html: true
});

const defaultRender = md.renderer.rules.fence;
md.renderer.rules.fence = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  if (token.info.trim() === 'mermaid') {
    return '<div class="mermaid">' + md.utils.escapeHtml(token.content) + '</div>';
  }
  return defaultRender(tokens, idx, options, env, self);
};

console.log(md.render('```mermaid\ngraph TD;\n    A-->B;\n```'));
