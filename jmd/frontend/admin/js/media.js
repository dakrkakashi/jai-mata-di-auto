/* ─── Media Manager Module ─── */
'use strict';

let mediaFolder = '';
let mediaFiles = [];
let selectedMedia = [];

async function loadMedia(folder = '') {
  mediaFolder = folder;
  updateBreadcrumb(folder);
  try {
    const data = await API.get('/api/admin/media?folder=' + encodeURIComponent(folder));
    mediaFiles = data.files || [];
    renderMedia();
    loadStorageStats();
  } catch { Toast.error('Failed to load media'); }
}

function renderMedia() {
  const grid = document.getElementById('media-grid');
  if (!grid) return;
  grid.replaceChildren();

  if (!mediaFiles.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = '🖼️';
    const p = document.createElement('p');
    p.textContent = 'No files here yet. Upload something!';
    emptyState.append(icon, p);
    grid.appendChild(emptyState);
    return;
  }

  mediaFiles.forEach(f => {
    const isImg = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f.name);
    const isDir = Boolean(f.isDir);

    const item = document.createElement('div');
    item.className = `media-item ${selectedMedia.includes(f.name) ? 'selected' : ''}`;
    item.onclick = () => toggleMediaSelect(f.name);
    item.ondblclick = () => {
      if (isDir) {
        loadMedia(`${mediaFolder ? mediaFolder + '/' : ''}${f.name}`);
      } else {
        insertMediaUrl(f.url);
      }
    };

    if (isDir) {
      const fileIcon = document.createElement('div');
      fileIcon.className = 'file-icon';
      fileIcon.append('📁');
      const dirSpan = document.createElement('span');
      dirSpan.style.cssText = 'font-size:11px;color:var(--text2);margin-left:4px;';
      dirSpan.textContent = f.name;
      fileIcon.appendChild(dirSpan);
      item.appendChild(fileIcon);
    } else if (isImg) {
      const img = document.createElement('img');
      img.src = (typeof safeUrl === 'function') ? safeUrl(f.url) : f.url;
      img.alt = f.name;
      img.loading = 'lazy';
      img.onerror = () => {
        const fallback = document.createElement('div');
        fallback.className = 'file-icon';
        fallback.textContent = '🖼️';
        item.replaceChildren(fallback);
      };
      item.appendChild(img);
    } else {
      const fileIcon = document.createElement('div');
      fileIcon.className = 'file-icon';
      fileIcon.append(getFileIcon(f.name));
      const extSpan = document.createElement('span');
      extSpan.style.fontSize = '10px';
      extSpan.textContent = (f.name.split('.').pop() || '').toUpperCase();
      fileIcon.appendChild(extSpan);
      item.appendChild(fileIcon);
    }

    const nameDiv = document.createElement('div');
    nameDiv.className = 'file-name';
    nameDiv.textContent = f.name;
    item.appendChild(nameDiv);

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'media-check';
    check.checked = selectedMedia.includes(f.name);
    check.title = `Select ${f.name}`;
    check.setAttribute('aria-label', `Select ${f.name}`);
    check.onclick = (e) => e.stopPropagation();
    item.appendChild(check);

    grid.appendChild(item);
  });
}

function getFileIcon(name) {
  if (/\.pdf$/i.test(name)) return '📄';
  if (/\.(mp4|mov|avi)$/i.test(name)) return '🎬';
  if (/\.(mp3|wav)$/i.test(name)) return '🎵';
  if (/\.(zip|rar)$/i.test(name)) return '🗜️';
  if (/\.(doc|docx)$/i.test(name)) return '📝';
  return '📎';
}

function toggleMediaSelect(name) {
  if (selectedMedia.includes(name)) selectedMedia = selectedMedia.filter(n => n !== name);
  else selectedMedia.push(name);
  renderMedia();
  const bulk = document.getElementById('media-bulk-actions');
  if (bulk) bulk.classList.toggle('hidden', selectedMedia.length === 0);
}

