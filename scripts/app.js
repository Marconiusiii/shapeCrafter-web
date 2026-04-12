const STORAGE_KEY = "shapeCrafter.files";
const SHORTCUTS_KEY = "shapeCrafter.shortcuts";
const BASE_TITLE = "shapeCrafter - BlindSVG";

const PRIMITIVES = [
  {
    name: "rect",
    required: ["x", "y", "width", "height"],
    optional: ["stroke", "stroke-width", "fill", "id", "class"]
  },
  {
    name: "circle",
    required: ["cx", "cy", "r"],
    optional: ["stroke", "stroke-width", "fill", "id", "class"]
  },
  {
    name: "ellipse",
    required: ["cx", "cy", "rx", "ry"],
    optional: ["stroke", "stroke-width", "fill", "id", "class"]
  },
  {
    name: "line",
    required: ["x1", "y1", "x2", "y2"],
    optional: ["stroke", "stroke-width", "id", "class"]
  },
  {
    name: "polyline",
    required: ["points"],
    optional: ["stroke", "stroke-width", "fill", "id", "class"]
  },
  {
    name: "polygon",
    required: ["points"],
    optional: ["stroke", "stroke-width", "fill", "id", "class"]
  },
  {
    name: "path",
    required: ["d"],
    optional: ["style", "id", "class"]
  },
  {
    name: "text",
    required: ["x", "y", "content"],
    optional: ["fill", "id", "class"]
  }
];

const defaultShortcuts = {
  jumpToLine: {
    modifiers: "Control+Shift",
    key: "J"
  },
  indent: {
    modifiers: "Control",
    key: "]"
  },
  outdent: {
    modifiers: "Control",
    key: "["
  }
};

const state = {
  currentFileId: "",
  files: [],
  currentErrors: [],
  lastFocusedTrigger: null,
  pendingPrimitive: null,
  pendingFocusTarget: null,
  shouldRestoreFocus: true,
  shortcuts: loadShortcuts()
};

const elements = {
  homeView: document.getElementById("homeView"),
  workspaceSection: document.getElementById("workspaceSection"),
  editorView: document.getElementById("editorView"),
  renderView: document.getElementById("renderView"),
  renderCanvas: document.getElementById("renderCanvas"),
  renderCanvasHeading: document.getElementById("renderCanvasHeading"),
  renderViewHeading: document.getElementById("renderViewHeading"),
  renderMeta: document.getElementById("renderMeta"),
  currentFileHeading: document.getElementById("currentFileHeading"),
  fileMeta: document.getElementById("fileMeta"),
  renameCurrentFileButton: document.getElementById("renameCurrentFileButton"),
  deleteCurrentFileButton: document.getElementById("deleteCurrentFileButton"),
  svgEditor: document.getElementById("svgEditor"),
  statusMessage: document.getElementById("statusMessage"),
  editorAnnouncer: document.getElementById("editorAnnouncer"),
  errorPanel: document.getElementById("errorPanel"),
  errorList: document.getElementById("errorList"),
  fileList: document.getElementById("fileList"),
  fileLibrarySummary: document.getElementById("fileLibrarySummary"),
  attributePromptToggle: document.getElementById("attributePromptToggle"),
  primitiveList: document.getElementById("primitiveList"),
  newFileDialog: document.getElementById("newFileDialog"),
  newFileForm: document.getElementById("newFileForm"),
  newFileDialogHeading: document.getElementById("newFileDialogHeading"),
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
  jumpDialogHeading: document.getElementById("jumpDialogHeading"),
  jumpLineInput: document.getElementById("jumpLineInput"),
  shortcutsDialog: document.getElementById("shortcutsDialog"),
  shortcutsDialogHeading: document.getElementById("shortcutsDialogHeading"),
  shortcutModifierInput: document.getElementById("shortcutModifierInput"),
  shortcutKeyInput: document.getElementById("shortcutKeyInput"),
  indentModifierInput: document.getElementById("indentModifierInput"),
  indentKeyInput: document.getElementById("indentKeyInput"),
  outdentModifierInput: document.getElementById("outdentModifierInput"),
  outdentKeyInput: document.getElementById("outdentKeyInput"),
  exportDialog: document.getElementById("exportDialog"),
  exportDialogHeading: document.getElementById("exportDialogHeading"),
  exportForm: document.getElementById("exportForm"),
  errorDialog: document.getElementById("errorDialog"),
  errorForm: document.getElementById("errorForm"),
  errorDialogHeading: document.getElementById("errorDialogHeading"),
  errorDialogSummary: document.getElementById("errorDialogSummary"),
  errorDialogList: document.getElementById("errorDialogList"),
  jumpToErrorButton: document.getElementById("jumpToErrorButton"),
  exportTypeInput: document.getElementById("exportTypeInput"),
  exportWidthInput: document.getElementById("exportWidthInput"),
  exportHeightInput: document.getElementById("exportHeightInput"),
  exportDpiInput: document.getElementById("exportDpiInput")
};

