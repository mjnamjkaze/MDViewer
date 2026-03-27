const { contextBridge, ipcRenderer } = require('electron');
const markdownIt = require('markdown-it');
const hljs = require('highlight.js');
const taskLists = require('markdown-it-task-lists');
const path = require('path');

// Initialize markdown-it with CommonMark spec + extensions
const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>';
      } catch (_) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
}).use(taskLists, { enabled: true, label: true, labelAfter: true });

const defaultRender = md.renderer.rules.fence || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};
md.renderer.rules.fence = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  if (token.info.trim() === 'mermaid') {
    return `<div class="mermaid">${md.utils.escapeHtml(token.content)}</div>`;
  }
  return defaultRender(tokens, idx, options, env, self);
};

contextBridge.exposeInMainWorld('mdviewer', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  getFileToOpen: () => ipcRenderer.invoke('get-file-to-open'),
  
  // Render markdown to HTML in preload (has Node.js access)
  renderMarkdown: (content, dirPath) => {
    let html = md.render(content);
    
    // Fix relative image paths
    if (dirPath) {
      html = html.replace(/(<img[^>]+src=")(?!http|data:|file:)([^"]+)(")/g, (match, pre, src, post) => {
        const absPath = path.resolve(dirPath, src).replace(/\\/g, '/');
        return `${pre}file:///${absPath}${post}`;
      });
    }
    
    return html;
  },

  onFileOpened: (callback) => {
    ipcRenderer.on('file-opened', (event, data) => callback(data));
  },
  onToggleTheme: (callback) => {
    ipcRenderer.on('toggle-theme', () => callback());
  },
  onToggleJsonFormat: (callback) => {
    ipcRenderer.on('toggle-json-format', () => callback());
  }
});
