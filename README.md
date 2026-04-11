# shapeCrafter Web

shapeCrafter Web is a browser-based SVG editor for BlindSVG. It is designed for blind and low-vision people who want to learn, write, test, save, and print hand-coded SVG graphics directly in the browser.

## What It Does

shapeCrafter Web gives you a simple writing and rendering workflow:

- Start a new SVG file with a filename, viewBox, width, and height
- Generate the opening SVG structure automatically, including a title tag
- Write SVG code in a full textarea editor
- Insert SVG primitives at the current cursor position
- Choose whether primitive insertion happens immediately or through an attribute prompt
- Render the SVG in the browser without leaving the page
- Print only the graphic from the render view
- Save files in browser local storage
- Download SVG files directly to your computer
- Export raster versions of the current SVG as PNG, JPG, or WEBP
- Jump to a specific line in the editor
- Remap the Jump to Line keyboard shortcut

## Who It Is For

shapeCrafter Web is meant for people actively learning from BlindSVG and building graphics as they go. It favors readable structure, keyboard operation, and native HTML controls so the editor stays usable with screen readers and other assistive technology.

## How To Use It

1. Choose New File.
2. Enter a filename, viewBox, width, and height.
3. Write SVG code in the editor or add shapes from the primitive menu.
4. Save your work to local storage whenever you want to keep a version in the browser.
5. Choose Render SVG to switch to the output view.
6. From the render view, return to code, print, save the SVG, or export a raster image.

## Accessibility Goals

shapeCrafter Web is being built with these priorities:

- WCAG 2.2 AA conformance
- true HTML5 structure
- keyboard-first operation
- blind-first interaction design
- native controls before custom patterns
- minimal ARIA, only where a native solution is not enough

## Current Features In This First Pass

- Single-page editor and render workflow
- New file dialog with starter SVG generation
- Primitive insertion menu
- Optional shape attribute dialog
- Local file library stored in the browser
- Direct SVG download
- Raster export modal
- Print stylesheet for SVG-only output
- Editable Jump to Line shortcut

## Where This Is Going

shapeCrafter Web is the starting point for a larger BlindSVG creation environment. Planned work includes broader SVG helpers, more detailed parser guidance, richer export options, and deeper authoring support for tactile graphics workflows.
