// DOM elements
const fileName = document.getElementById('fileName');
const welcomeScreen = document.getElementById('welcomeScreen');
const contentWrapper = document.getElementById('contentWrapper');
const markdownContent = document.getElementById('markdownContent');
const jsonContent = document.getElementById('jsonContent');
const jsonToolbar = document.getElementById('jsonToolbar');
const jsonFormatBtn = document.getElementById('jsonFormatBtn');
const jsonFormatLabel = document.getElementById('jsonFormatLabel');
const jsonExpandAllBtn = document.getElementById('jsonExpandAllBtn');
const jsonCollapseAllBtn = document.getElementById('jsonCollapseAllBtn');
const openBtn = document.getElementById('openBtn');
const themeBtn = document.getElementById('themeBtn');
const welcomeOpenBtn = document.getElementById('welcomeOpenBtn');
const dropOverlay = document.getElementById('dropOverlay');

// Current state
let currentDirPath = '';
let currentFileType = 'markdown';
let currentJsonData = null;
let currentJsonRaw = '';
let jsonViewMode = 'pretty'; // 'pretty' or 'raw'

// Determine file type from name
function getFileTypeFromName(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'json') return 'json';
  return 'markdown';
}

// Render markdown content
function displayMarkdown(content, dirPath) {
  currentDirPath = dirPath || '';
  currentFileType = 'markdown';
  const html = window.mdviewer.renderMarkdown(content, currentDirPath);
  markdownContent.innerHTML = html;

  // Make external links open in browser
  const links = markdownContent.querySelectorAll('a[href]');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(href, '_blank');
      });
    }
  });

  // Show markdown, hide JSON
  welcomeScreen.style.display = 'none';
  jsonContent.style.display = 'none';
  jsonToolbar.style.display = 'none';
  markdownContent.style.display = 'block';
  contentWrapper.style.display = 'block';
  contentWrapper.scrollTop = 0;
}

// ==================== JSON Viewer ====================

function displayJson(content) {
  currentFileType = 'json';
  currentJsonRaw = content;

  try {
    currentJsonData = JSON.parse(content);
  } catch (e) {
    // Show parse error
    jsonContent.innerHTML = `<div class="json-error">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      <strong>Invalid JSON</strong>
      <span>${escapeHtml(e.message)}</span>
    </div>`;
    welcomeScreen.style.display = 'none';
    markdownContent.style.display = 'none';
    jsonContent.style.display = 'block';
    jsonToolbar.style.display = 'none';
    contentWrapper.style.display = 'block';
    return;
  }

  jsonViewMode = 'pretty';
  updateJsonFormatButton();
  renderJsonView();

  welcomeScreen.style.display = 'none';
  markdownContent.style.display = 'none';
  jsonContent.style.display = 'block';
  jsonToolbar.style.display = 'flex';
  contentWrapper.style.display = 'block';
  contentWrapper.scrollTop = 0;
}

function renderJsonView() {
  if (jsonViewMode === 'pretty') {
    jsonContent.innerHTML = '';
    const tree = document.createElement('div');
    tree.className = 'json-tree';
    tree.appendChild(buildJsonNode(currentJsonData, null, true));
    jsonContent.appendChild(tree);
  } else {
    const formatted = JSON.stringify(currentJsonData, null, 2);
    jsonContent.innerHTML = `<pre class="json-raw hljs"><code>${syntaxHighlightRaw(formatted)}</code></pre>`;
  }
}

function toggleJsonFormat() {
  if (currentFileType !== 'json' || !currentJsonData) return;
  jsonViewMode = jsonViewMode === 'pretty' ? 'raw' : 'pretty';
  updateJsonFormatButton();
  renderJsonView();
}

function updateJsonFormatButton() {
  if (jsonViewMode === 'pretty') {
    jsonFormatLabel.textContent = 'Pretty';
    jsonFormatBtn.classList.add('active');
  } else {
    jsonFormatLabel.textContent = 'Raw';
    jsonFormatBtn.classList.remove('active');
  }
}

