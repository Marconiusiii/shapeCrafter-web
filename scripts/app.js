const STORAGE_KEY = "shapeCrafter.files";
const SHORTCUTS_KEY = "shapeCrafter.shortcuts";

const PRIMITIVES = [
  {
    name: "rect",
    required: ["x", "y", "width", "height"],
    optional: ["stroke", "stroke-width", "fill", "class"]
  },
  {
    name: "circle",
    required: ["cx", "cy", "r"],
    optional: ["stroke", "stroke-width", "fill", "class"]
  },
  {
    name: "ellipse",
    required: ["cx", "cy", "rx", "ry"],
    optional: ["stroke", "stroke-width", "fill", "class"]
  },
  {
    name: "line",
    required: ["x1", "y1", "x2", "y2"],
    optional: ["stroke", "stroke-width", "class"]
  },
  {
    name: "polyline",
    required: ["points"],
    optional: ["stroke", "stroke-width", "fill", "class"]
  },
  {
    name: "polygon",
    required: ["points"],
    optional: ["stroke", "stroke-width", "fill", "class"]
  },
  {
    name: "path",
    required: ["d"],
    optional: ["stroke", "stroke-width", "fill", "class"]
  },
  {
    name: "text",
    required: ["x", "y", "content"],
    optional: ["fill", "class"]
  }
];

const defaultShortcut = {
  modifiers: "Alt+Shift",
  key: "J"
};

const state = {
  currentFileId: "",
  files: [],
  lastFocusedTrigger: null,
  pendingPrimitive: null,
  shortcuts: loadShortcuts()
};

const elements = {
  workspaceSection: document.getElementById("workspaceSection"),
  editorView: document.getElementById("editorView"),
  renderView: document.getElementById("renderView"),
  renderCanvas: document.getElementById("renderCanvas"),
  renderMeta: document.getElementById("renderMeta"),
  currentFileHeading: document.getElementById("currentFileHeading"),
  fileMeta: document.getElementById("fileMeta"),
  svgEditor: document.getElementById("svgEditor"),
  statusMessage: document.getElementById("statusMessage"),
  errorPanel: document.getElementById("errorPanel"),
  errorMessage: document.getElementById("errorMessage"),
  fileList: document.getElementById("fileList"),
  fileLibrarySummary: document.getElementById("fileLibrarySummary"),
  jumpShortcutSummary: document.getElementById("jumpShortcutSummary"),
  attributePromptToggle: document.getElementById("attributePromptToggle"),
  primitiveList: document.getElementById("primitiveList"),
  newFileDialog: document.getElementById("newFileDialog"),
  newFileForm: document.getElementById("newFileForm"),
  fileNameInput: document.getElementById("fileNameInput"),
  viewBoxInput: document.getElementById("viewBoxInput"),
  svgWidthInput: document.getElementById("svgWidthInput"),
  svgHeightInput: document.getElementById("svgHeightInput"),
  shapeDialog: document.getElementById("shapeDialog"),
  shapeForm: document.getElementById("shapeForm"),
  shapeDialogTitle: document.getElementById("shapeDialogTitle"),
  shapeFieldContainer: document.getElementById("shapeFieldContainer"),
  shapeSubmitButton: document.getElementById("shapeSubmitButton"),
  jumpDialog: document.getElementById("jumpDialog"),
  jumpForm: document.getElementById("jumpForm"),
  jumpLineInput: document.getElementById("jumpLineInput"),
  shortcutsDialog: document.getElementById("shortcutsDialog"),
  shortcutModifierInput: document.getElementById("shortcutModifierInput"),
  shortcutKeyInput: document.getElementById("shortcutKeyInput"),
  exportDialog: document.getElementById("exportDialog"),
  exportForm: document.getElementById("exportForm"),
  exportTypeInput: document.getElementById("exportTypeInput"),
  exportWidthInput: document.getElementById("exportWidthInput"),
  exportHeightInput: document.getElementById("exportHeightInput"),
  exportDpiInput: document.getElementById("exportDpiInput")
};

document.getElementById("copyrightYear").textContent = new Date().getFullYear();

document.getElementById("newFileButton").addEventListener("click", (event) => {
  state.lastFocusedTrigger = event.currentTarget;
  elements.newFileDialog.showModal();
  elements.fileNameInput.focus();
});

document.getElementById("openShortcutsButton").addEventListener("click", (event) => {
  state.lastFocusedTrigger = event.currentTarget;
  openShortcutsDialog();
});