document.getElementById("copyrightYear").textContent = new Date().getFullYear();

document.getElementById("newFileButton").addEventListener("click", (event) => {
  state.lastFocusedTrigger = event.currentTarget;
  openDialog(elements.newFileDialog, elements.newFileDialogHeading);
});

document.getElementById("openShortcutsButton").addEventListener("click", (event) => {
  state.lastFocusedTrigger = event.currentTarget;
  openShortcutsDialog();
});

document.getElementById("saveButton").addEventListener("click", saveCurrentFile);
document.getElementById("saveFromRenderButton").addEventListener("click", saveCurrentFile);
document.getElementById("downloadButton").addEventListener("click", downloadSvg);
document.getElementById("backToHomeFromEditorButton").addEventListener("click", returnHome);
document.getElementById("backToHomeFromRenderButton").addEventListener("click", returnHome);
document.getElementById("renderButton").addEventListener("click", renderSvg);
document.getElementById("returnToCodeButton").addEventListener("click", returnToEditor);
document.getElementById("printButton").addEventListener("click", () => window.print());
elements.renameCurrentFileButton.addEventListener("click", () => {
  if (state.currentFileId) {
    renameFile(state.currentFileId);
  }
});
elements.deleteCurrentFileButton.addEventListener("click", () => {
  if (state.currentFileId) {
    deleteFile(state.currentFileId);
  }
});
elements.jumpToErrorButton.addEventListener("click", jumpToCurrentError);
document.getElementById("jumpToLineButton").addEventListener("click", (event) => {
  state.lastFocusedTrigger = event.currentTarget;
  openDialog(elements.jumpDialog, elements.jumpDialogHeading);
});
document.getElementById("exportRasterButton").addEventListener("click", (event) => {
  state.lastFocusedTrigger = event.currentTarget;
  syncExportDimensionsFromSvg();
  openDialog(elements.exportDialog, elements.exportDialogHeading);
});
document.getElementById("resetShortcutButton").addEventListener("click", () => {
  state.shortcuts = cloneShortcuts(defaultShortcuts);
  syncShortcutInputs();
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.closeDialog);
    closeDialog(dialog);
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
  setActiveView("editor");
  updateWorkspaceMeta(file);
  persistFiles();
  renderFileList();
  clearMessages();
  setStatus(`Created ${file.name}.`);
  closeDialog(elements.newFileDialog, { restoreFocus: false });
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
  closeDialog(elements.shapeDialog, { restoreFocus: false });
  setStatus(`Inserted <${primitive.name}>.`);
  focusEditorOnInsertedMarkup(markup);
});

elements.jumpForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const line = Number(elements.jumpLineInput.value);
  closeDialog(elements.jumpDialog, { restoreFocus: false });
  focusEditorLine(line);
});

