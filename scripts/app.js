const STORAGE_KEY = "shapeCrafter.files";
const SHORTCUTS_KEY = "shapeCrafter.shortcuts";
const SETTINGS_KEY = "shapeCrafter.settings";
const BASE_TITLE = "shapeCrafter - BlindSVG";
const MESSAGE_TIMEOUT_MS = 5000;
const MESSAGE_FADE_MS = 240;
const AUTOSAVE_MINUTES_DEFAULT = 5;
const TEMPLATE_MANIFEST_PATH = "templates/templates.json";
const BRAILLE_TABLES = {
	grade1: "unicode.dis,en-ueb-g1.ctb",
	grade2: "unicode.dis,en-ueb-g2.ctb",
	usGrade1: "unicode.dis,en-us-g1.ctb",
	usGrade2: "unicode.dis,en-us-g2.ctb",
	britishGrade1: "unicode.dis,en-gb-g1.utb",
	britishGrade2: "unicode.dis,en-GB-g2.ctb",
	usMath: "unicode.dis,en-us-mathtext.ctb"
};

const SIZE_PRESETS = {
	"us-letter-portrait": {
		label: "US Letter - Portrait",
		viewBox: "0 0 850 1100",
		width: "850",
		height: "1100"
	},
	"us-letter-landscape": {
		label: "US Letter - Landscape",
		viewBox: "0 0 1100 850",
		width: "1100",
		height: "850"
	},
	"braille-full": {
		label: "Braille Paper Full Size",
		viewBox: "0 0 1100 1150",
		width: "1100",
		height: "1150"
	},
	"a4-portrait": {
		label: "A4 - Portrait",
		viewBox: "0 0 827 1169",
		width: "827",
		height: "1169"
	},
	"legal-portrait": {
		label: "Legal - Portrait",
		viewBox: "0 0 850 1400",
		width: "850",
		height: "1400"
	},
	"tabloid-portrait": {
		label: "Tabloid - Portrait",
		viewBox: "0 0 1100 1700",
		width: "1100",
		height: "1700"
	},
	"icon-1024": {
		label: "1024 by 1024 Icon",
		viewBox: "0 0 1024 1024",
		width: "1024",
		height: "1024"
	}
};

const PRIMITIVES = [
	{
		name: "rect",
		required: ["x", "y", "width", "height"],
		optional: ["rx", "ry", "stroke", "stroke-width", "fill", "id", "class"]
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
	quickAdd: {
		modifiers: "Control+Shift",
		key: "A"
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

const defaultSettings = {
	renderDelay: 1.5,
	renderSound: false,
	autosave: true,
	autosaveMinutes: AUTOSAVE_MINUTES_DEFAULT
};

const state = {
	currentFileId: "",
	files: [],
	templates: [],
	currentErrors: [],
	currentSessionSnapshotContent: "",
	currentSessionSnapshotAt: "",
	lastFocusedTrigger: null,
	pendingDeleteFileId: "",
	pendingFileRowFocusId: "",
	openFileRowMenuId: "",
	pendingPrimitive: null,
	pendingFocusTarget: null,
	shouldRestoreFocus: true,
	shortcuts: loadShortcuts(),
	settings: loadSettings(),
	autosaveTimeoutId: 0,
	templateLoadPromise: null,
	toastTimeoutId: 0,
	toastFadeTimeoutId: 0,
	editorAnnouncementTimeoutId: 0,
	liveRenderTimeoutId: 0,
	audioContext: null,
	exportSyncSource: "",
	exportBaseWidthPx: 1000,
	exportBaseHeightPx: 1000,
	brailleConverterReady: false,
	brailleApi: null,
	lastRenderedMarkup: "",
	printTarget: "preview"
};

const messageTimeouts = new WeakMap();
const messageFadeTimeouts = new WeakMap();

const elements = {
	skipLink: document.getElementById("skip-link"),
	siteHeader: document.querySelector(".site-header"),
	mainContent: document.getElementById("mainContent"),
	siteFooter: document.querySelector(".site-footer"),
	homeView: document.getElementById("homeView"),
	homeHeading: document.getElementById("homeHeading"),
	openTemplateButton: document.getElementById("openTemplateButton"),
	workspaceSection: document.getElementById("workspaceSection"),
	editorView: document.getElementById("editorView"),
	fullscreenView: document.getElementById("fullscreenView"),
	fullscreenGraphicHeading: document.getElementById("fullscreenGraphicHeading"),
	editorFileActionsHost: document.getElementById("editorFileActionsHost"),
	fullscreenFileActionsHost: document.getElementById("fullscreenFileActionsHost"),
	renderPreviewDetails: document.getElementById("renderPreviewDetails"),
	renderPreviewCanvas: document.getElementById("renderPreviewCanvas"),
	renderPreviewCanvasHeading: document.getElementById("renderPreviewCanvasHeading"),
	renderPreviewPlaceholder: document.getElementById("renderPreviewPlaceholder"),
	renderPreviewErrorPanel: document.getElementById("renderPreviewErrorPanel"),
	renderPreviewErrorList: document.getElementById("renderPreviewErrorList"),
	fullscreenRenderCanvas: document.getElementById("fullscreenRenderCanvas"),
	fullscreenRenderPlaceholder: document.getElementById("fullscreenRenderPlaceholder"),
	renderMeta: document.getElementById("renderMeta"),
	currentFileHeading: document.getElementById("currentFileHeading"),
	fileMetaGroup: document.getElementById("fileMetaGroup"),
	fileMeta: document.getElementById("fileMeta"),
	renameCurrentFileButton: document.getElementById("renameCurrentFileButton"),
	deleteCurrentFileButton: document.getElementById("deleteCurrentFileButton"),
	saveAsButton: document.getElementById("saveAsButton"),
	revertButton: document.getElementById("revertButton"),
	liveViewToggle: document.getElementById("liveViewToggle"),
	renderDelayInput: document.getElementById("renderDelayInput"),
	renderSoundToggle: document.getElementById("renderSoundToggle"),
	autosaveToggle: document.getElementById("autosaveToggle"),
	autosaveMinutesInput: document.getElementById("autosaveMinutesInput"),
	svgEditor: document.getElementById("svgEditor"),
	statusMessage: document.getElementById("statusMessage"),
	editorAnnouncer: document.getElementById("editorAnnouncer"),
	errorPanel: document.getElementById("errorPanel"),
	errorList: document.getElementById("errorList"),
	brailleSourceInput: document.getElementById("brailleSourceInput"),
	brailleGradeSelect: document.getElementById("brailleGradeSelect"),
	brailleOutput: document.getElementById("brailleOutput"),
	clearBrailleInputButton: document.getElementById("clearBrailleInputButton"),
	convertBrailleButton: document.getElementById("convertBrailleButton"),
	copyBrailleOutputButton: document.getElementById("copyBrailleOutputButton"),
	brailleConverterStatus: document.getElementById("brailleConverterStatus"),
	fileTable: document.getElementById("fileTable"),
	fileTableBody: document.getElementById("fileTableBody"),
	fileLibrarySummary: document.getElementById("fileLibrarySummary"),
	attributePromptToggle: document.getElementById("attributePromptToggle"),
	mobileAttributePromptToggle: document.getElementById("mobileAttributePromptToggle"),
	primitiveList: document.getElementById("primitiveList"),
	primitiveSelect: document.getElementById("primitiveSelect"),
	addSelectedPrimitiveButton: document.getElementById("addSelectedPrimitiveButton"),
	newFileDialog: document.getElementById("newFileDialog"),
	newFileForm: document.getElementById("newFileForm"),
	newFileDialogHeading: document.getElementById("newFileDialogHeading"),
	fileNameInput: document.getElementById("fileNameInput"),
	sizePresetInput: document.getElementById("sizePresetInput"),
	viewBoxInput: document.getElementById("viewBoxInput"),
	svgWidthInput: document.getElementById("svgWidthInput"),
	svgHeightInput: document.getElementById("svgHeightInput"),
	templateDialog: document.getElementById("templateDialog"),
	templateForm: document.getElementById("templateForm"),
	templateDialogHeading: document.getElementById("templateDialogHeading"),
	templateGrid: document.getElementById("templateGrid"),
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
	quickAddModifierInput: document.getElementById("quickAddModifierInput"),
	quickAddKeyInput: document.getElementById("quickAddKeyInput"),
	indentModifierInput: document.getElementById("indentModifierInput"),
	indentKeyInput: document.getElementById("indentKeyInput"),
	outdentModifierInput: document.getElementById("outdentModifierInput"),
	outdentKeyInput: document.getElementById("outdentKeyInput"),
	quickAddDialog: document.getElementById("quickAddDialog"),
	quickAddForm: document.getElementById("quickAddForm"),
	quickAddDialogHeading: document.getElementById("quickAddDialogHeading"),
	quickAddList: document.getElementById("quickAddList"),
	exportDialog: document.getElementById("exportDialog"),
	exportDialogHeading: document.getElementById("exportDialogHeading"),
	exportForm: document.getElementById("exportForm"),
	errorDialog: document.getElementById("errorDialog"),
	errorForm: document.getElementById("errorForm"),
	errorDialogHeading: document.getElementById("errorDialogHeading"),
	errorDialogSummary: document.getElementById("errorDialogSummary"),
	errorDialogList: document.getElementById("errorDialogList"),
	jumpToErrorButton: document.getElementById("jumpToErrorButton"),
	deleteDialog: document.getElementById("deleteDialog"),
	deleteForm: document.getElementById("deleteForm"),
	deleteDialogHeading: document.getElementById("deleteDialogHeading"),
	deleteDialogMessage: document.getElementById("deleteDialogMessage"),
	confirmDeleteButton: document.getElementById("confirmDeleteButton"),
	exportTypeInput: document.getElementById("exportTypeInput"),
	exportUnitsInput: document.getElementById("exportUnitsInput"),
	exportWidthLabel: document.getElementById("exportWidthLabel"),
	exportHeightLabel: document.getElementById("exportHeightLabel"),
	scaleProportionatelyInput: document.getElementById("scaleProportionatelyInput"),
	exportWidthInput: document.getElementById("exportWidthInput"),
	exportHeightInput: document.getElementById("exportHeightInput"),
	exportDpiInput: document.getElementById("exportDpiInput"),
	toast: document.getElementById("toast"),
	openFullscreenButton: document.getElementById("openFullscreenButton"),
	closeFullscreenButton: document.getElementById("closeFullscreenButton"),
	fileActionsPopdown: document.querySelector(".file-actions-popdown"),
	fileActionsButton: document.getElementById("fileActionsButton"),
	fileActionsMenu: document.getElementById("fileActionsMenu")
};

document.getElementById("copyrightYear").textContent = new Date().getFullYear();

document.getElementById("newFileButton").addEventListener("click", (event) => {
	state.lastFocusedTrigger = event.currentTarget;
	prepareNewFileDialog();
	openDialog(elements.newFileDialog, elements.newFileDialogHeading);
});

elements.openTemplateButton.addEventListener("click", (event) => {
	state.lastFocusedTrigger = event.currentTarget;
	openDialog(elements.templateDialog, elements.templateDialogHeading);
});

document.getElementById("openShortcutsButton").addEventListener("click", (event) => {
	state.lastFocusedTrigger = event.currentTarget;
	openShortcutsDialog();
});

document.getElementById("saveButton").addEventListener("click", saveCurrentFile);
elements.saveAsButton.addEventListener("click", saveCurrentFileAs);
document.getElementById("downloadButton").addEventListener("click", downloadSvg);
document.getElementById("backToHomeFromEditorButton").addEventListener("click", returnHome);
document.getElementById("renderButton").addEventListener("click", () => {
	renderSvg({ suppressErrors: false, source: "manual" });
});
document.getElementById("printButton").addEventListener("click", printRenderedSvg);
elements.openFullscreenButton.addEventListener("click", openFullscreenGraphic);
elements.closeFullscreenButton.addEventListener("click", closeFullscreenGraphic);
elements.fileActionsButton.addEventListener("click", handleFileActionsButtonClick);
elements.fileActionsButton.addEventListener("keydown", handleFileActionsButtonKeydown);
elements.fileActionsMenu.addEventListener("keydown", handleFileActionsMenuKeydown);
elements.renameCurrentFileButton.addEventListener("click", () => {
	if (state.currentFileId) {
		renameFile(state.currentFileId);
	}
});
elements.revertButton.addEventListener("click", revertCurrentFileToSessionStart);
elements.deleteCurrentFileButton.addEventListener("click", () => {
	if (state.currentFileId) {
		openDeleteDialog(state.currentFileId, elements.deleteCurrentFileButton);
	}
});
elements.jumpToErrorButton.addEventListener("click", jumpToCurrentError);
elements.confirmDeleteButton.addEventListener("click", confirmDeleteFile);
document.getElementById("jumpToLineButton").addEventListener("click", (event) => {
	state.lastFocusedTrigger = event.currentTarget;
	openDialog(elements.jumpDialog, elements.jumpDialogHeading);
});
document.getElementById("exportRasterButton").addEventListener("click", (event) => {
	state.lastFocusedTrigger = event.currentTarget;
	syncExportDimensionsFromSvg();
	closeFileActionsMenu();
	openDialog(elements.exportDialog, elements.exportDialogHeading);
});
document.getElementById("resetShortcutButton").addEventListener("click", () => {
	state.shortcuts = cloneShortcuts(defaultShortcuts);
	syncShortcutInputs();
});
elements.clearBrailleInputButton.addEventListener("click", clearBrailleConverter);
elements.convertBrailleButton.addEventListener("click", updateBrailleConversion);
elements.copyBrailleOutputButton.addEventListener("click", copyBrailleOutput);

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
	button.addEventListener("click", () => {
		const dialog = document.getElementById(button.dataset.closeDialog);
		closeDialog(dialog);
	});
});

document.addEventListener("pointerdown", handleDocumentPointerDown);
window.addEventListener("beforeunload", handleBeforeUnload);

elements.fileNameInput.addEventListener("input", () => {
	elements.fileNameInput.setCustomValidity("");
});

elements.sizePresetInput.addEventListener("change", handleSizePresetChange);

elements.fileNameInput.addEventListener("invalid", () => {
	if (!elements.fileNameInput.value.trim()) {
		elements.fileNameInput.setCustomValidity("Please provide a filename");
	}
});

elements.exportUnitsInput.addEventListener("change", syncExportUnits);
elements.exportWidthInput.addEventListener("input", () => syncExportDimensionPair("width"));
elements.exportHeightInput.addEventListener("input", () => syncExportDimensionPair("height"));
elements.exportWidthInput.addEventListener("input", validateExportInputs);
elements.exportHeightInput.addEventListener("input", validateExportInputs);
elements.exportDpiInput.addEventListener("input", validateExportDpiInput);
elements.exportWidthInput.addEventListener("invalid", () => validateExportDimensionInput(elements.exportWidthInput, "width"));
elements.exportHeightInput.addEventListener("invalid", () => validateExportDimensionInput(elements.exportHeightInput, "height"));
elements.exportDpiInput.addEventListener("invalid", validateExportDpiInput);
elements.liveViewToggle.addEventListener("change", handleLiveViewChange);
elements.renderDelayInput.addEventListener("input", handleRenderDelayChange);
elements.renderSoundToggle.addEventListener("change", handleRenderSoundChange);
elements.autosaveToggle.addEventListener("change", handleAutosaveToggleChange);
elements.autosaveMinutesInput.addEventListener("input", handleAutosaveMinutesChange);
elements.attributePromptToggle.addEventListener("change", syncAttributePromptTogglesFromDesktop);
elements.mobileAttributePromptToggle.addEventListener("change", syncAttributePromptTogglesFromMobile);
elements.addSelectedPrimitiveButton.addEventListener("click", addSelectedPrimitiveFromPicker);

elements.newFileForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const filename = elements.fileNameInput.value.trim();
	const preset = elements.sizePresetInput.value;
	const viewBox = elements.viewBoxInput.value.trim();
	const width = elements.svgWidthInput.value.trim();
	const height = elements.svgHeightInput.value.trim();
	const file = createFileRecord(filename, viewBox, width, height, "", { sizePreset: preset });
	finalizeCurrentSession({ save: true });
	state.files = upsertFile(file);
	persistFiles();
	closeDialog(elements.newFileDialog, { restoreFocus: false });
	openEditorFile(file, { statusMessage: `Created ${file.name}.` });
});