document.getElementById("saveButton").addEventListener("click", saveCurrentFile);
document.getElementById("saveFromRenderButton").addEventListener("click", saveCurrentFile);
document.getElementById("downloadButton").addEventListener("click", downloadSvg);
document.getElementById("renderButton").addEventListener("click", renderSvg);
document.getElementById("returnToCodeButton").addEventListener("click", returnToEditor);
document.getElementById("printButton").addEventListener("click", () => window.print());
document.getElementById("jumpToLineButton").addEventListener("click", (event) => {
  state.lastFocusedTrigger = event.currentTarget;
  elements.jumpDialog.showModal();
  elements.jumpLineInput.focus();
});
document.getElementById("exportRasterButton").addEventListener("click", (event) => {
  state.lastFocusedTrigger = event.currentTarget;
  syncExportDimensionsFromSvg();
  elements.exportDialog.showModal();
});
document.getElementById("resetShortcutButton").addEventListener("click", () => {
  state.shortcuts = { ...defaultShortcut };
  syncShortcutInputs();
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.closeDialog);
    dialog.close();
    restoreFocus();
  });
});

elements.newFileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const filename = elements.fileNameInput.value.trim();
  const viewBox = elements.viewBoxInput.value.trim();
  const width = elements.svgWidthInput.value.trim();
  const height = elements.svgHeightInput.value.trim();
  const file = createFileRecord(filename, viewBox, width, height);
  state.files = upsertFile(file);
  state.currentFileId = file.id;
  elements.svgEditor.value = file.content;
  elements.workspaceSection.hidden = false;
  updateWorkspaceMeta(file);
  persistFiles();
  renderFileList();
  clearMessages();
  setStatus(`Created ${file.name}.`);
  elements.newFileDialog.close();
  focusEditorLine(3);
});

elements.shapeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.pendingPrimitive) {
    return;
  }

  const primitive = state.pendingPrimitive;
  const fieldValues = new FormData(elements.shapeForm);
  const markup = buildPrimitiveMarkup(primitive, fieldValues);
  insertAtCursor(markup);
  elements.shapeDialog.close();
  setStatus(`Inserted <${primitive.name}>.`);
  focusEditorOnInsertedMarkup(markup);
});

elements.jumpForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const line = Number(elements.jumpLineInput.value);
  elements.jumpDialog.close();
  focusEditorLine(line);
});

elements.shortcutsDialog.addEventListener("close", restoreFocus);
elements.newFileDialog.addEventListener("close", restoreFocus);
elements.shapeDialog.addEventListener("close", restoreFocus);
elements.jumpDialog.addEventListener("close", restoreFocus);
elements.exportDialog.addEventListener("close", restoreFocus);

elements.exportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await exportRaster();
    elements.exportDialog.close();
    setStatus("Raster export downloaded.");
  } catch (error) {
    setStatus(error.message);
  }
});

document.getElementById("shortcutsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.shortcuts = {
    modifiers: elements.shortcutModifierInput.value,
    key: elements.shortcutKeyInput.value.trim().toUpperCase() || defaultShortcut.key
  };
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(state.shortcuts));
  updateShortcutSummary();
  elements.shortcutsDialog.close();
  setStatus(`Jump to Line shortcut saved as ${describeShortcut(state.shortcuts)}.`);
});

elements.svgEditor.addEventListener("input", () => {
  clearMessages();
  updateCurrentFileContent(elements.svgEditor.value);
});

document.addEventListener("keydown", (event) => {
  if (matchesShortcut(event, state.shortcuts)) {
    event.preventDefault();
    state.lastFocusedTrigger = document.activeElement;
    elements.jumpDialog.showModal();
    elements.jumpLineInput.focus();
  }
});

initPrimitiveList();
renderFileList();
updateShortcutSummary();

function openShortcutsDialog() {
  syncShortcutInputs();
  elements.shortcutsDialog.showModal();
  elements.shortcutModifierInput.focus();
}

function syncShortcutInputs() {
  elements.shortcutModifierInput.value = state.shortcuts.modifiers;
  elements.shortcutKeyInput.value = state.shortcuts.key;
}

function initPrimitiveList() {
  const fragment = document.createDocumentFragment();

  PRIMITIVES.forEach((primitive) => {
    const listItem = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `<${primitive.name}>`;
    button.addEventListener("click", (event) => {
      state.lastFocusedTrigger = event.currentTarget;
      if (elements.attributePromptToggle.checked) {
        openShapeDialog(primitive);
        return;
      }

      const markup = buildPrimitiveMarkup(primitive);
      insertAtCursor(markup);
      setStatus(`Inserted <${primitive.name}>.`);
      focusEditorOnInsertedMarkup(markup);
    });
    listItem.appendChild(button);
    fragment.appendChild(listItem);
  });

  elements.primitiveList.appendChild(fragment);
}