// Build a JSON tree node recursively
function buildJsonNode(value, key, isRoot) {
  const wrapper = document.createElement('div');
  wrapper.className = 'json-node';

  if (value === null) {
    wrapper.appendChild(createLeafLine(key, '<span class="json-null">null</span>', isRoot));
    return wrapper;
  }

  const type = typeof value;

  if (type === 'object' && (Array.isArray(value) || type === 'object')) {
    const isArray = Array.isArray(value);
    const entries = isArray ? value : Object.entries(value);
    const count = isArray ? value.length : Object.keys(value).length;
    const openBrace = isArray ? '[' : '{';
    const closeBrace = isArray ? ']' : '}';

    // Collapsible header
    const header = document.createElement('div');
    header.className = 'json-collapsible';

    const arrow = document.createElement('span');
    arrow.className = 'json-arrow expanded';
    arrow.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l8 7-8 7z"/></svg>`;

    header.appendChild(arrow);

    if (key !== null && key !== undefined) {
      const keySpan = document.createElement('span');
      keySpan.className = 'json-key';
      keySpan.textContent = isRoot ? '' : `"${key}"`;
      if (!isRoot) {
        header.appendChild(keySpan);
        const colon = document.createElement('span');
        colon.className = 'json-colon';
        colon.textContent = ': ';
        header.appendChild(colon);
      }
    }

    const braceOpen = document.createElement('span');
    braceOpen.className = 'json-brace';
    braceOpen.textContent = openBrace;
    header.appendChild(braceOpen);

    const badge = document.createElement('span');
    badge.className = 'json-badge';
    badge.textContent = `${count} ${isArray ? (count === 1 ? 'item' : 'items') : (count === 1 ? 'key' : 'keys')}`;
    header.appendChild(badge);

    wrapper.appendChild(header);

    // Children container
    const children = document.createElement('div');
    children.className = 'json-children';

    if (isArray) {
      value.forEach((item, idx) => {
        children.appendChild(buildJsonNode(item, idx, false));
      });
    } else {
      Object.entries(value).forEach(([k, v]) => {
        children.appendChild(buildJsonNode(v, k, false));
      });
    }

    wrapper.appendChild(children);

    // Closing brace
    const closeLine = document.createElement('div');
    closeLine.className = 'json-close-brace';
    closeLine.textContent = closeBrace;
    wrapper.appendChild(closeLine);

    // Toggle click
    let expanded = true;
    arrow.addEventListener('click', (e) => {
      e.stopPropagation();
      expanded = !expanded;
      arrow.classList.toggle('expanded', expanded);
      children.classList.toggle('collapsed', !expanded);
      closeLine.classList.toggle('collapsed', !expanded);
      badge.classList.toggle('visible', !expanded);
    });

    header.addEventListener('click', () => {
      expanded = !expanded;
      arrow.classList.toggle('expanded', expanded);
      children.classList.toggle('collapsed', !expanded);
      closeLine.classList.toggle('collapsed', !expanded);
      badge.classList.toggle('visible', !expanded);
    });

    return wrapper;
  }

  // Primitive values
  let valueHtml = '';
  if (type === 'string') {
    valueHtml = `<span class="json-string">"${escapeHtml(value)}"</span>`;
  } else if (type === 'number') {
    valueHtml = `<span class="json-number">${value}</span>`;
  } else if (type === 'boolean') {
    valueHtml = `<span class="json-boolean">${value}</span>`;
  } else {
    valueHtml = `<span class="json-unknown">${escapeHtml(String(value))}</span>`;
  }

  wrapper.appendChild(createLeafLine(key, valueHtml, isRoot));
  return wrapper;
}

function createLeafLine(key, valueHtml, isRoot) {
  const line = document.createElement('div');
  line.className = 'json-leaf';

  // Spacer for alignment with arrow
  const spacer = document.createElement('span');
  spacer.className = 'json-arrow-spacer';
  line.appendChild(spacer);

  if (key !== null && key !== undefined && !isRoot) {
    const keySpan = document.createElement('span');
    keySpan.className = 'json-key';
    keySpan.textContent = typeof key === 'number' ? `${key}` : `"${key}"`;
    line.appendChild(keySpan);

    const colon = document.createElement('span');
    colon.className = 'json-colon';
    colon.textContent = ': ';
    line.appendChild(colon);
  }

  const valContainer = document.createElement('span');
  valContainer.innerHTML = valueHtml;
  line.appendChild(valContainer);

  return line;
}