[
	document.getElementById("printButton"),
	document.getElementById("saveButton"),
	document.getElementById("downloadButton"),
	elements.renameCurrentFileButton,
	elements.saveAsButton,
	elements.revertButton,
	elements.deleteCurrentFileButton
].forEach((button) => {
	button.addEventListener("click", closeFileActionsMenu);
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
	requestAnimationFrame(() => {
		focusEditorOnInsertedMarkup(markup);
	});
});

elements.jumpForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const line = Number(elements.jumpLineInput.value);
	closeDialog(elements.jumpDialog, { restoreFocus: false });
	focusEditorLine(line);
});

[elements.shortcutsDialog, elements.newFileDialog, elements.templateDialog, elements.shapeDialog, elements.jumpDialog, elements.quickAddDialog, elements.exportDialog, elements.errorDialog, elements.deleteDialog].forEach((dialog) => {
	dialog.addEventListener("close", handleDialogClose);
});

elements.exportForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	try {
		await exportRaster();
		closeDialog(elements.exportDialog, { restoreFocus: false });
		requestAnimationFrame(() => {
			elements.fileActionsButton.focus();
		});
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
		quickAdd: {
			modifiers: elements.quickAddModifierInput.value,
			key: elements.quickAddKeyInput.value.trim().toUpperCase() || defaultShortcuts.quickAdd.key
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
	setStatus(`Shortcuts saved. Jump to Line: ${describeShortcut(state.shortcuts.jumpToLine)}. Quick Add: ${describeShortcut(state.shortcuts.quickAdd)}. Tab Indent: ${describeShortcut(state.shortcuts.indent)}. Tab Outdent: ${describeShortcut(state.shortcuts.outdent)}.`);
});

elements.svgEditor.addEventListener("input", () => {
	clearStatus();
	updateCurrentFileContent(elements.svgEditor.value);
	if (elements.liveViewToggle.checked) {
		scheduleLiveRender();
	}
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
	if (event.key === "Escape" && !elements.fullscreenView.hidden) {
		event.preventDefault();
		closeFullscreenGraphic();
		return;
	}

	if (matchesShortcut(event, state.shortcuts.jumpToLine)) {
		event.preventDefault();
		state.lastFocusedTrigger = document.activeElement;
		openDialog(elements.jumpDialog, elements.jumpDialogHeading);
		return;
	}

	if (matchesShortcut(event, state.shortcuts.quickAdd)) {
		event.preventDefault();
		state.lastFocusedTrigger = document.activeElement;
		openQuickAddDialog();
	}
});

window.addEventListener("afterprint", () => {
	document.body.classList.remove("is-printing-svg");
	document.body.removeAttribute("data-print-target");
});

initPrimitiveList();
initPrimitiveSelect();
initQuickAddList();
updateShortcutModifierLabels();
initBrailleConverter();
renderFileList();
setActiveView("home");
syncAttributePromptToggles(elements.attributePromptToggle.checked);
syncSettingsInputs();
updateRenderButtonVisibility();
syncRenderSoundAvailability();
void initializeApp();

async function initializeApp() {
	await initTemplateGrid();
}

function openShortcutsDialog() {
	syncShortcutInputs();
	openDialog(elements.shortcutsDialog, elements.shortcutsDialogHeading);
}

function openQuickAddDialog() {
	openDialog(elements.quickAddDialog, elements.quickAddDialogHeading);
}

function prepareNewFileDialog() {
	elements.newFileForm.reset();
	elements.fileNameInput.value = "";
	elements.fileNameInput.setCustomValidity("");
	elements.sizePresetInput.value = "us-letter-portrait";
	applySizePreset("us-letter-portrait");
}