function openShapeDialog(primitive) {
  state.pendingPrimitive = primitive;
  elements.shapeDialogTitle.textContent = `Add ${primitive.name}`;
  elements.shapeSubmitButton.textContent = `Add ${primitive.name} to Canvas`;
  elements.shapeFieldContainer.replaceChildren();

  [...primitive.required, ...primitive.optional].forEach((attribute) => {
    const wrapper = document.createElement("div");
    wrapper.className = "modal-field";
    const label = document.createElement("label");
    const input = document.createElement("input");
    const id = `shape-${primitive.name}-${attribute}`;
    label.htmlFor = id;
    label.textContent = primitive.name === "text" && attribute === "content" ? "Text Content" : attribute;
    input.id = id;
    input.name = attribute;
    input.required = primitive.required.includes(attribute);
    wrapper.append(label, input);
    elements.shapeFieldContainer.appendChild(wrapper);
  });

  elements.shapeDialog.showModal();
  const firstField = elements.shapeFieldContainer.querySelector("input");
  if (firstField) {
    firstField.focus();
  }
}

function createFileRecord(name, viewBox, width, height) {
  const safeName = sanitizeFilename(name || "untitled");
  const content = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">`,
    `  <title>${escapeXml(safeName)}</title>`,
    "",
    "</svg>"
  ].join("\n");

  return {
    id: crypto.randomUUID(),
    name: `${safeName}.svg`,
    viewBox,
    width,
    height,
    updatedAt: new Date().toISOString(),
    content
  };
}