// Syntax highlight for raw JSON view
function syntaxHighlightRaw(json) {
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
    let cls = 'json-number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'json-key';
        return `<span class="${cls}">${escapeHtml(match.slice(0, -1))}</span>:`;
      } else {
        cls = 'json-string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'json-boolean';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    return `<span class="${cls}">${escapeHtml(match)}</span>`;
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Expand/collapse all JSON nodes
function expandAllJson() {
  jsonContent.querySelectorAll('.json-arrow').forEach(arrow => {
    arrow.classList.add('expanded');
  });
  jsonContent.querySelectorAll('.json-children, .json-close-brace').forEach(el => {
    el.classList.remove('collapsed');
  });
  jsonContent.querySelectorAll('.json-badge').forEach(el => {
    el.classList.remove('visible');
  });
}

function collapseAllJson() {
  jsonContent.querySelectorAll('.json-arrow').forEach(arrow => {
    arrow.classList.remove('expanded');
  });
  jsonContent.querySelectorAll('.json-children, .json-close-brace').forEach(el => {
    el.classList.add('collapsed');
  });
  jsonContent.querySelectorAll('.json-badge').forEach(el => {
    el.classList.add('visible');
  });
}

// ==================== Theme Management ====================

function getTheme() {
  return localStorage.getItem('mdviewer-theme') || 'light';
}

function setTheme(theme) {
  document.body.className = 'theme-' + theme;
  localStorage.setItem('mdviewer-theme', theme);
}

function toggleTheme() {
  const current = getTheme();
  setTheme(current === 'dark' ? 'light' : 'dark');
}

// Initialize theme
setTheme(getTheme());

// ==================== Event Listeners ====================

openBtn.addEventListener('click', () => window.mdviewer.openFileDialog());
welcomeOpenBtn.addEventListener('click', () => window.mdviewer.openFileDialog());
themeBtn.addEventListener('click', toggleTheme);
jsonFormatBtn.addEventListener('click', toggleJsonFormat);
jsonExpandAllBtn.addEventListener('click', expandAllJson);
jsonCollapseAllBtn.addEventListener('click', collapseAllJson);

// IPC listeners
window.mdviewer.onFileOpened((data) => {
  fileName.textContent = data.fileName;
  const fileType = data.fileType || getFileTypeFromName(data.fileName);
  if (fileType === 'json') {
    displayJson(data.content);
  } else {
    displayMarkdown(data.content, data.dirPath);
  }
});

window.mdviewer.onToggleTheme(() => {
  toggleTheme();
});

window.mdviewer.onToggleJsonFormat(() => {
  toggleJsonFormat();
});

// ==================== Drag and Drop ====================

let dragCounter = 0;

document.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragCounter++;
  dropOverlay.classList.add('active');
});

document.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    dropOverlay.classList.remove('active');
  }
});

document.addEventListener('dragover', (e) => {
  e.preventDefault();
});

document.addEventListener('drop', async (e) => {
  e.preventDefault();
  dragCounter = 0;
  dropOverlay.classList.remove('active');

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    const name = file.name;
    const ext = name.split('.').pop().toLowerCase();
    if (ext === 'md' || ext === 'markdown' || ext === 'json') {
      const result = await window.mdviewer.readFile(file.path);
      if (result.success) {
        fileName.textContent = name;
        const filePath = file.path;
        const dirPath = filePath.substring(0, filePath.lastIndexOf('\\')) || filePath.substring(0, filePath.lastIndexOf('/'));
        if (ext === 'json') {
          displayJson(result.content);
        } else {
          displayMarkdown(result.content, dirPath);
        }
      }
    }
  }
});