function handleSizePresetChange() {
	applySizePreset(elements.sizePresetInput.value);
}

function applySizePreset(presetId) {
	const preset = SIZE_PRESETS[presetId];
	const isCustom = presetId === "custom" || !preset;

	if (preset) {
		elements.viewBoxInput.value = preset.viewBox;
		elements.svgWidthInput.value = preset.width;
		elements.svgHeightInput.value = preset.height;
	}

	[elements.viewBoxInput, elements.svgWidthInput, elements.svgHeightInput].forEach((input) => {
		input.readOnly = !isCustom;
	});
}

function handleLiveViewChange() {
	updateRenderButtonVisibility();
	syncRenderSoundAvailability();
	if (elements.liveViewToggle.checked) {
		clearRenderErrors();
		clearInlineRenderErrors();
		scheduleLiveRender();
		return;
	}

	window.clearTimeout(state.liveRenderTimeoutId);
}

function updateRenderButtonVisibility() {
	document.getElementById("renderButton").hidden = elements.liveViewToggle.checked;
}

function handleRenderDelayChange() {
	state.settings.renderDelay = normalizeRenderDelay(elements.renderDelayInput.value);
	elements.renderDelayInput.value = String(state.settings.renderDelay);
	persistSettings();
}

function handleRenderSoundChange() {
	state.settings.renderSound = elements.renderSoundToggle.checked;
	persistSettings();
}

function handleAutosaveToggleChange() {
	state.settings.autosave = elements.autosaveToggle.checked;
	elements.autosaveMinutesInput.disabled = !state.settings.autosave;
	persistSettings();
	if (!state.settings.autosave) {
		window.clearTimeout(state.autosaveTimeoutId);
		return;
	}
	scheduleAutosave();
}

function handleAutosaveMinutesChange() {
	state.settings.autosaveMinutes = normalizeAutosaveMinutes(elements.autosaveMinutesInput.value);
	elements.autosaveMinutesInput.value = String(state.settings.autosaveMinutes);
	persistSettings();
	scheduleAutosave();
}

function scheduleLiveRender() {
	window.clearTimeout(state.liveRenderTimeoutId);
	state.liveRenderTimeoutId = window.setTimeout(() => {
		renderSvg({ suppressErrors: true, announceSuccess: false, source: "live" });
	}, state.settings.renderDelay * 1000);
}

function scheduleAutosave() {
	window.clearTimeout(state.autosaveTimeoutId);
	if (!state.settings.autosave || !state.currentFileId || !hasUnsavedChanges()) {
		return;
	}

	state.autosaveTimeoutId = window.setTimeout(() => {
		saveCurrentFile({ announce: false, showToastMessage: false, source: "autosave" });
	}, state.settings.autosaveMinutes * 60 * 1000);
}

function syncSettingsInputs() {
	elements.renderDelayInput.value = String(state.settings.renderDelay);
	elements.renderSoundToggle.checked = state.settings.renderSound;
	elements.autosaveToggle.checked = state.settings.autosave;
	elements.autosaveMinutesInput.value = String(state.settings.autosaveMinutes);
	elements.autosaveMinutesInput.disabled = !state.settings.autosave;
	syncRenderSoundAvailability();
}

function syncRenderSoundAvailability() {
	elements.renderSoundToggle.disabled = elements.liveViewToggle.checked;
}

function initBrailleConverter() {
	if (typeof LiblouisEasyApiAsync !== "function") {
		setBrailleConverterReady(false);
		setBrailleConverterStatus("Braille converter is unavailable right now.", { persist: true });
		return;
	}

	setBrailleConverterReady(false);
	setBrailleConverterStatus("Loading braille converter.", { persist: true });
	state.brailleApi = new LiblouisEasyApiAsync({
		capi: getPathFromOrigin("braille/build-no-tables-utf16.js"),
		easyapi: getPathFromOrigin("braille/easy-api.js")
	});
	state.brailleApi.enableOnDemandTableLoading(getPathFromOrigin("braille/tables/"), () => {
		state.brailleConverterReady = true;
		setBrailleConverterReady(true);
		setBrailleConverterStatus("Braille converter ready. Enter text and press Convert to Braille Unicode.");
	});
}

function getPathFromOrigin(path) {
	return new URL(path, window.location.href).pathname.replace(/^\/+/, "");
}

function setBrailleConverterReady(isReady) {
	elements.brailleSourceInput.disabled = !isReady;
	elements.brailleGradeSelect.disabled = !isReady;
	elements.clearBrailleInputButton.disabled = !isReady;
	elements.convertBrailleButton.disabled = !isReady;
	elements.copyBrailleOutputButton.disabled = !isReady;
	if (!isReady) {
		elements.brailleOutput.value = "";
	}
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

function openDeleteDialog(fileId, trigger) {
	const file = loadFiles().find((item) => item.id === fileId);
	if (!file) {
		return;
	}

	state.pendingDeleteFileId = fileId;
	state.lastFocusedTrigger = trigger;
	elements.deleteDialogMessage.textContent = `Delete ${file.name} from this browser?`;
	openDialog(elements.deleteDialog, elements.deleteDialogHeading);
}

function syncShortcutInputs() {
	elements.shortcutModifierInput.value = state.shortcuts.jumpToLine.modifiers;
	elements.shortcutKeyInput.value = state.shortcuts.jumpToLine.key;
	elements.quickAddModifierInput.value = state.shortcuts.quickAdd.modifiers;
	elements.quickAddKeyInput.value = state.shortcuts.quickAdd.key;
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

			insertPrimitiveIntoEditor(primitive);
		});
		listItem.appendChild(button);
		fragment.appendChild(listItem);
	});

	elements.primitiveList.appendChild(fragment);
}

function initPrimitiveSelect() {
	const fragment = document.createDocumentFragment();

	PRIMITIVES.forEach((primitive) => {
		const option = document.createElement("option");
		option.value = primitive.name;
		option.textContent = `<${primitive.name}>`;
		fragment.appendChild(option);
	});

	elements.primitiveSelect.appendChild(fragment);
}

function addSelectedPrimitiveFromPicker() {
	const primitive = PRIMITIVES.find((item) => item.name === elements.primitiveSelect.value);
	if (!primitive) {
		setStatus("Choose an SVG element before adding it.");
		return;
	}

	state.lastFocusedTrigger = elements.addSelectedPrimitiveButton;
	if (elements.mobileAttributePromptToggle.checked) {
		openShapeDialog(primitive);
		return;
	}

	insertPrimitiveIntoEditor(primitive);
}

function syncAttributePromptToggles(isChecked) {
	elements.attributePromptToggle.checked = isChecked;
	elements.mobileAttributePromptToggle.checked = isChecked;
}

function syncAttributePromptTogglesFromDesktop() {
	syncAttributePromptToggles(elements.attributePromptToggle.checked);
}

function syncAttributePromptTogglesFromMobile() {
	syncAttributePromptToggles(elements.mobileAttributePromptToggle.checked);
}

function initQuickAddList() {
	const fragment = document.createDocumentFragment();

	PRIMITIVES.forEach((primitive) => {
		const listItem = document.createElement("li");
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = `<${primitive.name}>`;
		button.addEventListener("click", () => {
			closeDialog(elements.quickAddDialog, { restoreFocus: false });
			requestAnimationFrame(() => {
				insertPrimitiveIntoEditor(primitive);
			});
		});
		listItem.appendChild(button);
		fragment.appendChild(listItem);
	});

	elements.quickAddList.appendChild(fragment);
}

async function initTemplateGrid() {
	elements.templateGrid.replaceChildren(buildTemplateGridMessage("Loading starter templates."));
	let templates = [];
	try {
		templates = await loadTemplateManifest();
	} catch (error) {
		elements.templateGrid.replaceChildren(buildTemplateGridMessage("Starter templates are unavailable right now."));
		setStatus("Starter templates could not be loaded.");
		return;
	}

	const fragment = document.createDocumentFragment();

	templates.forEach((template) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "template-card";
		button.addEventListener("click", () => {
			closeDialog(elements.templateDialog, { restoreFocus: false });
			requestAnimationFrame(async () => {
				await startFileFromTemplate(template.id);
			});
		});

		const preview = document.createElement("img");
		preview.className = "template-card__preview";
		preview.alt = "";
		preview.src = template.previewPath || template.path;

		const textWrap = document.createElement("span");
		textWrap.className = "template-card__text";

		const title = document.createElement("span");
		title.className = "template-card__title";
		title.textContent = template.name;

		const blurb = document.createElement("span");
		blurb.className = "template-card__blurb";
		blurb.textContent = template.blurb;

		textWrap.append(title, blurb);
		button.append(preview, textWrap);
		fragment.appendChild(button);
	});

	elements.templateGrid.replaceChildren(fragment);
}

function buildTemplateGridMessage(message) {
	const text = document.createElement("p");
	text.textContent = message;
	return text;
}

async function loadTemplateManifest() {
	if (state.templates.length) {
		return state.templates;
	}

	if (!state.templateLoadPromise) {
		state.templateLoadPromise = fetch(TEMPLATE_MANIFEST_PATH)
			.then((response) => {
				if (!response.ok) {
					throw new Error("Template manifest could not be loaded.");
				}
				return response.json();
			})
			.then((manifest) => {
				if (!Array.isArray(manifest)) {
					throw new Error("Template manifest is not in the expected format.");
				}
				state.templates = manifest;
				return state.templates;
			})
			.catch((error) => {
				state.templateLoadPromise = null;
				throw error;
			});
	}

	return state.templateLoadPromise;
}

async function startFileFromTemplate(templateId) {
	const templates = await loadTemplateManifest();
	const template = templates.find((item) => item.id === templateId);
	if (!template) {
		setStatus("That starter template could not be found.");
		return;
	}

	const preset = SIZE_PRESETS[template.sizePreset];
	if (!preset) {
		setStatus("That starter template is missing its size preset.");
		return;
	}

	let templateSource = "";
	try {
		templateSource = await loadTemplateSource(template.path);
	} catch (error) {
		setStatus("That starter template could not be opened.");
		return;
	}

	const file = createFileRecord(
		template.fileName,
		preset.viewBox,
		preset.width,
		preset.height,
		templateSource,
		{ sizePreset: template.sizePreset }
	);

	finalizeCurrentSession({ save: true });
	state.files = upsertFile(file);
	persistFiles();
	openEditorFile(file, { statusMessage: `Created ${file.name} from template.` });
}