function sanitizeFilename(name) {
  return name.replace(/\.svg$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim() || "untitled";
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function buildPrimitiveMarkup(primitive, values = null) {
  const attributes = [];

  if (values) {
    primitive.required.forEach((attribute) => {
      const value = String(values.get(attribute) || "").trim();
      attributes.push(`${attribute}="${escapeXml(value)}"`);
    });

    primitive.optional.forEach((attribute) => {
      const value = String(values.get(attribute) || "").trim();
      if (attribute === "fill") {
        attributes.push(`fill="${escapeXml(value || "none")}"`);
        return;
      }

      if (value) {
        attributes.push(`${attribute}="${escapeXml(value)}"`);
      }
    });

    if (primitive.name === "text") {
      const content = String(values.get("content") || "").trim();
      return `  <text ${attributes.filter((attribute) => !attribute.startsWith("content=")).join(" ")}>${escapeXml(content)}</text>\n`;
    }
  } else {
    primitive.required.forEach((attribute) => {
      if (primitive.name === "text" && attribute === "content") {
        return;
      }
      attributes.push(`${attribute}=""`);
    });

    primitive.optional.forEach((attribute) => {
      if (attribute === "fill") {
        attributes.push(`fill="none"`);
      }
    });

    if (primitive.name === "text") {
      return `  <text ${attributes.join(" ")}>Text</text>\n`;
    }
  }

  return `  <${primitive.name}${attributes.length ? ` ${attributes.join(" ")}` : ""}></${primitive.name}>\n`;
}

function insertAtCursor(markup) {
  const editor = elements.svgEditor;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const current = editor.value;
  editor.value = current.slice(0, start) + markup + current.slice(end);
  editor.selectionStart = start;
  editor.selectionEnd = start + markup.length;
  updateCurrentFileContent(editor.value);
}

function focusEditorOnInsertedMarkup(markup) {
  const editor = elements.svgEditor;
  editor.focus();
  const lineIndex = editor.value.substring(0, editor.selectionStart).split("\n").length;
  focusEditorLine(lineIndex);
  setStatus(`${markup.trim()} added at line ${lineIndex}.`);
}

function focusEditorLine(lineNumber) {
  const editor = elements.svgEditor;
  const lines = editor.value.split("\n");
  const targetLine = Math.min(Math.max(lineNumber, 1), lines.length);
  let index = 0;

  for (let i = 0; i < targetLine - 1; i += 1) {
    index += lines[i].length + 1;
  }

  editor.focus();
  editor.setSelectionRange(index, index + lines[targetLine - 1].length);
  editor.scrollTop = (targetLine - 1) * 24;
  setStatus(`Moved to line ${targetLine}.`);
}

function updateWorkspaceMeta(file) {
  elements.currentFileHeading.textContent = file.name;
  elements.fileMeta.textContent = `viewBox ${file.viewBox} | ${file.width} by ${file.height} | Updated ${formatDate(file.updatedAt)}`;
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString();
}

function renderFileList() {
  state.files = loadFiles();
  elements.fileList.replaceChildren();

  if (!state.files.length) {
    elements.fileLibrarySummary.textContent = "No saved files yet.";
    return;
  }

  elements.fileLibrarySummary.textContent = `${state.files.length} saved file${state.files.length === 1 ? "" : "s"} in this browser.`;
  const fragment = document.createDocumentFragment();

  state.files
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .forEach((file) => {
      const item = document.createElement("li");
      item.className = "file-item";

      const title = document.createElement("p");
      title.textContent = `${file.name} | ${formatDate(file.updatedAt)}`;

      const actions = document.createElement("div");
      actions.className = "file-actions";

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.textContent = "Open";
      openButton.addEventListener("click", () => openFile(file.id));

      const renameButton = document.createElement("button");
      renameButton.type = "button";
      renameButton.textContent = "Rename";
      renameButton.addEventListener("click", () => renameFile(file.id));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => deleteFile(file.id));

      actions.append(openButton, renameButton, deleteButton);
      item.append(title, actions);
      fragment.appendChild(item);
    });

  elements.fileList.appendChild(fragment);
}

function openFile(fileId) {
  const file = loadFiles().find((item) => item.id === fileId);
  if (!file) {
    return;
  }

  state.currentFileId = file.id;
  elements.workspaceSection.hidden = false;
  elements.renderView.hidden = true;
  elements.editorView.hidden = false;
  elements.svgEditor.value = file.content;
  updateWorkspaceMeta(file);
  clearMessages();
  setStatus(`Opened ${file.name}.`);
  elements.svgEditor.focus();
}

function renameFile(fileId) {
  const files = loadFiles();
  const file = files.find((item) => item.id === fileId);
  if (!file) {
    return;
  }

  const nextName = window.prompt("Rename file", file.name.replace(/\.svg$/i, ""));
  if (!nextName) {
    return;
  }

  file.name = `${sanitizeFilename(nextName)}.svg`;
  file.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  renderFileList();

  if (state.currentFileId === fileId) {
    updateWorkspaceMeta(file);
  }

  setStatus(`Renamed file to ${file.name}.`);
}

function deleteFile(fileId) {
  const files = loadFiles();
  const file = files.find((item) => item.id === fileId);
  if (!file) {
    return;
  }

  const confirmed = window.confirm(`Delete ${file.name} from local storage?`);
  if (!confirmed) {
    return;
  }

  const nextFiles = files.filter((item) => item.id !== fileId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFiles));
  state.files = nextFiles;

  if (state.currentFileId === fileId) {
    state.currentFileId = "";
    elements.currentFileHeading.textContent = "Untitled";
    elements.fileMeta.textContent = "No file open.";
  }

  renderFileList();
  setStatus(`${file.name} deleted.`);
}

function saveCurrentFile() {
  if (!elements.svgEditor.value.trim()) {
    setStatus("There is no SVG code to save yet.");
    return;
  }

  let file = state.currentFileId ? loadFiles().find((item) => item.id === state.currentFileId) : null;
  if (!file) {
    file = createFileRecord("untitled", "0 0 500 500", "500", "500");
    state.currentFileId = file.id;
  }

  file.content = elements.svgEditor.value;
  file.updatedAt = new Date().toISOString();
  state.files = upsertFile(file);
  persistFiles();
  updateWorkspaceMeta(file);
  renderFileList();
  setStatus(`${file.name} saved to this browser.`);
}

function upsertFile(file) {
  const files = loadFiles().filter((item) => item.id !== file.id);
  files.push(file);
  return files;
}

function persistFiles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.files));
}

function loadFiles() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function updateCurrentFileContent(content) {
  const files = loadFiles();
  const file = files.find((item) => item.id === state.currentFileId);
  if (!file) {
    return;
  }

  file.content = content;
  file.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  updateWorkspaceMeta(file);
}

