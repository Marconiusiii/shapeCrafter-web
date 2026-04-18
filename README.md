# shapeCrafter Web

shapeCrafter Web is a browser-based SVG editor for BlindSVG. It is built for people who want to learn, write, test, save, export, and print hand-coded SVG graphics directly in the browser without leaving the page.

## What shapeCrafter Web Does

shapeCrafter Web gives you a complete browser workflow for working with SVG:

- Start a new file with a filename, viewBox, width, and height
- Generate the opening SVG structure automatically, including a title tag
- Write SVG code in a full text editor
- Insert SVG elements at the current cursor position
- Use Quick Add to choose an SVG element from the keyboard without leaving the editor flow
- Choose whether shape insertion happens instantly or through an attribute prompt
- Render the SVG in the browser
- Print or emboss only the SVG graphic from the print view
- Save files to this browser and reopen them later
- Rename or delete saved files
- Download SVG files directly to your computer
- Export raster files as PNG, JPG, or WEBP
- Choose raster export units in pixels, inches, centimeters, millimeters, points, or percent
- Scale raster exports proportionately
- Jump to a specific line in the editor
- Remap editor shortcuts for Jump to Line, Quick Add, Tab Indent, and Tab Outdent

## Who It Is For

shapeCrafter Web is designed for people actively learning from BlindSVG and building graphics as they go. It favors readable structure, keyboard use, screen reader support, and native HTML controls so the editor stays practical and dependable.

## How To Use It

1. Choose New File.
2. Enter a filename, viewBox, width, and height.
3. Write SVG code in the editor or insert shapes from the SVG Element Menu.
4. Save your work to the browser whenever you want to keep it.
5. Use Render SVG to switch to the rendered image.
6. From the print view, return to code, print or emboss the graphic, save the SVG, or export a raster file.

## Current Features

- Single-page editor and render workflow
- New file dialog with starter SVG generation
- SVG Element Menu for quick shape insertion
- Quick Add dialog opened by keyboard shortcut
- Optional shape attribute dialog for guided insertion
- Saved Files table with open, rename, and delete actions
- SVG Code Reference with element, styling, transform, gradient, advanced, and font guidance
- Fonts Reference with browser-safe font suggestions and braille font downloads
- Parser error reporting with line-aware feedback and Jump to Error
- Customizable keyboard shortcuts
- Visible save toast and screen reader save announcement
- Light mode and system dark mode support
- Print-only SVG output for embossing and tactile workflows
- Raster export with output units, DPI, and proportional scaling
- Custom File Actions action panel chosen over native HTML Popover because VoiceOver support on macOS and iOS was not reliable enough for this project

## SVG Reference Help Included In The Editor

The built-in SVG Code Reference includes help for:

- Rectangle, circle, ellipse, line, polyline, polygon, path, and text elements
- Styling attributes such as stroke, stroke-width, fill, dash patterns, and joins
- Transform attributes
- Gradients
- Advanced SVG topics such as groups, use, defs, clip paths, masks, ids, desc, and comments
- Fonts, including common browser-safe font families and links to Braille29 and Braille36 US

## Keyboard Workflow

shapeCrafter Web supports editable shortcuts for:

- Jump to Line
- Quick Add
- Tab Indent
- Tab Outdent

These shortcuts can be changed from the Keyboard Shortcuts dialog on the home screen.

## Printing And Embossing

shapeCrafter Web is built so the print view focuses on the rendered SVG itself. The goal is to make printing behave like opening the SVG directly in the browser and sending only the graphic to the printer or embosser.

## Accessibility Goals

shapeCrafter Web is being built with these priorities:

- WCAG 2.2 AA conformance
- true HTML5 structure
- keyboard-first operation
- blind-first interaction design
- native controls before custom patterns
- minimal ARIA, only where it adds needed clarity

## Where This Is Going

shapeCrafter Web is the starting point for a larger BlindSVG creation environment. More authoring support, SVG helpers, educational references, and export options will continue to grow from here.