async function loadTemplateSource(path) {
	const response = await fetch(path);
	if (!response.ok) {
		throw new Error("Template source could not be loaded.");
	}
	return response.text();
}

function insertPrimitiveIntoEditor(primitive) {
	const markup = buildPrimitiveMarkup(primitive);
	insertAtCursor(markup);
	setStatus(`Inserted <${primitive.name}>.`);
	focusEditorOnInsertedMarkup(markup);
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
		if (primitive.name === "rect" && (attribute === "rx" || attribute === "ry")) {
			input.setAttribute("aria-description", "For rounded corners");
		}
		wrapper.append(label, input);
		elements.shapeFieldContainer.appendChild(wrapper);
	});

	openDialog(elements.shapeDialog, elements.shapeDialogTitle);
}

function createFileRecord(name, viewBox, width, height, content = "", options = {}) {
	const safeName = sanitizeFilename(name || "untitled");
	const timestamp = new Date().toISOString();
	const fileContent = content || [
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
		sizePreset: options.sizePreset || "custom",
		updatedAt: timestamp,
		lastSavedAt: timestamp,
		content: fileContent
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
				attributes.push(`fill="${escapeXml(primitive.name === "text" ? value || "black" : value || "none")}"`);
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
		return `<text x="0" y="0" fill="black">Text</text>\n`;
	}

	return `<${primitive.name} />\n`;
}

function insertAtCursor(markup) {
	const editor = elements.svgEditor;
	const start = editor.selectionStart;
	const end = editor.selectionEnd;
	const current = editor.value;
	editor.value = current.slice(0, start) + markup + current.slice(end);
	const caretPosition = start + markup.length;
	editor.selectionStart = caretPosition;
	editor.selectionEnd = caretPosition;
	updateCurrentFileContent(editor.value);
}

function focusEditorOnInsertedMarkup(markup) {
	const editor = elements.svgEditor;
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
	editor.setSelectionRange(index, index);
	editor.scrollTop = (targetLine - 1) * 24;
	setStatus(`Moved to line ${targetLine}.`);
}

function updateWorkspaceMeta(file) {
	elements.currentFileHeading.textContent = file.name;
	elements.fileMeta.textContent = buildFileMetaText(file);
	elements.renameCurrentFileButton.textContent = `Rename ${file.name}`;
	elements.deleteCurrentFileButton.textContent = `Delete ${file.name}`;
	elements.revertButton.textContent = state.currentSessionSnapshotAt
		? `Revert Back to ${formatDate(state.currentSessionSnapshotAt)}`
		: "Revert File";
	if (elements.renderMeta) {
		elements.renderMeta.textContent = state.lastRenderedMarkup
			? `${file.name} rendered and ready for print or export.`
			: "Rendered output will appear here.";
	}
	updateDocumentTitle();
}

function buildFileMetaText(file) {
	if (!file) {
		return "No file open.";
	}

	const updatedText = `Updated ${formatDate(file.updatedAt)}`;
	const lastSavedText = file.lastSavedAt ? `Last Saved: ${formatTime(file.lastSavedAt)}` : "Last Saved: Not yet saved";
	return `${updatedText}. ${lastSavedText}`;
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
	}).format(date).replace(/\s/g, "").toLowerCase();
	return `${datePart}, ${timePart}`;
}

function formatTime(isoString) {
	return new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true
	}).format(new Date(isoString)).replace(/\s/g, "").toLowerCase();
}

function renderFileList() {
	state.files = loadFiles();
	elements.fileTableBody.replaceChildren();

	if (!state.files.length) {
		elements.fileLibrarySummary.textContent = "No saved files yet.";
		elements.fileTable.hidden = true;
		return;
	}

	elements.fileLibrarySummary.textContent = `${state.files.length} saved file${state.files.length === 1 ? "" : "s"} in this browser.`;
	elements.fileTable.hidden = false;
	const fragment = document.createDocumentFragment();

	state.files
		.slice()
		.sort((a, b) => new Date((b.lastSavedAt || b.updatedAt)) - new Date((a.lastSavedAt || a.updatedAt)))
		.forEach((file) => {
			const row = document.createElement("tr");
			row.dataset.fileId = file.id;

			const openButton = document.createElement("button");
			openButton.type = "button";
			openButton.id = `file-open-${file.id}`;
			openButton.textContent = `${file.name}, ${formatDate(file.lastSavedAt || file.updatedAt)}`;
			openButton.setAttribute("aria-description", "Opens file");
			openButton.addEventListener("click", () => openFile(file.id));

			const fileCell = document.createElement("td");
			fileCell.appendChild(openButton);

			const actionsCell = document.createElement("td");
			actionsCell.appendChild(buildSavedFileActions(file));
			row.append(fileCell, actionsCell);
			fragment.appendChild(row);
		});

	elements.fileTableBody.appendChild(fragment);

	if (state.pendingFileRowFocusId) {
		requestAnimationFrame(() => {
			const focusTarget = document.getElementById(state.pendingFileRowFocusId);
			if (focusTarget) {
				focusTarget.focus();
			}
			state.pendingFileRowFocusId = "";
		});
	}
}

function openFile(fileId) {
	finalizeCurrentSession({ save: true });
	const file = loadFiles().find((item) => item.id === fileId);
	if (!file) {
		return;
	}

	openEditorFile(file, { statusMessage: `Opened ${file.name}.` });
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
	state.files = files;
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

	const nextFiles = files.filter((item) => item.id !== fileId);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFiles));
	state.files = nextFiles;
	closeFileRowMenu();

	if (state.currentFileId === fileId) {
		window.clearTimeout(state.autosaveTimeoutId);
		state.currentFileId = "";
		state.currentSessionSnapshotContent = "";
		state.currentSessionSnapshotAt = "";
		elements.currentFileHeading.textContent = "Untitled";
		elements.fileMeta.textContent = "No file open.";
		elements.renameCurrentFileButton.textContent = "Rename File";
		elements.deleteCurrentFileButton.textContent = "Delete File";
		elements.revertButton.textContent = "Revert File";
		elements.svgEditor.value = "";
		resetRenderedOutput();
		setActiveView("home");
		focusActiveHeading(elements.homeHeading);
	}

	renderFileList();
	setStatus(`${file.name} deleted.`);
}

function confirmDeleteFile() {
	const fileId = state.pendingDeleteFileId;
	state.pendingDeleteFileId = "";
	closeDialog(elements.deleteDialog, { restoreFocus: false });
	deleteFile(fileId);
}

function saveCurrentFile(options = {}) {
	const {
		announce = true,
		showToastMessage = true,
		source = "manual"
	} = options;

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
	file.lastSavedAt = file.updatedAt;
	state.files = upsertFile(file);
	persistFiles();
	updateWorkspaceMeta(file);
	renderFileList();
	if (announce) {
		setStatus(`${file.name} saved to this browser.`);
		announceEditorChange(`${file.name} saved`);
	}
	if (showToastMessage) {
		showToast(`${file.name} saved`);
	}
	if (source === "manual" || source === "autosave") {
		scheduleAutosave();
	}
	return file;
}

function saveCurrentFileAs() {
	const currentFile = getCurrentFile();
	if (!currentFile) {
		return;
	}

	const nextName = window.prompt("Save file as", currentFile.name.replace(/\.svg$/i, ""));
	if (!nextName) {
		return;
	}

	const nextFile = createFileRecord(
		nextName,
		currentFile.viewBox,
		currentFile.width,
		currentFile.height,
		elements.svgEditor.value,
		{ sizePreset: currentFile.sizePreset || "custom" }
	);

	state.files = upsertFile(nextFile);
	persistFiles();
	openEditorFile(nextFile, { statusMessage: `Saved a new copy as ${nextFile.name}.` });
}

function revertCurrentFileToSessionStart() {
	const currentFile = getCurrentFile();
	if (!currentFile || !state.currentSessionSnapshotContent) {
		return;
	}

	elements.svgEditor.value = state.currentSessionSnapshotContent;
	resetRenderedOutput();
	clearMessages();
	window.clearTimeout(state.liveRenderTimeoutId);
	scheduleAutosave();
	if (elements.liveViewToggle.checked) {
		scheduleLiveRender();
	}
	setStatus(`Reverted ${currentFile.name} back to ${formatDate(state.currentSessionSnapshotAt)}.`);
	elements.svgEditor.focus();
	elements.svgEditor.setSelectionRange(0, 0);
	elements.svgEditor.scrollTop = 0;
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
		return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").map((file) => ({
			...file,
			sizePreset: file.sizePreset || "custom",
			lastSavedAt: file.lastSavedAt || file.updatedAt
		}));
	} catch (error) {
		return [];
	}
}

function updateCurrentFileContent(content) {
	void content;
	scheduleAutosave();
}

function openEditorFile(file, options = {}) {
	const {
		statusMessage = ""
	} = options;

	state.currentFileId = file.id;
	state.currentSessionSnapshotContent = file.content;
	state.currentSessionSnapshotAt = file.lastSavedAt || file.updatedAt;
	setActiveView("editor");
	elements.svgEditor.value = file.content;
	resetRenderedOutput();
	updateWorkspaceMeta(file);
	clearMessages();
	if (statusMessage) {
		setStatus(statusMessage);
	}
	focusActiveHeading(elements.currentFileHeading);
	window.clearTimeout(state.autosaveTimeoutId);
	if (elements.liveViewToggle.checked) {
		scheduleLiveRender();
	}
}

function hasUnsavedChanges() {
	const currentFile = getCurrentFile();
	if (!currentFile) {
		return false;
	}

	return elements.svgEditor.value !== currentFile.content;
}

