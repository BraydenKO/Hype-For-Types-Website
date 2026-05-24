/**
 * Hype For Types — Notes page builder
 */
(function () {
  'use strict';

  const blocks = [];
  const quills = {};
  const domNodes = {};
  let saveTimer = null;
  let filenameTouched = false;

  const BLOCK_DEFS = {
    section: { label: 'Section Header' },
    text: { label: 'Rich Text' },
    code: { label: 'Code Block' },
    aside: { label: 'Aside / Note' },
    exercise: { label: 'Exercise' },
    solution: { label: 'Solution' },
  };

  const QUILL_TYPES = new Set(['text', 'exercise', 'solution', 'aside']);

  function uid() {
    return 'b' + Math.random().toString(36).slice(2, 10);
  }

  function escHtml(s) {
    return (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escAttr(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function escText(s) {
    return escHtml(s);
  }

  function slugify(title) {
    return (title || 'notes')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60) || 'notes';
  }

  function syncQuillContent() {
    blocks.forEach((b) => {
      if (quills[b.id]) {
        b.content = quills[b.id].root.innerHTML;
      }
    });
  }

  function normalizeQuillHtml(html) {
    const trimmed = (html || '').trim();
    if (!trimmed || trimmed === '<p><br></p>') return '<p></p>';
    if (/^<(p|ul|ol|h[1-6]|div|blockquote)\b/i.test(trimmed)) return trimmed;
    return `<p>${trimmed}</p>`;
  }

  // ─── Block CRUD ───────────────────────────────────────────────────────────

  function addBlock(type) {
    const block = { id: uid(), type, number: '', title: '', content: '' };
    blocks.push(block);
    mountBlock(block);
    updateEmptyState();
    updateBlockCount();
    updateMoveButtons();
    autosave();
    setTimeout(() => {
        domNodes[block.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  function mountBlock(block) {
    const node = buildBlockNode(block);
    domNodes[block.id] = node;
    document.getElementById('canvas').appendChild(node);

    if (QUILL_TYPES.has(block.type)) {
      const q = createQuill(`q_${block.id}`);
      quills[block.id] = q;
      if (block.content) {
        q.clipboard.dangerouslyPasteHTML(block.content);
      }
      q.on('text-change', () => {
        autosave();
      });
    }
  }

  function buildBlockNode(block) {
    const div = document.createElement('div');
    div.className = 'editor-block';
    div.id = `node_${block.id}`;
    div.dataset.blockId = block.id;

    div.innerHTML = `
      <div class="block-header">
        <div class="block-type-badge block-type-${block.type}">${BLOCK_DEFS[block.type].label}</div>
        <div class="block-actions" id="actions_${block.id}">
          <button type="button" class="up-btn" title="Move up">↑</button>
          <button type="button" class="dn-btn" title="Move down">↓</button>
          <button type="button" class="del-btn" title="Delete">Delete</button>
        </div>
      </div>
      <div class="block-body">${buildBodyHTML(block)}</div>
    `;

    div.querySelector('.up-btn').addEventListener('click', () => moveBlock(block.id, -1));
    div.querySelector('.dn-btn').addEventListener('click', () => moveBlock(block.id, 1));
    div.querySelector('.del-btn').addEventListener('click', () => removeBlock(block.id));

    div.querySelectorAll('[data-field]').forEach((el) => {
      const field = el.dataset.field;
      const handler = () => fieldChanged(block.id, field, el.value);
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });

    return div;
  }

  function buildBodyHTML(block) {
    const v = (s) => escAttr(s || '');

    if (block.type === 'section') {
      return `
        <div class="field">
          <label>Section Number</label>
          <input type="text" data-field="number" value="${v(block.number)}" placeholder="1">
        </div>
        <div class="field">
          <label>Section Title</label>
          <input type="text" data-field="title" value="${v(block.title)}" placeholder="e.g. The Type System">
        </div>`;
    }

    if (block.type === 'code') {
      return `
        <div class="field">
          <label>Code / Pre-formatted Text</label>
          <textarea data-field="content" rows="8" placeholder="Enter code here...">${escText(block.content)}</textarea>
        </div>`;
    }

    if (block.type === 'aside') {
      return `
        <div class="field">
          <label>Aside Title</label>
          <input type="text" data-field="title" value="${v(block.title)}" placeholder="e.g. Why types matter.">
        </div>
        <div class="field">
          <label>Aside Content</label>
          <p class="field-hint">Use $...$ or $$...$$ for math (rendered on export).</p>
          <div class="quill-host"><div id="q_${block.id}"></div></div>
        </div>`;
    }

    const label =
      block.type === 'exercise'
        ? 'Exercise prompt'
        : block.type === 'solution'
          ? 'Solution content'
          : 'Content';

    return `
      <div class="field">
        <label>${label}</label>
        <p class="field-hint">Use $...$ or $$...$$ for math (rendered on export).</p>
        <div class="quill-host"><div id="q_${block.id}"></div></div>
      </div>`;
  }

  function fieldChanged(id, field, value) {
    const block = blocks.find((b) => b.id === id);
    if (block) block[field] = value;
    autosave();
  }

  function moveBlock(id, dir) {
    const idx = blocks.findIndex((b) => b.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;

    [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];

    const canvas = document.getElementById('canvas');
    const nodeA = domNodes[blocks[newIdx].id];
    const nodeB = domNodes[blocks[idx].id];

    if (dir === -1) {
      canvas.insertBefore(nodeB, nodeA);
    } else {
      canvas.insertBefore(nodeA, nodeB.nextSibling);
    }

    updateMoveButtons();
    autosave();
  }

  function removeBlock(id) {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    if (!confirm('Delete this block?')) return;

    blocks.splice(idx, 1);
    delete quills[id];
    const node = domNodes[id];
    if (node) {
      node.remove();
      delete domNodes[id];
    }

    updateEmptyState();
    updateBlockCount();
    updateMoveButtons();
    autosave();
  }

  function createQuill(elId) {
    return new Quill(`#${elId}`, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['clean'],
        ],
      },
    });
  }

  // ─── UI state ─────────────────────────────────────────────────────────────

  function updateEmptyState() {
    document.getElementById('empty-state').classList.toggle('hidden', blocks.length > 0);
  }

  function updateBlockCount() {
    const n = blocks.length;
    document.getElementById('block-count').textContent = n === 1 ? '1 block' : `${n} blocks`;
  }

  function updateMoveButtons() {
    blocks.forEach((b, i) => {
      const acts = document.getElementById(`actions_${b.id}`);
      if (!acts) return;
      acts.querySelector('.up-btn').disabled = i === 0;
      acts.querySelector('.dn-btn').disabled = i === blocks.length - 1;
    });
  }

  function setStatus(text, kind) {
    const el = document.getElementById('status-text');
    el.textContent = text;
    el.dataset.kind = kind || '';
  }

  // ─── Persistence ──────────────────────────────────────────────────────────

  function autosave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persistToStorage, 800);
    setStatus('Unsaved changes', 'pending');
  }

  function persistToStorage() {
    syncQuillContent();
    try {
      const payload = blocks.map(({ id, type, number, title, content }) => ({
        id,
        type,
        number,
        title,
        content,
      }));
      localStorage.setItem('hft_blocks', JSON.stringify(payload));
      localStorage.setItem('hft_title', document.getElementById('meta-title').value);
      localStorage.setItem('hft_filename', document.getElementById('meta-filename').value);
      setStatus('Saved', 'ok');
    } catch {
      setStatus('Save failed (storage full?)', 'error');
    }
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem('hft_blocks');
      if (!raw) return;

      const saved = JSON.parse(raw);
      document.getElementById('meta-title').value = localStorage.getItem('hft_title') || '';
      document.getElementById('meta-filename').value = localStorage.getItem('hft_filename') || '';
      filenameTouched = Boolean(document.getElementById('meta-filename').value.trim());
      saved.forEach((b) => {
        blocks.push(b);
        mountBlock(b);
      });
    } catch {
      /* fresh start */
    }
  }

  function clearDraft() {
    if (blocks.length && !confirm('Clear all blocks and page settings? This cannot be undone.')) {
      return;
    }
    blocks.length = 0;
    Object.keys(quills).forEach((k) => delete quills[k]);
    Object.keys(domNodes).forEach((k) => delete domNodes[k]);
    document.getElementById('canvas').querySelectorAll('.editor-block').forEach((n) => n.remove());
    document.getElementById('meta-title').value = '';
    document.getElementById('meta-filename').value = '';
    filenameTouched = false;
    localStorage.removeItem('hft_blocks');
    localStorage.removeItem('hft_title');
    localStorage.removeItem('hft_filename');
    updateEmptyState();
    updateBlockCount();
    updateMoveButtons();
    setStatus('Draft cleared', 'ok');
  }

  function onTitleInput() {
    const title = document.getElementById('meta-title').value;
    const filenameEl = document.getElementById('meta-filename');
    if (!filenameTouched) {
      filenameEl.value = title.trim() ? `${slugify(title)}.html` : '';
    }
    autosave();
  }

  function onFilenameInput() {
    filenameTouched = Boolean(document.getElementById('meta-filename').value.trim());
    autosave();
  }

  // ─── Export ───────────────────────────────────────────────────────────────

  function renderBlock(b) {
    const content = normalizeQuillHtml(b.content);

    if (b.type === 'section') {
      return `
        <div class="block-container">
            <div class="block block-segment-kind block-section">
                <div class="atom-section">
                    <div class="segment-display-num">${escHtml(b.number)}</div>
                    <div class="col"><span>${escHtml(b.title)}</span></div>
                </div>
            </div>
        </div>\n`;
    }

    if (b.type === 'text') {
      return `
        <div class="block-container">
            <div class="block block-plain-kind block-gram">
                <div class="atom-body-container">
                    <div class="atom-body">${content}</div>
                </div>
            </div>
        </div>\n`;
    }

    if (b.type === 'code') {
      return `
        <div class="block-container">
            <div class="block block-plain-kind block-gram">
                <div class="atom-body-container">
                    <div class="atom-body">
                        <div class="code-block">${escHtml(b.content)}</div>
                    </div>
                </div>
            </div>
        </div>\n`;
    }

    if (b.type === 'aside') {
      return `
        <div class="block-container">
            <div class="block block-plain-kind block-gram">
                <div class="atom-body-container">
                    <div class="atom-body">
                        <div class="aside">
                            <strong>${escHtml(b.title)}</strong> ${content}
                        </div>
                    </div>
                </div>
            </div>
        </div>\n`;
    }

    if (b.type === 'exercise') {
      return `
        <div class="block-container">
            <div class="block block-question-kind block-exercise">
                <div class="atom-name-title">
                    <span class="atom-name">Exercise</span>
                </div>
                <div class="atom-body-container">
                    <div class="atom-body">${content}</div>
                </div>
            </div>
        </div>\n`;
    }

    if (b.type === 'solution') {
      return `
        <div class="block-container">
            <div class="block block-secondary-kind block-solution block-collapsible block-collapsed">
                <div class="atom-name-title">
                    <a class="no-decoration" role="button" onclick="toggleBlock(this)">
                        <span class="atom-name">Solution</span>
                    </a>
                </div>
                <div class="atom-body-container">
                    <div class="atom-body">${content}</div>
                </div>
            </div>
        </div>\n`;
    }

    return '';
  }

  function buildPage(title, body, isPreview = false) {
    const t = escHtml(title);
    const baseTag = isPreview ? `<base href="${window.location.href.split('/').slice(0, -1).join('/')}/pages/">` : '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${baseTag}
    <title>${t} | Hype For Types</title>

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/contrib/auto-render.min.js"></script>
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\\\(", right: "\\\\)", display: false},
                    {left: "\\\\[", right: "\\\\]", display: true},
                ]
            });
        });
    </script>

    <link rel="stylesheet" href="../../base.css">
    <link rel="stylesheet" href="../chapter.css">
    <link rel="stylesheet" href="../atom.css">
    <script src="../notes.js"></script>
    <style>
        table.semantic-table { width:100%; border-collapse:collapse; margin:10px 0; }
        table.semantic-table th, table.semantic-table td { border:1px solid #444; padding:8px; text-align:left; }
        table.semantic-table th { background-color:#333; color:#fff; }
        .code-block {
            background-color:#f4f4f4; border-left:4px solid #333; padding:10px;
            font-family:monospace; margin:10px 0; overflow-x:auto; white-space:pre;
        }
        .aside {
            background-color:#f9f6ee; border-left:4px solid #b8a96a;
            padding:10px 14px; margin:12px 0; font-size:0.95em;
        }
        .aside strong { color:#7a6830; }
        .type-label {
            font-family:monospace; background:#eef; padding:1px 5px;
            border-radius:3px; font-size:0.9em;
        }
        @media (prefers-color-scheme: dark) {
            .code-block { background-color:#2a2a2a; border-left-color:#666; }
            .aside { background-color:#2e2b24; border-left-color:#b8a96a; }
            .aside strong { color:#e6ce83; }
            .type-label { background-color:#334; color:#dde; }
            table.semantic-table th { background-color:#222; border-color:#555; }
            table.semantic-table td { border-color:#555; }
        }
    </style>
</head>
<body>
    <nav style="margin-bottom:20px;">
        <a href="../../index.html" style="text-decoration:none;">&larr; Home</a> |
        <a href="../index.html" style="text-decoration:none;">Course Notes Index</a>
    </nav>

    <h1>${t}</h1>
    <hr>

    <main>
        <div id="chapter-atoms">
${body}        </div>
    </main>
</body>
</html>`;
  }

  function buildExportHtml(isPreview = false) {
    syncQuillContent();
    const pageTitle = document.getElementById('meta-title').value.trim() || 'Untitled Notes';
    let bodyHtml = '';
    blocks.forEach((b) => {
      bodyHtml += renderBlock(b);
    });
    return { pageTitle, html: buildPage(pageTitle, bodyHtml, isPreview) };
  }

  function exportHTML() {
    if (!blocks.length) {
      setStatus('Add at least one block before exporting', 'error');
      return;
    }

    const { pageTitle, html } = buildExportHtml(false);
    let filename = document.getElementById('meta-filename').value.trim() || `${slugify(pageTitle)}.html`;
    if (!filename.endsWith('.html')) filename += '.html';

    download(filename, html);
    setStatus(`Exported ${filename}`, 'ok');
  }

  function previewHTML() {
    if (!blocks.length) {
      setStatus('Add at least one block to preview', 'error');
      return;
    }
    const { html } = buildExportHtml(true);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    setStatus('Preview opened in new tab', 'ok');
  }

  function download(filename, content) {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function bindSidebar() {
    document.querySelectorAll('[data-add-block]').forEach((btn) => {
      btn.addEventListener('click', () => addBlock(btn.dataset.addBlock));
    });
    document.getElementById('btn-export').addEventListener('click', exportHTML);
    document.getElementById('btn-preview').addEventListener('click', previewHTML);
    document.getElementById('btn-clear').addEventListener('click', clearDraft);
    document.getElementById('meta-title').addEventListener('input', onTitleInput);
    document.getElementById('meta-filename').addEventListener('input', onFilenameInput);
  }

  function init() {
    bindSidebar();
    restoreDraft();
    updateEmptyState();
    updateBlockCount();
    updateMoveButtons();
    if (!blocks.length) {
      setStatus('Ready — add blocks from the sidebar', 'ok');
    } else {
      setStatus('Draft restored', 'ok');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