[elements.shortcutsDialog, elements.newFileDialog, elements.shapeDialog, elements.jumpDialog, elements.exportDialog, elements.errorDialog].forEach((dialog) => {
  dialog.addEventListener("close", handleDialogClose);
});

elements.exportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await exportRaster();
    closeDialog(elements.exportDialog);
    setStatus("Raster export downloaded.");
  } catch (error) {
    setStatus(error.message);
  }
});

document.getElementById("shortcutsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.shortcuts = {
    jumpToLine: {
      modifiers: elements.shortcutModifierInput.value,
      key: elements.shortcutKeyInput.value.trim().toUpperCase() || defaultShortcuts.jumpToLine.key
    },
    indent: {
      modifiers: elements.indentModifierInput.value,
      key: elements.indentKeyInput.value.trim() || defaultShortcuts.indent.key
    },
    outdent: {
      modifiers: elements.outdentModifierInput.value,
      key: elements.outdentKeyInput.value.trim() || defaultShortcuts.outdent.key
    }
  };
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(state.shortcuts));
  closeDialog(elements.shortcutsDialog);
  setStatus(`Shortcuts saved. Jump to Line: ${describeShortcut(state.shortcuts.jumpToLine)}. Tab Indent: ${describeShortcut(state.shortcuts.indent)}. Tab Outdent: ${describeShortcut(state.shortcuts.outdent)}.`);
});

elements.svgEditor.addEventListener("input", () => {
  clearStatus();
  updateCurrentFileContent(elements.svgEditor.value);
});

elements.svgEditor.addEventListener("keydown", (event) => {
  if (matchesShortcut(event, state.shortcuts.indent)) {
    event.preventDefault();
    indentSelection();
    return;
  }

  if (matchesShortcut(event, state.shortcuts.outdent)) {
    event.preventDefault();
    outdentSelection();
  }
});

document.addEventListener("keydown", (event) => {
  if (matchesShortcut(event, state.shortcuts.jumpToLine)) {
    event.preventDefault();
    state.lastFocusedTrigger = document.activeElement;
    openDialog(elements.jumpDialog, elements.jumpDialogHeading);
  }
});

initPrimitiveList();
updateShortcutModifierLabels();
renderFileList();
setActiveView("home");

function openShortcutsDialog() {
  syncShortcutInputs();
  openDialog(elements.shortcutsDialog, elements.shortcutsDialogHeading);
}

function openDialog(dialog, focusTarget) {
  state.pendingFocusTarget = null;
  state.shouldRestoreFocus = true;
  dialog.showModal();
  updateDocumentTitle({ dialog: dialog.id });
  requestAnimationFrame(() => {
    focusTarget.focus();
  });
}

function closeDialog(dialog, options = {}) {
  state.shouldRestoreFocus = options.restoreFocus !== false;
  state.pendingFocusTarget = options.nextFocusTarget || null;
  dialog.close();
}

function handleDialogClose() {
  if (state.pendingFocusTarget) {
    requestAnimationFrame(() => {
      state.pendingFocusTarget.focus();
      state.pendingFocusTarget = null;
    });
    updateDocumentTitle();
    return;
  }

  if (state.shouldRestoreFocus) {
    restoreFocus();
  }

  updateDocumentTitle();
}

function syncShortcutInputs() {
  elements.shortcutModifierInput.value = state.shortcuts.jumpToLine.modifiers;
  elements.shortcutKeyInput.value = state.shortcuts.jumpToLine.key;
  elements.indentModifierInput.value = state.shortcuts.indent.modifiers;
  elements.indentKeyInput.value = state.shortcuts.indent.key;
  elements.outdentModifierInput.value = state.shortcuts.outdent.modifiers;
  elements.outdentKeyInput.value = state.shortcuts.outdent.key;
}