function finalizeCurrentSession(options = {}) {
	const save = options.save !== false;
	if (!save || !state.currentFileId) {
		return;
	}

	saveCurrentFile({ announce: false, showToastMessage: false, source: "session" });
}

function handleBeforeUnload() {
	finalizeCurrentSession({ save: true });
}

function buildSavedFileActions(file) {
	const wrapper = document.createElement("div");
	wrapper.className = "saved-file-actions";
	wrapper.dataset.fileId = file.id;

	const trigger = document.createElement("button");
	trigger.type = "button";
	trigger.className = "saved-file-actions__button";
	trigger.id = `file-actions-trigger-${file.id}`;
	trigger.textContent = `${file.name} Actions`;
	trigger.setAttribute("aria-expanded", "false");
	trigger.setAttribute("aria-controls", `file-actions-menu-${file.id}`);
	trigger.addEventListener("click", () => toggleFileRowMenu(file.id));
	trigger.addEventListener("keydown", (event) => handleFileRowButtonKeydown(event, file.id));

	const menu = document.createElement("div");
	menu.id = `file-actions-menu-${file.id}`;
	menu.className = "saved-file-actions__menu";
	menu.hidden = true;
	menu.setAttribute("inert", "");
	menu.addEventListener("keydown", (event) => handleFileRowMenuKeydown(event, file.id));

	const list = document.createElement("ul");
	list.className = "saved-file-actions__list";
	list.setAttribute("role", "list");

	const renameButton = document.createElement("button");
	renameButton.type = "button";
	renameButton.textContent = "Rename";
	renameButton.addEventListener("click", () => {
		closeFileRowMenu();
		renameFile(file.id);
	});

	const duplicateButton = document.createElement("button");
	duplicateButton.type = "button";
	duplicateButton.textContent = "Duplicate";
	duplicateButton.addEventListener("click", () => {
		closeFileRowMenu();
		duplicateFile(file.id);
	});

	const deleteButton = document.createElement("button");
	deleteButton.type = "button";
	deleteButton.textContent = "Delete";
	deleteButton.setAttribute("aria-haspopup", "dialog");
	deleteButton.addEventListener("click", () => {
		closeFileRowMenu();
		openDeleteDialog(file.id, deleteButton);
	});

	[renameButton, duplicateButton, deleteButton].forEach((button) => {
		const item = document.createElement("li");
		item.appendChild(button);
		list.appendChild(item);
	});

	menu.appendChild(list);
	wrapper.append(trigger, menu);
	return wrapper;
}

function duplicateFile(fileId) {
	const file = loadFiles().find((item) => item.id === fileId);
	if (!file) {
		return;
	}

	const copyFile = createFileRecord(
		`${file.name.replace(/\.svg$/i, "")} copy`,
		file.viewBox,
		file.width,
		file.height,
		file.content,
		{ sizePreset: file.sizePreset || "custom" }
	);

	state.files = upsertFile(copyFile);
	persistFiles();
	state.pendingFileRowFocusId = `file-open-${copyFile.id}`;
	renderFileList();
	setStatus(`Created ${copyFile.name}.`);
}

function renderSvg(options = {}) {
	const {
		suppressErrors = false,
		announceSuccess = true,
		source: renderSource = "manual"
	} = options;
	const svgSource = elements.svgEditor.value.trim();
	if (!svgSource) {
		setStatus("Enter SVG code before rendering.");
		return;
	}

	const parser = new DOMParser();
	const doc = parser.parseFromString(svgSource, "image/svg+xml");
	const parserErrors = extractParserErrorsFromDocument(doc);
	if (parserErrors.length) {
		return handleRenderFailure(parserErrors, suppressErrors, renderSource);
	}

	const parserErrorNode = findParserErrorNode(doc);
	if (parserErrorNode) {
		return handleRenderFailure([], suppressErrors, renderSource);
	}

	const svg = doc.documentElement;
	if (!svg || svg.nodeName.toLowerCase() !== "svg") {
		return handleRenderFailure([
			{
				line: 1,
				column: 1,
				rawMessage: "The document must begin with a valid <svg> root element.",
				plainLanguage: "Make sure the file starts with an opening <svg> tag and that it is written correctly."
			}
		], suppressErrors, renderSource);
	}

	sanitizeSvg(svg);
	prepareRenderedSvg(svg);
	clearRenderErrors();
	clearInlineRenderErrors();
	updateRenderedOutput(svg);
	if (shouldPlayManualRenderSound(renderSource)) {
		playManualRenderSuccessSound();
	}
	if (announceSuccess && renderSource !== "live") {
		setStatus("SVG rendered.");
		if (renderSource === "manual") {
			announceEditorChange(`${elements.currentFileHeading.textContent} rendered in viewer`);
		}
	}
	return true;
}

function returnHome() {
	finalizeCurrentSession({ save: true });
	closeFullscreenGraphic({ restoreFocus: false });
	setActiveView("home");
	clearStatus();
	focusActiveHeading(elements.homeHeading);
}

function setActiveView(viewName) {
	const showFullscreen = viewName === "fullscreen";
	closeFileActionsMenu();
	closeFileRowMenu();
	moveFileActionsToHost(showFullscreen ? elements.fullscreenFileActionsHost : elements.editorFileActionsHost);
	document.body.classList.toggle("is-fullscreen-graphic", showFullscreen);
	syncRegion(elements.skipLink, !showFullscreen);
	syncRegion(elements.siteHeader, !showFullscreen);
	syncRegion(elements.mainContent, !showFullscreen);
	syncRegion(elements.siteFooter, !showFullscreen);
	syncRegion(elements.homeView, !showFullscreen && viewName === "home");
	syncRegion(elements.workspaceSection, !showFullscreen && viewName === "editor");
	syncRegion(elements.editorView, !showFullscreen && viewName === "editor");
	syncRegion(elements.fullscreenView, showFullscreen);
	updateDocumentTitle({ view: viewName });
}

function moveFileActionsToHost(host) {
	if (!host || !elements.fileActionsPopdown) {
		return;
	}

	closeFileActionsMenu();
	closeFileRowMenu();
	host.appendChild(elements.fileActionsPopdown);
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

function handleRenderFailure(errors, suppressErrors, renderSource) {
	if (shouldPlayManualRenderSound(renderSource)) {
		playManualRenderErrorSound();
	}

	if (suppressErrors) {
		presentInlineRenderErrors(errors);
		return false;
	}

	if (errors.length) {
		presentRenderErrors(errors);
		return false;
	}

	clearRenderErrors();
	setStatus("The SVG could not be rendered.");
	elements.svgEditor.focus();
	return false;
}

function updateRenderedOutput(svg) {
	const previewSvg = svg.cloneNode(true);
	const fullscreenSvg = svg.cloneNode(true);
	state.lastRenderedMarkup = previewSvg.outerHTML;
	if (elements.renderMeta) {
		elements.renderMeta.textContent = `${elements.currentFileHeading.textContent} rendered and ready for print or export.`;
	}
	elements.renderPreviewCanvas.replaceChildren(elements.renderPreviewCanvasHeading, previewSvg);
	elements.fullscreenRenderCanvas.replaceChildren(fullscreenSvg);
}

function resetRenderedOutput() {
	state.lastRenderedMarkup = "";
	if (elements.renderMeta) {
		elements.renderMeta.textContent = "Rendered output will appear here.";
	}
	clearInlineRenderErrors();
	elements.renderPreviewCanvas.replaceChildren(elements.renderPreviewCanvasHeading, elements.renderPreviewPlaceholder);
	elements.fullscreenRenderCanvas.replaceChildren(elements.fullscreenRenderPlaceholder);
}

function presentInlineRenderErrors(errors) {
	clearRenderErrors();
	elements.renderPreviewCanvas.replaceChildren(elements.renderPreviewCanvasHeading, elements.renderPreviewPlaceholder);
	elements.renderPreviewErrorList.replaceChildren();

	const fragment = document.createDocumentFragment();
	const errorItems = errors.length ? errors : [
		{
			line: 1,
			column: 1,
			rawMessage: "The browser found an SVG parsing error."
		}
	];

	errorItems.forEach((error) => {
		const item = document.createElement("li");
		item.textContent = formatErrorItem(error);
		fragment.appendChild(item);
	});

	elements.renderPreviewErrorList.appendChild(fragment);
	elements.renderPreviewErrorPanel.hidden = false;
}

function clearInlineRenderErrors() {
	elements.renderPreviewErrorList.replaceChildren();
	elements.renderPreviewErrorPanel.hidden = true;
}

function closeFileActionsMenu() {
	if (!isFileActionsMenuOpen()) {
		return;
	}

	elements.fileActionsMenu.hidden = true;
	elements.fileActionsMenu.setAttribute("inert", "");
	elements.fileActionsButton.setAttribute("aria-expanded", "false");
}

function openFileActionsMenu(focusMode = "first") {
	if (!isFileActionsMenuOpen()) {
		closeFileRowMenu();
		elements.fileActionsMenu.hidden = false;
		elements.fileActionsMenu.removeAttribute("inert");
		elements.fileActionsButton.setAttribute("aria-expanded", "true");
	}

	const items = getFileActionsMenuItems();
	if (!items.length) {
		return;
	}

	const target = focusMode === "last" ? items[items.length - 1] : items[0];
	requestAnimationFrame(() => {
		target.focus();
	});
}

function toggleFileActionsMenu() {
	if (isFileActionsMenuOpen()) {
		closeFileActionsMenu();
		return;
	}

	openFileActionsMenu("first");
}

function getFileActionsMenuItems() {
	return [...elements.fileActionsMenu.querySelectorAll("button")];
}

function isFileActionsMenuOpen() {
	return !elements.fileActionsMenu.hidden;
}

function handleFileActionsButtonClick() {
	toggleFileActionsMenu();
}

function handleFileActionsButtonKeydown(event) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		toggleFileActionsMenu();
		return;
	}

	if (event.key === "ArrowDown") {
		event.preventDefault();
		openFileActionsMenu("first");
		return;
	}

	if (event.key === "ArrowUp") {
		event.preventDefault();
		openFileActionsMenu("last");
	}
}