function renderSvg() {
  const source = elements.svgEditor.value.trim();
  if (!source) {
    setStatus("Enter SVG code before rendering.");
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(source, "image/svg+xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    const message = parserError.textContent.trim().replace(/\s+/g, " ");
    elements.errorPanel.hidden = false;
    elements.errorMessage.textContent = message;
    setStatus("The SVG could not be rendered. Review the error message.");
    const lineMatch = message.match(/line\s+(\d+)/i);
    if (lineMatch) {
      focusEditorLine(Number(lineMatch[1]));
    } else {
      elements.svgEditor.focus();
    }
    return;
  }

  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== "svg") {
    elements.errorPanel.hidden = false;
    elements.errorMessage.textContent = "The document must begin with a valid <svg> root element.";
    setStatus("A valid SVG root element is required.");
    elements.svgEditor.focus();
    return;
  }

  sanitizeSvg(svg);
  elements.errorPanel.hidden = true;
  elements.errorMessage.textContent = "";
  elements.renderCanvas.replaceChildren(svg.cloneNode(true));
  elements.editorView.hidden = true;
  elements.renderView.hidden = false;
  elements.renderMeta.textContent = `${elements.currentFileHeading.textContent} rendered and ready for print or export.`;
  elements.renderCanvas.focus();
  setStatus("SVG rendered.");
}

function returnToEditor() {
  elements.renderView.hidden = true;
  elements.editorView.hidden = false;
  elements.svgEditor.focus();
}

function downloadSvg() {
  const source = elements.svgEditor.value.trim();
  if (!source) {
    setStatus("There is no SVG code to download.");
    return;
  }

  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const filename = elements.currentFileHeading.textContent || "drawing.svg";
  triggerDownload(blob, filename.endsWith(".svg") ? filename : `${filename}.svg`);
  setStatus("SVG download started.");
}

async function exportRaster() {
  const source = elements.svgEditor.value.trim();
  if (!source) {
    throw new Error("There is no SVG code to export.");
  }

  const width = Number(elements.exportWidthInput.value);
  const height = Number(elements.exportHeightInput.value);
  const type = elements.exportTypeInput.value;
  const dpi = Number(elements.exportDpiInput.value);
  const scale = dpi / 96;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");

  if (type === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const image = await loadSvgImage(source);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, type, 0.95);
  });

  if (!blob) {
    throw new Error("The raster export could not be created.");
  }

  const extension = mimeToExtension(type);
  const filename = elements.currentFileHeading.textContent.replace(/\.svg$/i, "") || "drawing";
  triggerDownload(blob, `${filename}.${extension}`);
}

function syncExportDimensionsFromSvg() {
  const source = elements.svgEditor.value.trim();
  const parser = new DOMParser();
  const doc = parser.parseFromString(source, "image/svg+xml");
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== "svg") {
    return;
  }

  const width = numericAttribute(svg.getAttribute("width")) || 1000;
  const height = numericAttribute(svg.getAttribute("height")) || 1000;
  elements.exportWidthInput.value = width;
  elements.exportHeightInput.value = height;
}

function numericAttribute(value) {
  if (!value) {
    return null;
  }

  const match = String(value).match(/[\d.]+/);
  return match ? Number(match[0]) : null;
}

function loadSvgImage(source) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The SVG could not be converted into an image."));
    };
    image.src = url;
  });
}

function sanitizeSvg(svg) {
  svg.querySelectorAll("script, foreignObject").forEach((node) => node.remove());

  svg.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      if (attribute.name.toLowerCase().startsWith("on")) {
        node.removeAttribute(attribute.name);
      }
    });
  });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function mimeToExtension(type) {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return "png";
  }
}

function loadShortcuts() {
  try {
    return {
      ...defaultShortcut,
      ...JSON.parse(localStorage.getItem(SHORTCUTS_KEY) || "{}")
    };
  } catch (error) {
    return { ...defaultShortcut };
  }
}

function updateShortcutSummary() {
  elements.jumpShortcutSummary.textContent = `Jump to Line: ${describeShortcut(state.shortcuts)}`;
}

function describeShortcut(shortcut) {
  return `${shortcut.modifiers}+${shortcut.key.toUpperCase()}`;
}

function matchesShortcut(event, shortcut) {
  if (event.key.toUpperCase() !== shortcut.key.toUpperCase()) {
    return false;
  }

  const required = shortcut.modifiers.split("+");
  const needsAlt = required.includes("Alt");
  const needsControl = required.includes("Control");
  const needsShift = required.includes("Shift");

  return event.altKey === needsAlt && event.ctrlKey === needsControl && event.shiftKey === needsShift;
}

function setStatus(message) {
  elements.statusMessage.textContent = message;
}

function clearMessages() {
  elements.statusMessage.textContent = "";
  elements.errorPanel.hidden = true;
  elements.errorMessage.textContent = "";
}

function restoreFocus() {
  if (state.lastFocusedTrigger && typeof state.lastFocusedTrigger.focus === "function") {
    state.lastFocusedTrigger.focus();
  }
}