function updateShortcutModifierLabels() {
  document.querySelectorAll(".shortcut-modifier-input").forEach((select) => {
    [...select.options].forEach((option) => {
      option.textContent = option.value
        .split("+")
        .map((modifier) => mapModifierLabel(modifier))
        .join("+");
    });
  });
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
  const orderedOptionalAttributes = primitive.optional.slice().sort((left, right) => {
    if (left === "id" && right === "class") {
      return -1;
    }

    if (left === "class" && right === "id") {
      return 1;
    }

    return 0;
  });

  [...primitive.required, ...orderedOptionalAttributes].forEach((attribute) => {
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

  openDialog(elements.shapeDialog, elements.shapeDialogTitle);
}

function createFileRecord(name, viewBox, width, height) {
  const safeName = sanitizeFilename(name || "untitled");
  const content = [
    `<svg viewBox="${viewBox}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
    `<title>${escapeXml(safeName)}</title>`,
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
      if (primitive.name === "text" && attribute === "content") {
        return;
      }
      const value = String(values.get(attribute) || "").trim();
      attributes.push(`${attribute}="${escapeXml(value)}"`);
    });

    primitive.optional.forEach((attribute) => {
      const value = String(values.get(attribute) || "").trim();
      if (attribute === "id" || attribute === "class") {
        if (value) {
          attributes.push(`${attribute}="${escapeXml(value)}"`);
        }
        return;
      }
      if (attribute === "fill") {
        attributes.push(`fill="${escapeXml(value || "none")}"`);
        return;
      }

      if (attribute === "style") {
        attributes.push(`style="${escapeXml(value || "stroke: black; stroke-width: 2; fill: none;")}"`);
        return;
      }

      if (value) {
        attributes.push(`${attribute}="${escapeXml(value)}"`);
      }
    });

    if (primitive.name === "text") {
      const content = String(values.get("content") || "").trim();
      return `<text ${attributes.filter((attribute) => !attribute.startsWith("content=")).join(" ")}>${escapeXml(content)}</text>\n`;
    }

    return `<${primitive.name}${attributes.length ? ` ${attributes.join(" ")}` : ""} />\n`;
  }

  if (primitive.name === "rect") {
    return `<rect x="0" y="0" width="100" height="100" stroke="black" stroke-width="2" fill="oldLace" />\n`;
  }

  if (primitive.name === "circle") {
    return `<circle cx="100" cy="100" r="50" stroke="black" stroke-width="2" fill="oldLace" />\n`;
  }

  if (primitive.name === "ellipse") {
    return `<ellipse cx="100" cy="100" rx="25" ry="25" stroke="black" stroke-width="2" fill="oldLace" />\n`;
  }

  if (primitive.name === "line") {
    return `<line x1="0" y1="0" x2="100" y2="100" stroke="black" stroke-width="2" />\n`;
  }

  if (primitive.name === "polyline") {
    return `<polyline points="" stroke="black" stroke-width="2" fill="oldLace" />\n`;
  }

  if (primitive.name === "polygon") {
    return `<polygon points="" stroke="black" stroke-width="2" fill="oldLace" />\n`;
  }

  if (primitive.name === "path") {
    return `<path d="" style="stroke: black; stroke-width: 2; fill: none;" />\n`;
  }

  if (primitive.name === "text") {
    return `<text x="0" y="0" fill="oldLace">Text</text>\n`;
  }

  return `<${primitive.name} />\n`;
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
  elements.renderViewHeading.textContent = `${file.name} Print View`;
  elements.fileMeta.textContent = `Updated ${formatDate(file.updatedAt)}`;
  elements.renameCurrentFileButton.textContent = `Rename ${file.name}`;
  elements.deleteCurrentFileButton.textContent = `Delete ${file.name}`;
  updateDocumentTitle();
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date).replace(/\s/g, "");
  return `${datePart}, ${timePart}`;
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

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.textContent = `${file.name}, ${formatDate(file.updatedAt)}`;
      openButton.setAttribute("aria-description", "Opens file");
      openButton.addEventListener("click", () => openFile(file.id));

      const actions = document.createElement("div");
      actions.className = "file-actions";

      const renameButton = document.createElement("button");
      renameButton.type = "button";
      renameButton.textContent = `Rename ${file.name}`;
      renameButton.addEventListener("click", () => renameFile(file.id));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = `Delete ${file.name}`;
      deleteButton.addEventListener("click", () => deleteFile(file.id));

      actions.append(renameButton, deleteButton);
      item.append(openButton, actions);
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
  setActiveView("editor");
  elements.svgEditor.value = file.content;
  updateWorkspaceMeta(file);
  clearMessages();
  setStatus(`Opened ${file.name}.`);
  focusActiveHeading(elements.currentFileHeading);
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
    elements.renameCurrentFileButton.textContent = "Rename File";
    elements.deleteCurrentFileButton.textContent = "Delete File";
    elements.renderViewHeading.textContent = "Rendered SVG";
    elements.svgEditor.value = "";
    elements.renderCanvas.replaceChildren(elements.renderCanvasHeading);
    setActiveView("home");
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
    file = createFileRecord("untitled", "0 0 850 1100", "850", "1100");
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
    presentRenderErrors(parseSvgErrors(parserError.textContent));
    return;
  }

  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== "svg") {
    presentRenderErrors([
      {
        line: 1,
        column: 1,
        rawMessage: "The document must begin with a valid <svg> root element.",
        plainLanguage: "Make sure the file starts with an opening <svg> tag and that it is written correctly."
      }
    ]);
    return;
  }

  sanitizeSvg(svg);
  clearRenderErrors();
  elements.renderCanvas.replaceChildren(elements.renderCanvasHeading, svg.cloneNode(true));
  setActiveView("render");
  elements.renderMeta.textContent = `${elements.currentFileHeading.textContent} rendered and ready for print or export.`;
  focusActiveHeading(elements.renderViewHeading);
  setStatus("SVG rendered.");
}

function returnToEditor() {
  setActiveView("editor");
  focusActiveHeading(elements.currentFileHeading);
}

function returnHome() {
  setActiveView("home");
  clearStatus();
  document.getElementById("shapeCrafterHomeLink").focus();
}

function setActiveView(viewName) {
  syncRegion(elements.homeView, viewName === "home");
  syncRegion(elements.workspaceSection, viewName === "editor" || viewName === "render");
  syncRegion(elements.editorView, viewName === "editor");
  syncRegion(elements.renderView, viewName === "render");
  updateDocumentTitle({ view: viewName });
}

function syncRegion(element, isActive) {
  element.hidden = !isActive;
  if (isActive) {
    element.removeAttribute("inert");
  } else {
    element.setAttribute("inert", "");
  }
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
    const savedShortcuts = JSON.parse(localStorage.getItem(SHORTCUTS_KEY) || "{}");

    if ("modifiers" in savedShortcuts || "key" in savedShortcuts) {
      return {
        jumpToLine: {
          ...defaultShortcuts.jumpToLine,
          modifiers: savedShortcuts.modifiers === "Alt+Shift" && String(savedShortcuts.key || "").toUpperCase() === "J"
            ? defaultShortcuts.jumpToLine.modifiers
            : savedShortcuts.modifiers || defaultShortcuts.jumpToLine.modifiers,
          key: String(savedShortcuts.key || defaultShortcuts.jumpToLine.key).toUpperCase()
        },
        indent: { ...defaultShortcuts.indent },
        outdent: { ...defaultShortcuts.outdent }
      };
    }

    return {
      jumpToLine: {
        ...defaultShortcuts.jumpToLine,
        ...(savedShortcuts.jumpToLine || {})
      },
      indent: {
        ...defaultShortcuts.indent,
        ...(savedShortcuts.indent || {})
      },
      outdent: {
        ...defaultShortcuts.outdent,
        ...(savedShortcuts.outdent || {})
      }
    };
  } catch (error) {
    return cloneShortcuts(defaultShortcuts);
  }
}

function describeShortcut(shortcut) {
  const modifierLabel = shortcut.modifiers
    .split("+")
    .map((modifier) => mapModifierLabel(modifier))
    .join("+");
  return `${modifierLabel}+${String(shortcut.key).toUpperCase()}`;
}

function cloneShortcuts(shortcuts) {
  return {
    jumpToLine: { ...shortcuts.jumpToLine },
    indent: { ...shortcuts.indent },
    outdent: { ...shortcuts.outdent }
  };
}

function mapModifierLabel(modifier) {
  if (modifier === "Alt") {
    return isApplePlatform() ? "Option" : "Alt";
  }

  return modifier;
}

function isApplePlatform() {
  return /Mac|iPhone|iPad|iPod/i.test(window.navigator.platform || window.navigator.userAgent);
}

function updateDocumentTitle(stateOverride = {}) {
  const activeDialog = stateOverride.dialog || getOpenDialogId();
  if (activeDialog === "newFileDialog") {
    document.title = `Making New File - ${BASE_TITLE}`;
    return;
  }

  const currentFile = getCurrentFile();
  const filename = currentFile ? currentFile.name : "shapeCrafter";
  const activeView = stateOverride.view || getActiveView();

  if ((activeDialog === "errorDialog" || state.currentErrors.length) && currentFile) {
    document.title = `Error in ${filename} - ${BASE_TITLE}`;
    return;
  }

  if (activeView === "render" && currentFile) {
    document.title = `${filename} Print View - ${BASE_TITLE}`;
    return;
  }

  if (activeView === "editor" && currentFile) {
    document.title = `${filename} Editor - ${BASE_TITLE}`;
    return;
  }

  document.title = BASE_TITLE;
}

function getActiveView() {
  if (!elements.renderView.hidden) {
    return "render";
  }

  if (!elements.editorView.hidden) {
    return "editor";
  }

  return "home";
}

function getOpenDialogId() {
  const dialogs = [
    elements.newFileDialog,
    elements.shapeDialog,
    elements.jumpDialog,
    elements.shortcutsDialog,
    elements.exportDialog,
    elements.errorDialog
  ];
  const openDialog = dialogs.find((dialog) => dialog.open);
  return openDialog ? openDialog.id : "";
}

function getCurrentFile() {
  return loadFiles().find((item) => item.id === state.currentFileId) || null;
}

function focusActiveHeading(heading) {
  requestAnimationFrame(() => {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  });
}

function indentSelection() {
  const editor = elements.svgEditor;
  const { value, selectionStart, selectionEnd } = editor;
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEnd = value.indexOf("\n", selectionEnd);
  const blockEnd = lineEnd === -1 ? value.length : lineEnd;
  const selectionText = value.slice(lineStart, selectionEnd);
  const endsAtLineStart = selectionEnd > lineStart && value[selectionEnd - 1] === "\n";
  const selectedLines = selectionText.split("\n");
  const lineCount = endsAtLineStart ? Math.max(selectedLines.length - 1, 1) : selectedLines.length;
  const targetLineCount = Math.max(lineCount, 1);
  const blockText = value.slice(lineStart, blockEnd);
  const updatedBlock = blockText
    .split("\n")
    .map((line, index) => (index < targetLineCount ? `\t${line}` : line))
    .join("\n");
  const nextValue = value.slice(0, lineStart) + updatedBlock + value.slice(blockEnd);

  editor.value = nextValue;
  editor.selectionStart = selectionStart + 1;
  editor.selectionEnd = selectionEnd + targetLineCount;
  updateCurrentFileContent(nextValue);
  editor.focus();
  announceEditorChange(targetLineCount === 1 ? "Indented 1 tab" : `Indented ${targetLineCount} tabs`);
}

function outdentSelection() {
  const editor = elements.svgEditor;
  const { value, selectionStart, selectionEnd } = editor;
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEnd = value.indexOf("\n", selectionEnd);
  const blockEnd = lineEnd === -1 ? value.length : lineEnd;
  const selectionText = value.slice(lineStart, selectionEnd);
  const endsAtLineStart = selectionEnd > lineStart && value[selectionEnd - 1] === "\n";
  const selectedLines = selectionText.split("\n");
  const lineCount = endsAtLineStart ? Math.max(selectedLines.length - 1, 1) : selectedLines.length;
  const targetLineCount = Math.max(lineCount, 1);
  const blockText = value.slice(lineStart, blockEnd);
  const blockLines = blockText.split("\n");
  let removedTabs = 0;
  let removedFromFirstLine = 0;

  for (let i = 0; i < targetLineCount; i += 1) {
    if (blockLines[i].startsWith("\t")) {
      blockLines[i] = blockLines[i].slice(1);
      removedTabs += 1;
      if (i === 0) {
        removedFromFirstLine = 1;
      }
    }
  }

  const nextValue = value.slice(0, lineStart) + blockLines.join("\n") + value.slice(blockEnd);
  const nextSelectionStart = Math.max(lineStart, selectionStart - removedFromFirstLine);
  editor.value = nextValue;
  editor.selectionStart = nextSelectionStart;
  editor.selectionEnd = Math.max(nextSelectionStart, selectionEnd - removedTabs);
  updateCurrentFileContent(nextValue);
  editor.focus();

  const currentLine = blockLines[0] || "";
  const levelMatch = currentLine.match(/^\t*/);
  const level = levelMatch ? levelMatch[0].length : 0;
  announceEditorChange(`Outdented to Level ${level}`);
}

function announceEditorChange(message) {
  elements.editorAnnouncer.textContent = "";
  requestAnimationFrame(() => {
    elements.editorAnnouncer.textContent = message;
  });
}

function matchesShortcut(event, shortcut) {
  if (!shortcut || event.key.toUpperCase() !== String(shortcut.key).toUpperCase()) {
    return false;
  }

  const required = shortcut.modifiers.split("+");
  const needsAlt = required.includes("Alt");
  const needsControl = required.includes("Control");
  const needsShift = required.includes("Shift");
  const needsMeta = required.includes("Meta");

  return event.altKey === needsAlt
    && event.ctrlKey === needsControl
    && event.shiftKey === needsShift
    && event.metaKey === needsMeta;
}

function setStatus(message) {
  elements.statusMessage.textContent = message;
}

function clearStatus() {
  elements.statusMessage.textContent = "";
}

function clearMessages() {
  clearStatus();
  clearRenderErrors();
}

function restoreFocus() {
  if (state.lastFocusedTrigger && typeof state.lastFocusedTrigger.focus === "function") {
    state.lastFocusedTrigger.focus();
  }
}

function parseSvgErrors(rawMessage) {
  const normalized = rawMessage.replace(/\r/g, "");
  const lines = normalized.split("\n");
  const errors = [];
  let pendingLocation = null;
  const ignoredPatterns = [
    /^this page contains the following errors:/i,
    /^below is a rendering of the page up to the first error\./i
  ];

  lines.forEach((line) => {
    const cleaned = line.replace(/\s+/g, " ").trim();
    if (!cleaned) {
      return;
    }

    if (ignoredPatterns.some((pattern) => pattern.test(cleaned))) {
      return;
    }

    const rangeLocationMatch = cleaned.match(/^from line\s+(\d+),\s*column\s+(\d+)(?:\s+to\s+line\s+\d+,\s*column\s+\d+)?;?\s*(.*)$/i);
    if (rangeLocationMatch) {
      pendingLocation = {
        line: Number(rangeLocationMatch[1]),
        column: Number(rangeLocationMatch[2])
      };
      const detail = cleanParserDetail(rangeLocationMatch[3] || "");
      if (detail) {
        errors.push({
          line: pendingLocation.line,
          column: pendingLocation.column,
          rawMessage: detail
        });
        pendingLocation = null;
      }
      return;
    }

    const inlineLocationMatch = cleaned.match(/^error on line\s+(\d+)\s+at column\s+(\d+):\s*(.*)$/i);
    if (inlineLocationMatch) {
      const detail = cleanParserDetail(inlineLocationMatch[3] || "");
      if (!detail) {
        return;
      }
      errors.push({
        line: Number(inlineLocationMatch[1]),
        column: Number(inlineLocationMatch[2]),
        rawMessage: detail
      });
      pendingLocation = null;
      return;
    }

    if (!pendingLocation) {
      return;
    }

    const detail = cleanParserDetail(cleaned);
    if (!detail) {
      return;
    }

    errors.push({
      line: pendingLocation.line,
      column: pendingLocation.column,
      rawMessage: detail
    });
    pendingLocation = null;
  });

  return dedupeErrors(errors);
}

function dedupeErrors(errors) {
  const seen = new Set();
  return errors.filter((error) => {
    const normalizedMessage = error.rawMessage
      .replace(/\s+/g, " ")
      .replace(/^\W+/, "")
      .trim()
      .toLowerCase();
    const key = `${error.line || ""}-${error.column || ""}-${normalizedMessage}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function presentRenderErrors(errors) {
  if (!errors.length) {
    clearRenderErrors();
    setStatus("The SVG could not be rendered.");
    elements.svgEditor.focus();
    return;
  }

  state.currentErrors = errors;
  renderErrorPanel();
  renderErrorDialog();
  setStatus("The SVG could not be rendered.");
  state.lastFocusedTrigger = document.getElementById("renderButton");
  openDialog(elements.errorDialog, elements.errorDialogHeading);
}

function renderErrorPanel() {
  elements.errorList.replaceChildren();
  if (!state.currentErrors.length) {
    elements.errorPanel.hidden = true;
    return;
  }

  const fragment = document.createDocumentFragment();
  state.currentErrors.forEach((error) => {
    const item = document.createElement("li");
    item.textContent = formatErrorItem(error);
    fragment.appendChild(item);
  });
  elements.errorList.appendChild(fragment);
  elements.errorPanel.hidden = false;
}

function renderErrorDialog() {
  const errorCount = state.currentErrors.length;
  elements.errorDialogList.replaceChildren();
  elements.errorDialogSummary.textContent = errorCount === 1
    ? "The browser found one SVG parsing error."
    : `The browser found ${errorCount} SVG parsing errors.`;
  elements.jumpToErrorButton.textContent = errorCount === 1 ? "Jump to Error" : "Jump to First Error";

  const fragment = document.createDocumentFragment();
  state.currentErrors.forEach((error) => {
    const item = document.createElement("li");
    item.textContent = formatErrorItem(error);
    fragment.appendChild(item);
  });
  elements.errorDialogList.appendChild(fragment);
}

function formatErrorItem(error) {
  return `Line ${error.line}${error.column ? `, column ${error.column}` : ""}: ${error.rawMessage}`;
}

function cleanParserDetail(message) {
  return message
    .replace(/^error on line \d+ at column \d+:\s*/i, "")
    .replace(/^parser error\s*:?\s*/i, "")
    .replace(/^xml parsing error\s*:?\s*/i, "")
    .replace(/^[.:;\-]+/, "")
    .trim();
}

function clearRenderErrors() {
  state.currentErrors = [];
  elements.errorList.replaceChildren();
  elements.errorDialogList.replaceChildren();
  elements.errorPanel.hidden = true;
  updateDocumentTitle();
}

function jumpToCurrentError() {
  const firstError = state.currentErrors[0];
  closeDialog(elements.errorDialog, { restoreFocus: false });
  if (firstError && firstError.line) {
    focusEditorLine(firstError.line);
    return;
  }
  elements.svgEditor.focus();
}