function handleFileActionsMenuKeydown(event) {
	const items = getFileActionsMenuItems();
	const currentIndex = items.indexOf(document.activeElement);
	if (!items.length) {
		return;
	}

	if (event.key === "Escape") {
		event.preventDefault();
		closeFileActionsMenu();
		elements.fileActionsButton.focus();
		return;
	}

	if (event.key === "ArrowDown") {
		event.preventDefault();
		items[(currentIndex + 1 + items.length) % items.length].focus();
		return;
	}

	if (event.key === "ArrowUp") {
		event.preventDefault();
		items[(currentIndex - 1 + items.length) % items.length].focus();
		return;
	}

	if (event.key === "Home") {
		event.preventDefault();
		items[0].focus();
		return;
	}

	if (event.key === "End") {
		event.preventDefault();
		items[items.length - 1].focus();
	}
}

function handleDocumentPointerDown(event) {
	if (!isFileActionsMenuOpen()) {
		closeFileRowMenuIfOutside(event);
		return;
	}

	if (elements.fileActionsPopdown && elements.fileActionsPopdown.contains(event.target)) {
		closeFileRowMenuIfOutside(event);
		return;
	}

	closeFileActionsMenu();
	closeFileRowMenuIfOutside(event);
}

function closeFileRowMenu() {
	if (!state.openFileRowMenuId) {
		return;
	}

	const trigger = document.getElementById(`file-actions-trigger-${state.openFileRowMenuId}`);
	const menu = document.getElementById(`file-actions-menu-${state.openFileRowMenuId}`);
	if (menu) {
		menu.hidden = true;
		menu.setAttribute("inert", "");
	}
	if (trigger) {
		trigger.setAttribute("aria-expanded", "false");
	}
	state.openFileRowMenuId = "";
}

function openFileRowMenu(fileId, focusMode = "first") {
	if (state.openFileRowMenuId && state.openFileRowMenuId !== fileId) {
		closeFileRowMenu();
	}

	const trigger = document.getElementById(`file-actions-trigger-${fileId}`);
	const menu = document.getElementById(`file-actions-menu-${fileId}`);
	if (!trigger || !menu) {
		return;
	}

	menu.hidden = false;
	menu.removeAttribute("inert");
	trigger.setAttribute("aria-expanded", "true");
	state.openFileRowMenuId = fileId;

	const items = getFileRowMenuItems(fileId);
	if (!items.length) {
		return;
	}

	const target = focusMode === "last" ? items[items.length - 1] : items[0];
	requestAnimationFrame(() => {
		target.focus();
	});
}

function toggleFileRowMenu(fileId) {
	if (state.openFileRowMenuId === fileId) {
		closeFileRowMenu();
		return;
	}

	openFileRowMenu(fileId);
}

function getFileRowMenuItems(fileId) {
	const menu = document.getElementById(`file-actions-menu-${fileId}`);
	if (!menu) {
		return [];
	}

	return [...menu.querySelectorAll("button")];
}

function handleFileRowButtonKeydown(event, fileId) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		toggleFileRowMenu(fileId);
		return;
	}

	if (event.key === "ArrowDown") {
		event.preventDefault();
		openFileRowMenu(fileId, "first");
		return;
	}

	if (event.key === "ArrowUp") {
		event.preventDefault();
		openFileRowMenu(fileId, "last");
	}
}

function handleFileRowMenuKeydown(event, fileId) {
	const items = getFileRowMenuItems(fileId);
	const currentIndex = items.indexOf(document.activeElement);
	if (!items.length) {
		return;
	}

	if (event.key === "Escape") {
		event.preventDefault();
		closeFileRowMenu();
		const trigger = document.getElementById(`file-actions-trigger-${fileId}`);
		if (trigger) {
			trigger.focus();
		}
		return;
	}

	if (event.key === "ArrowDown") {
		event.preventDefault();
		items[(currentIndex + 1 + items.length) % items.length].focus();
		return;
	}

	if (event.key === "ArrowUp") {
		event.preventDefault();
		items[(currentIndex - 1 + items.length) % items.length].focus();
		return;
	}

	if (event.key === "Home") {
		event.preventDefault();
		items[0].focus();
		return;
	}

	if (event.key === "End") {
		event.preventDefault();
		items[items.length - 1].focus();
	}
}

function closeFileRowMenuIfOutside(event) {
	if (!state.openFileRowMenuId) {
		return;
	}

	const wrapper = document.querySelector(`.saved-file-actions[data-file-id="${state.openFileRowMenuId}"]`);
	if (wrapper && wrapper.contains(event.target)) {
		return;
	}

	closeFileRowMenu();
}

function shouldPlayManualRenderSound(renderSource) {
	return state.settings.renderSound && renderSource === "manual" && !elements.liveViewToggle.checked;
}

function ensureAudioContext() {
	const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
	if (!AudioContextConstructor) {
		return null;
	}

	if (!state.audioContext) {
		state.audioContext = new AudioContextConstructor();
	}

	const context = state.audioContext;
	if (context.state === "suspended") {
		context.resume().catch(() => {});
	}

	return context;
}

function playManualRenderSuccessSound() {
	const context = ensureAudioContext();
	if (!context) {
		return;
	}

	const now = context.currentTime;
	const masterGain = context.createGain();
	const filter = context.createBiquadFilter();
	const chordFrequencies = [293.66, 369.99, 440];
	const duration = 0.48;

	filter.type = "lowpass";
	filter.frequency.setValueAtTime(1600, now);
	filter.Q.setValueAtTime(0.8, now);
	masterGain.gain.setValueAtTime(0.0001, now);
	masterGain.gain.linearRampToValueAtTime(0.032, now + 0.08);
	masterGain.gain.linearRampToValueAtTime(0.016, now + 0.22);
	masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
	filter.connect(masterGain);
	masterGain.connect(context.destination);

	chordFrequencies.forEach((frequency, index) => {
		const oscillator = context.createOscillator();
		const voiceGain = context.createGain();
		oscillator.type = index === 0 ? "triangle" : "sine";
		oscillator.frequency.setValueAtTime(frequency, now);
		voiceGain.gain.setValueAtTime(index === 0 ? 0.95 : 0.62, now);
		oscillator.connect(voiceGain);
		voiceGain.connect(filter);
		oscillator.start(now);
		oscillator.stop(now + duration);
	});
}

function playManualRenderErrorSound() {
	const context = ensureAudioContext();
	if (!context) {
		return;
	}

	const now = context.currentTime;
	const masterGain = context.createGain();
	const duration = 0.34;

	masterGain.gain.setValueAtTime(0.0001, now);
	masterGain.gain.linearRampToValueAtTime(0.028, now + 0.04);
	masterGain.gain.linearRampToValueAtTime(0.016, now + 0.12);
	masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
	masterGain.connect(context.destination);

	const oscillator = context.createOscillator();
	oscillator.type = "sawtooth";
	oscillator.frequency.setValueAtTime(220, now);
	oscillator.frequency.exponentialRampToValueAtTime(164.81, now + duration);
	oscillator.connect(masterGain);
	oscillator.start(now);
	oscillator.stop(now + duration);
}

function openFullscreenGraphic() {
	const rendered = renderSvg({ suppressErrors: true, announceSuccess: false, source: "fullscreen" });
	if (!rendered && !state.lastRenderedMarkup) {
		return;
	}

	state.lastFocusedTrigger = elements.openFullscreenButton;
	setActiveView("fullscreen");
	focusActiveHeading(elements.fullscreenGraphicHeading);
}

function closeFullscreenGraphic(options = {}) {
	if (elements.fullscreenView.hidden) {
		return;
	}

	setActiveView("editor");
	if (options.restoreFocus === false) {
		return;
	}
	requestAnimationFrame(() => {
		if (state.lastFocusedTrigger && typeof state.lastFocusedTrigger.focus === "function") {
			state.lastFocusedTrigger.focus();
			return;
		}
		elements.openFullscreenButton.focus();
	});
}

function printRenderedSvg() {
	const rendered = renderSvg({ suppressErrors: false, announceSuccess: false, source: "print" });
	if (!rendered) {
		return;
	}

	printSvgDocument(elements.svgEditor.value.trim());
}

function printSvgDocument(source) {
	const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const iframe = document.createElement("iframe");
	let cleanupTimeout = 0;
	let hasRestoredFocus = false;

	function cleanup() {
		window.clearTimeout(cleanupTimeout);
		URL.revokeObjectURL(url);
		iframe.remove();
		if (!hasRestoredFocus) {
			hasRestoredFocus = true;
			requestAnimationFrame(() => {
				elements.fileActionsButton.focus();
			});
		}
	}

	iframe.title = "SVG print document";
	iframe.style.position = "fixed";
	iframe.style.right = "0";
	iframe.style.bottom = "0";
	iframe.style.width = "0";
	iframe.style.height = "0";
	iframe.style.border = "0";
	iframe.onload = () => {
		const printWindow = iframe.contentWindow;
		if (!printWindow) {
			cleanup();
			return;
		}

		printWindow.addEventListener("afterprint", cleanup, { once: true });
		cleanupTimeout = window.setTimeout(cleanup, 60000);
		requestAnimationFrame(() => {
			printWindow.focus();
			printWindow.print();
		});
	};

	iframe.src = url;
	document.body.appendChild(iframe);
}