function updateBreadcrumb(folder) {
  const el = document.getElementById('media-breadcrumb');
  if (!el) return;
  el.replaceChildren();

  const rootItem = document.createElement('span');
  rootItem.className = 'breadcrumb-item';
  rootItem.textContent = '📁 uploads';
  rootItem.onclick = () => loadMedia('');
  el.appendChild(rootItem);

  const parts = folder ? folder.split('/') : [];
  let path = '';
  parts.forEach((p, i) => {
    path += (path ? '/' : '') + p;
    const isLast = i === parts.length - 1;
    const curPath = path;

    const sep = document.createElement('span');
    sep.className = 'breadcrumb-sep';
    sep.textContent = '›';

    const partItem = document.createElement('span');
    partItem.className = `breadcrumb-item ${isLast ? 'active' : ''}`;
    partItem.textContent = p;
    partItem.onclick = () => loadMedia(curPath);

    el.append(sep, partItem);
  });
}

async function handleFileUpload(files) {
  if (!files?.length) return;
  const uploadPromises = [];
  let done = 0;
  Toast.info(`Uploading ${files.length} file(s)…`);
  for (const file of files) {
    const p = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          await API.post('/api/admin/media/upload', {
            filename: file.name,
            base64data: e.target.result,
            folder: mediaFolder
          });
          done++;
        } catch { Toast.error(`Failed: ${file.name}`); }
        resolve();
      };
      reader.readAsDataURL(file);
    });
    uploadPromises.push(p);
  }
  await Promise.all(uploadPromises);
  Toast.success(`${done} file(s) uploaded!`);
  loadMedia(mediaFolder);
}

async function deleteSelectedMedia() {
  if (!selectedMedia.length) return;
  if (!confirm(`Delete ${selectedMedia.length} file(s)?`)) return;
  for (const name of selectedMedia) {
    await API.post('/api/admin/media/delete', { filename: name, folder: mediaFolder }).catch(() => {});
  }
  selectedMedia = [];
  loadMedia(mediaFolder);
  Toast.success('Deleted');
}

async function promptNewFolder() {
  const name = prompt('Folder name:');
  if (!name) return;
  const folderPath = mediaFolder ? mediaFolder + '/' + name : name;
  await API.post('/api/admin/media/mkdir', { folder: folderPath });
  loadMedia(mediaFolder);
}

async function loadStorageStats() {
  try {
    const data = await API.get('/api/admin/storage-stats');
    const fillEl = document.getElementById('storage-bar-fill');
    const textEl = document.getElementById('storage-text');
    if (fillEl && data.total) {
      const limit = 500 * 1024 * 1024; // 500MB
      const pct = Math.min(100, (data.total / limit) * 100).toFixed(1);
      fillEl.style.width = pct + '%';
      if (textEl) textEl.textContent = `${formatSize(data.total)} / 500 MB`;
    }
  } catch {}
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1048576).toFixed(1) + ' MB';
}

// Open image picker (for editor use)
let imagPickerCallback = null;
async function openImagePicker(callback) {
  imagPickerCallback = callback;
  const data = await API.get('/api/admin/images').catch(() => ({ images: [] }));
  const grid = document.getElementById('img-picker-grid');
  if (grid) {
    const imgs = data.images || [];
    grid.replaceChildren();
    if (!imgs.length) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      const icon = document.createElement('div');
      icon.className = 'icon';
      icon.textContent = '🖼️';
      const p = document.createElement('p');
      p.textContent = 'No images uploaded yet';
      emptyState.append(icon, p);
      grid.appendChild(emptyState);
    } else {
      imgs.forEach(img => {
        const item = document.createElement('div');
        item.className = 'media-item';
        item.onclick = () => selectPickerImage(img.url);

        const imgEl = document.createElement('img');
        imgEl.src = (typeof safeUrl === 'function') ? safeUrl(img.url) : img.url;
        imgEl.alt = img.name;
        imgEl.style.cssText = 'width:100%;height:100%;object-fit:cover';

        const nameEl = document.createElement('div');
        nameEl.className = 'file-name';
        nameEl.textContent = img.name;

        item.append(imgEl, nameEl);
        grid.appendChild(item);
      });
    }
  }
  document.getElementById('img-modal')?.classList.add('open');
}

function selectPickerImage(url) {
  if (imagPickerCallback) imagPickerCallback(url);
  closeModal('img-modal');
}

function insertMediaUrl(url) {
  if (imagPickerCallback) { selectPickerImage(url); }
  else { navigator.clipboard.writeText(window.location.origin + url).then(() => Toast.success('URL copied!')); }
}

// Drag-and-drop drop zone
document.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('media-dropzone');
  if (!dropzone) return;
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    handleFileUpload(e.dataTransfer.files);
  });
});
