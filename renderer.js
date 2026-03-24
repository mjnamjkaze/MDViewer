// DOM elements
const fileName = document.getElementById('fileName');
const welcomeScreen = document.getElementById('welcomeScreen');
const contentWrapper = document.getElementById('contentWrapper');
const markdownContent = document.getElementById('markdownContent');
const openBtn = document.getElementById('openBtn');
const themeBtn = document.getElementById('themeBtn');
const welcomeOpenBtn = document.getElementById('welcomeOpenBtn');
const dropOverlay = document.getElementById('dropOverlay');

// Current state
let currentDirPath = '';

// Render markdown content
function displayMarkdown(content, dirPath) {
  currentDirPath = dirPath || '';
  const html = window.mdviewer.renderMarkdown(content, currentDirPath);
  markdownContent.innerHTML = html;

  // Make external links open in browser
  const links = markdownContent.querySelectorAll('a[href]');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        // Open in default browser via shell
        window.open(href, '_blank');
      });
    }
  });

  // Show content, hide welcome
  welcomeScreen.style.display = 'none';
  contentWrapper.style.display = 'block';
  contentWrapper.scrollTop = 0;
}

// Theme management
function getTheme() {
  return localStorage.getItem('mdviewer-theme') || 'dark';
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

// Event listeners
openBtn.addEventListener('click', () => window.mdviewer.openFileDialog());
welcomeOpenBtn.addEventListener('click', () => window.mdviewer.openFileDialog());
themeBtn.addEventListener('click', toggleTheme);

// IPC listeners
window.mdviewer.onFileOpened((data) => {
  fileName.textContent = data.fileName;
  displayMarkdown(data.content, data.dirPath);
});

window.mdviewer.onToggleTheme(() => {
  toggleTheme();
});

// Drag and drop
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
    if (ext === 'md' || ext === 'markdown') {
      const result = await window.mdviewer.readFile(file.path);
      if (result.success) {
        fileName.textContent = name;
        // Extract dir from file path
        const filePath = file.path;
        const dirPath = filePath.substring(0, filePath.lastIndexOf('\\')) || filePath.substring(0, filePath.lastIndexOf('/'));
        displayMarkdown(result.content, dirPath);
      }
    }
  }
});