async function exportRaster() {
	const source = elements.svgEditor.value.trim();
	if (!source) {
		throw new Error("There is no SVG code to export.");
	}

	if (!validateExportForm()) {
		throw new Error("Please correct the export settings and try again.");
	}

	const width = Number(elements.exportWidthInput.value);
	const height = Number(elements.exportHeightInput.value);
	const type = elements.exportTypeInput.value;
	const dpi = Number(elements.exportDpiInput.value);
	const units = elements.exportUnitsInput.value;
	const pixelSize = convertExportDimensionsToPixels(width, height, units, dpi);
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(pixelSize.width));
	canvas.height = Math.max(1, Math.round(pixelSize.height));
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

	const finalBlob = type === "image/png" ? await writePngDpiMetadata(blob, dpi) : blob;

	const extension = mimeToExtension(type);
	const filename = elements.currentFileHeading.textContent.replace(/\.svg$/i, "") || "drawing";
	triggerDownload(finalBlob, `${filename}.${extension}`);
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
	state.exportBaseWidthPx = width;
	state.exportBaseHeightPx = height;
	state.exportSyncSource = "";
	elements.exportUnitsInput.value = "px";
	elements.exportTypeInput.value = "image/png";
	elements.scaleProportionatelyInput.checked = true;
	setExportInputStep("px");
	elements.exportWidthInput.value = width;
	elements.exportHeightInput.value = height;
	state.exportSyncSource = "px";
	updateExportLabels();
	validateExportInputs();
}

function numericAttribute(value) {
	if (!value) {
		return null;
	}

	const match = String(value).match(/[\d.]+/);
	return match ? Number(match[0]) : null;
}

function syncExportUnits() {
	const nextUnits = elements.exportUnitsInput.value;
	const width = Number(elements.exportWidthInput.value);
	const height = Number(elements.exportHeightInput.value);
	const dpi = Number(elements.exportDpiInput.value) || 96;
	const currentUnits = state.exportSyncSource || "px";
	const pixelSize = convertExportDimensionsToPixels(width, height, currentUnits, dpi);
	const convertedSize = convertPixelsToExportDimensions(pixelSize.width, pixelSize.height, nextUnits, dpi);
	setExportInputStep(nextUnits);
	elements.exportWidthInput.value = formatExportNumber(convertedSize.width);
	elements.exportHeightInput.value = formatExportNumber(convertedSize.height);
	state.exportSyncSource = nextUnits;
	updateExportLabels();
	validateExportInputs();
}

function syncExportDimensionPair(changedDimension) {
	if (!elements.scaleProportionatelyInput.checked) {
		state.exportSyncSource = elements.exportUnitsInput.value;
		validateExportInputs();
		return;
	}

	const ratio = state.exportBaseWidthPx / state.exportBaseHeightPx || 1;
	const width = Number(elements.exportWidthInput.value);
	const height = Number(elements.exportHeightInput.value);

	if (changedDimension === "width" && Number.isFinite(width) && width > 0) {
		elements.exportHeightInput.value = formatExportNumber(width / ratio);
	}

	if (changedDimension === "height" && Number.isFinite(height) && height > 0) {
		elements.exportWidthInput.value = formatExportNumber(height * ratio);
	}

	state.exportSyncSource = elements.exportUnitsInput.value;
	validateExportInputs();
}

function convertExportDimensionsToPixels(width, height, units, dpi) {
	switch (units) {
		case "in":
			return { width: width * dpi, height: height * dpi };
		case "cm":
			return { width: (width / 2.54) * dpi, height: (height / 2.54) * dpi };
		case "mm":
			return { width: (width / 25.4) * dpi, height: (height / 25.4) * dpi };
		case "pt":
			return { width: (width / 72) * dpi, height: (height / 72) * dpi };
		case "percent":
			return {
				width: state.exportBaseWidthPx * (width / 100),
				height: state.exportBaseHeightPx * (height / 100)
			};
		default:
			return { width, height };
	}
}

function convertPixelsToExportDimensions(width, height, units, dpi) {
	switch (units) {
		case "in":
			return { width: width / dpi, height: height / dpi };
		case "cm":
			return { width: (width / dpi) * 2.54, height: (height / dpi) * 2.54 };
		case "mm":
			return { width: (width / dpi) * 25.4, height: (height / dpi) * 25.4 };
		case "pt":
			return { width: (width / dpi) * 72, height: (height / dpi) * 72 };
		case "percent":
			return {
				width: (width / state.exportBaseWidthPx) * 100,
				height: (height / state.exportBaseHeightPx) * 100
			};
		default:
			return { width, height };
	}
}

function setExportInputStep(units) {
	const step = "0.01";
	const min = "0.01";
	elements.exportWidthInput.step = step;
	elements.exportHeightInput.step = step;
	elements.exportWidthInput.min = min;
	elements.exportHeightInput.min = min;
}

function formatExportNumber(value) {
	if (!Number.isFinite(value)) {
		return "";
	}

	if (Math.abs(value - Math.round(value)) < 0.001) {
		return String(Math.round(value));
	}

	return String(Number(value.toFixed(2)));
}

function validateExportInputs() {
	validateExportDimensionInput(elements.exportWidthInput, "width");
	validateExportDimensionInput(elements.exportHeightInput, "height");
	validateExportDpiInput();
}

function validateExportForm() {
	const widthValid = validateExportDimensionInput(elements.exportWidthInput, "width");
	const heightValid = validateExportDimensionInput(elements.exportHeightInput, "height");
	const dpiValid = validateExportDpiInput();
	const firstInvalid = [elements.exportWidthInput, elements.exportHeightInput, elements.exportDpiInput].find((input) => !input.checkValidity());

	if (firstInvalid) {
		firstInvalid.reportValidity();
		firstInvalid.focus();
	}

	return widthValid && heightValid && dpiValid;
}

function updateExportLabels() {
	const unitText = describeExportUnitLabel(elements.exportUnitsInput.value);
	elements.exportWidthLabel.textContent = `Width in ${unitText}`;
	elements.exportHeightLabel.textContent = `Height in ${unitText}`;
}

function validateExportDimensionInput(input, dimensionName) {
	input.setCustomValidity("");

	if (!input.value.trim()) {
		input.setCustomValidity(`Please provide an output ${dimensionName}.`);
		return false;
	}

	const value = Number(input.value);
	if (!Number.isFinite(value)) {
		input.setCustomValidity(`Please provide a valid output ${dimensionName}.`);
		return false;
	}

	if (value <= 0) {
		input.setCustomValidity(`Output ${dimensionName} must be greater than 0 ${describeExportUnit(elements.exportUnitsInput.value, value)}.`);
		return false;
	}

	return true;
}

function validateExportDpiInput() {
	elements.exportDpiInput.setCustomValidity("");

	if (!elements.exportDpiInput.value.trim()) {
		elements.exportDpiInput.setCustomValidity("Please provide a DPI value.");
		return false;
	}

	const dpi = Number(elements.exportDpiInput.value);
	if (!Number.isFinite(dpi) || dpi <= 0) {
		elements.exportDpiInput.setCustomValidity("DPI must be greater than 0.");
		return false;
	}

	return true;
}

function describeExportUnit(units, value) {
	const singular = Math.abs(value - 1) < 0.001;

	switch (units) {
		case "in":
			return singular ? "inch" : "inches";
		case "cm":
			return singular ? "centimeter" : "centimeters";
		case "mm":
			return singular ? "millimeter" : "millimeters";
		case "pt":
			return singular ? "point" : "points";
		case "percent":
			return singular ? "percent" : "percent";
		default:
			return singular ? "pixel" : "pixels";
	}
}

function describeExportUnitLabel(units) {
	switch (units) {
		case "in":
			return "Inches";
		case "cm":
			return "Centimeters";
		case "mm":
			return "Millimeters";
		case "pt":
			return "Points";
		case "percent":
			return "Percent";
		default:
			return "Pixels";
	}
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

function prepareRenderedSvg(svg) {
	svg.setAttribute("tabindex", "0");
	if (!svg.hasAttribute("focusable")) {
		svg.setAttribute("focusable", "true");
	}
}

async function writePngDpiMetadata(blob, dpi) {
	const sourceBytes = new Uint8Array(await blob.arrayBuffer());
	const pixelsPerMeter = Math.round(dpi * 39.3701);
	const physChunkData = new Uint8Array(9);
	writeUint32(physChunkData, 0, pixelsPerMeter);
	writeUint32(physChunkData, 4, pixelsPerMeter);
	physChunkData[8] = 1;
	const physChunk = createPngChunk("pHYs", physChunkData);

	const chunks = [];
	let offset = 8;
	let inserted = false;

	while (offset < sourceBytes.length) {
		const length = readUint32(sourceBytes, offset);
		const chunkEnd = offset + 12 + length;
		const type = readChunkType(sourceBytes, offset + 4);

		if (type !== "pHYs") {
			chunks.push(sourceBytes.slice(offset, chunkEnd));
		}

		if (!inserted && type === "IHDR") {
			chunks.push(physChunk);
			inserted = true;
		}

		offset = chunkEnd;
	}

	const finalLength = 8 + chunks.reduce((total, chunk) => total + chunk.length, 0);
	const finalBytes = new Uint8Array(finalLength);
	finalBytes.set(sourceBytes.slice(0, 8), 0);
	let writeOffset = 8;

	chunks.forEach((chunk) => {
		finalBytes.set(chunk, writeOffset);
		writeOffset += chunk.length;
	});

	return new Blob([finalBytes], { type: "image/png" });
}

function createPngChunk(type, data) {
	const chunk = new Uint8Array(data.length + 12);
	writeUint32(chunk, 0, data.length);
	chunk.set([
		type.charCodeAt(0),
		type.charCodeAt(1),
		type.charCodeAt(2),
		type.charCodeAt(3)
	], 4);
	chunk.set(data, 8);
	const checksumSource = new Uint8Array(4 + data.length);
	checksumSource.set(chunk.slice(4, 8), 0);
	checksumSource.set(data, 4);
	writeUint32(chunk, data.length + 8, crc32(checksumSource));
	return chunk;
}

function readChunkType(bytes, offset) {
	return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

function readUint32(bytes, offset) {
	return ((bytes[offset] << 24) >>> 0)
		+ ((bytes[offset + 1] << 16) >>> 0)
		+ ((bytes[offset + 2] << 8) >>> 0)
		+ (bytes[offset + 3] >>> 0);
}

function writeUint32(bytes, offset, value) {
	bytes[offset] = (value >>> 24) & 255;
	bytes[offset + 1] = (value >>> 16) & 255;
	bytes[offset + 2] = (value >>> 8) & 255;
	bytes[offset + 3] = value & 255;
}

function crc32(bytes) {
	let crc = 0xffffffff;

	for (let index = 0; index < bytes.length; index += 1) {
		crc ^= bytes[index];
		for (let bit = 0; bit < 8; bit += 1) {
			crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
		}
	}

	return (crc ^ 0xffffffff) >>> 0;
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
				quickAdd: { ...defaultShortcuts.quickAdd },
				indent: { ...defaultShortcuts.indent },
				outdent: { ...defaultShortcuts.outdent }
			};
		}

		return {
			jumpToLine: {
				...defaultShortcuts.jumpToLine,
				...(savedShortcuts.jumpToLine || {})
			},
			quickAdd: {
				...defaultShortcuts.quickAdd,
				...(savedShortcuts.quickAdd || {})
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

function loadSettings() {
	try {
		const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
		return {
			renderDelay: normalizeRenderDelay(savedSettings.renderDelay),
			renderSound: Boolean(savedSettings.renderSound),
			autosave: "autosave" in savedSettings ? Boolean(savedSettings.autosave) : defaultSettings.autosave,
			autosaveMinutes: normalizeAutosaveMinutes(savedSettings.autosaveMinutes)
		};
	} catch (error) {
		return { ...defaultSettings };
	}
}

function persistSettings() {
	localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function normalizeRenderDelay(value) {
	const numericValue = Number(value);
	if (!Number.isFinite(numericValue)) {
		return defaultSettings.renderDelay;
	}
	return Math.min(3, Math.max(0.1, Number(numericValue.toFixed(1))));
}

function normalizeAutosaveMinutes(value) {
	const numericValue = Number(value);
	if (!Number.isFinite(numericValue)) {
		return AUTOSAVE_MINUTES_DEFAULT;
	}
	return Math.min(30, Math.max(1, Math.round(numericValue)));
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
		quickAdd: { ...shortcuts.quickAdd },
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

	if (activeView === "fullscreen" && currentFile) {
		document.title = `${filename} Full Screen View - ${BASE_TITLE}`;
		return;
	}

	if (activeView === "editor" && currentFile) {
		document.title = `${filename} Editor - ${BASE_TITLE}`;
		return;
	}

	document.title = BASE_TITLE;
}

function getActiveView() {
	if (!elements.fullscreenView.hidden) {
		return "fullscreen";
	}

	if (!elements.editorView.hidden) {
		return "editor";
	}

	return "home";
}

function getOpenDialogId() {
	const dialogs = [
		elements.newFileDialog,
		elements.templateDialog,
		elements.shapeDialog,
		elements.jumpDialog,
		elements.shortcutsDialog,
		elements.exportDialog,
		elements.errorDialog,
		elements.deleteDialog,
		elements.quickAddDialog
	];
	const openDialog = dialogs.find((dialog) => dialog.open);
	return openDialog ? openDialog.id : "";
}

function getCurrentFile() {
	return loadFiles().find((item) => item.id === state.currentFileId) || null;
}

function focusActiveHeading(heading) {
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			window.setTimeout(() => {
				heading.setAttribute("tabindex", "-1");
				heading.focus();
			}, 30);
		});
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
	window.clearTimeout(state.editorAnnouncementTimeoutId);
	elements.editorAnnouncer.textContent = "";
	window.setTimeout(() => {
		elements.editorAnnouncer.textContent = "";
		window.setTimeout(() => {
			elements.editorAnnouncer.textContent = message;
			state.editorAnnouncementTimeoutId = window.setTimeout(() => {
				elements.editorAnnouncer.textContent = "";
			}, MESSAGE_TIMEOUT_MS);
		}, 40);
	}, 10);
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

function setStatus(message, options = {}) {
	setTimedMessage(elements.statusMessage, message, options);
}

function clearStatus() {
	clearTimedMessage(elements.statusMessage);
}

function showToast(message) {
	window.clearTimeout(state.toastTimeoutId);
	window.clearTimeout(state.toastFadeTimeoutId);
	elements.toast.textContent = message;
	elements.toast.hidden = false;
	elements.toast.classList.remove("is-fading");
	requestAnimationFrame(() => {
		elements.toast.classList.add("is-visible");
	});

	state.toastTimeoutId = window.setTimeout(() => {
		elements.toast.classList.remove("is-visible");
		elements.toast.classList.add("is-fading");
		state.toastFadeTimeoutId = window.setTimeout(() => {
			elements.toast.hidden = true;
			elements.toast.textContent = "";
			elements.toast.classList.remove("is-fading");
		}, MESSAGE_FADE_MS);
	}, MESSAGE_TIMEOUT_MS);
}

function setBrailleConverterStatus(message, options = {}) {
	setTimedMessage(elements.brailleConverterStatus, message, options);
}

function clearTimedMessage(element) {
	window.clearTimeout(messageTimeouts.get(element) || 0);
	window.clearTimeout(messageFadeTimeouts.get(element) || 0);
	messageTimeouts.delete(element);
	messageFadeTimeouts.delete(element);
	element.classList.remove("is-visible", "is-fading");
	element.textContent = "";
}

function setTimedMessage(element, message, options = {}) {
	const persist = Boolean(options.persist);
	clearTimedMessage(element);

	if (!message) {
		return;
	}

	element.textContent = message;
	requestAnimationFrame(() => {
		element.classList.add("is-visible");
	});

	if (persist) {
		return;
	}

	messageTimeouts.set(element, window.setTimeout(() => {
		element.classList.remove("is-visible");
		element.classList.add("is-fading");
		messageFadeTimeouts.set(element, window.setTimeout(() => {
			clearTimedMessage(element);
		}, MESSAGE_FADE_MS));
	}, MESSAGE_TIMEOUT_MS));
}

function updateBrailleConversion() {
	if (!state.brailleConverterReady || !state.brailleApi) {
		return;
	}

	const sourceText = elements.brailleSourceInput.value;
	if (!sourceText.trim()) {
		elements.brailleOutput.value = "";
		setBrailleConverterStatus("Enter text before converting to braille Unicode.");
		return;
	}

	setBrailleConverterStatus("Converting to braille Unicode.");
	translateToBraille(sourceText, elements.brailleGradeSelect.value).then((braille) => {
		elements.brailleOutput.value = braille;
		setBrailleConverterStatus(`${describeBrailleGrade(elements.brailleGradeSelect.value)} braille ready to copy.`);
	}).catch((error) => {
		elements.brailleOutput.value = "";
		setBrailleConverterStatus(error.message || "Braille conversion could not be completed.");
	});
}

function translateToBraille(sourceText, grade) {
	const table = BRAILLE_TABLES[grade];
	if (!table) {
		return Promise.reject(new Error("Choose a braille output grade."));
	}

	return new Promise((resolve, reject) => {
		try {
			state.brailleApi.translateString(table, sourceText, (result) => {
				if (typeof result !== "string") {
					reject(new Error("Braille conversion could not be completed."));
					return;
				}
				resolve(result);
			});
		} catch (error) {
			reject(new Error("Braille conversion could not be completed."));
		}
	});
}

function describeBrailleGrade(grade) {
	switch (grade) {
		case "grade2":
			return "Grade 2 UEB";
		case "usGrade1":
			return "U.S. Grade 1";
		case "usGrade2":
			return "U.S. Grade 2";
		case "britishGrade1":
			return "British Grade 1";
		case "britishGrade2":
			return "British Grade 2";
		case "usMath":
			return "U.S. Math";
		default:
			return "Grade 1 UEB";
	}
}

function clearBrailleConverter() {
	elements.brailleSourceInput.value = "";
	elements.brailleOutput.value = "";
	setBrailleConverterStatus("");
	elements.brailleSourceInput.focus();
}

async function copyBrailleOutput() {
	if (!elements.brailleOutput.value) {
		setBrailleConverterStatus("There is no braille Unicode to copy yet.");
		return;
	}

	try {
		if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
			await navigator.clipboard.writeText(elements.brailleOutput.value);
		} else {
			elements.brailleOutput.focus();
			elements.brailleOutput.select();
			document.execCommand("copy");
		}
		setBrailleConverterStatus("Braille Unicode copied.");
		showToast("Braille Unicode copied.");
	} catch (error) {
		setBrailleConverterStatus("Braille Unicode could not be copied.");
	}
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
	const normalized = rawMessage
		.replace(/\r/g, "")
		.replace(/(This page contains the following errors:)\s*(error on line|from line|Below is a rendering)/gi, "$1\n$2")
		.replace(/(error on line\s+\d+\s+at column\s+\d+:)\s*(.+?)\s*(Below is a rendering)/gi, "$1 $2\n$3")
		.replace(/(from line\s+\d+,\s*column\s+\d+(?:\s+to\s+line\s+\d+,\s*column\s+\d+)?;?)\s*(.+?)\s*(Below is a rendering)/gi, "$1 $2\n$3")
		.replace(/(error on line\s+\d+\s+at column\s+\d+:)/gi, "\n$1")
		.replace(/(from line\s+\d+,\s*column\s+\d+(?:\s+to\s+line\s+\d+,\s*column\s+\d+)?;?)/gi, "\n$1")
		.replace(/(Below is a rendering of the page up to the first error\.)/gi, "\n$1");
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

function findParserErrorNode(doc) {
	if (!doc) {
		return null;
	}

	return doc.querySelector("parsererror")
		|| doc.getElementsByTagName("parsererror")[0]
		|| (doc.documentElement && /parsererror/i.test(doc.documentElement.nodeName) ? doc.documentElement : null);
}

function extractParserErrorsFromDocument(doc) {
	const parserErrorNode = findParserErrorNode(doc);
	if (!parserErrorNode) {
		return [];
	}

	const rawMessage = [
		parserErrorNode.textContent || "",
		parserErrorNode.innerText || ""
	]
		.join("\n")
		.trim();

	return parseSvgErrors(rawMessage);
}

function presentRenderErrors(errors) {
	if (!errors.length) {
		clearRenderErrors();
		setStatus("The SVG could not be rendered.");
		elements.svgEditor.focus();
		return;
	}

	state.currentErrors = errors;
	setActiveView("editor");
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
