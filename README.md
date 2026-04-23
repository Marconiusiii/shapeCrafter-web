# shapeCrafter Web

shapeCrafter Web is a browser-based SVG workspace built for BlindSVG. It gives you a place to write SVG code, render the result in the browser, save your files in the browser, export graphics, and print or emboss the finished output without leaving the page.

## What You Can Do Here

Use shapeCrafter to:

- start a new SVG file from scratch
- start from a ready-made template
- write and edit SVG code directly in the browser
- insert common SVG elements from the menu or Quick Add
- render the drawing while you work
- save files in the browser and reopen them later
- download SVG files to your computer
- export raster images
- convert plain text into braille Unicode
- print or emboss only the SVG graphic

## Starting A File

From the home screen, choose New File if you want to start with a blank SVG document.

The New File dialog lets you enter:

- a filename
- a size preset
- the viewBox
- the width
- the height

US Letter portrait is the default starting point, and shapeCrafter will build the opening SVG code for you, including the `<title>` element.

If you want a head start, choose Start File from Template instead. The template gallery includes starter files for common tactile and learning projects, including graph paper, dot grids, braille text, charts, wireframes, a tactile clock face, and a simple emoji drawing.

## Working In The SVG Code Editor

The SVG Code Editor is where you write and revise your drawing.

You can type your code directly, paste in SVG from elsewhere, or add elements from the SVG Element Menu. If the shape prompt option is on, shapeCrafter will ask for the attributes before adding the code. If it is off, the element is placed directly into the editor using starter values that match the overall BlindSVG teaching style.

Quick Add gives you another way to insert elements without moving far from your editing flow. You can open it with its shortcut and choose the element you want from the list.

Jump to Line lets you move directly to a specific line in the file. This is especially useful when you are working through a larger SVG or correcting an error.

## Editor Settings

Editor Settings gives you control over how the editor behaves while you work.

Live View can be turned on if you want the render view to update automatically after you stop typing for a moment. If Live View is off, use Render SVG when you want to update the drawing yourself.

Render Delay sets how long shapeCrafter waits before Live View updates the graphic.

Autosave is on by default. When it is on, the current file is saved to the browser as you work. Autosave Interval lets you choose how often that save happens.

Render Sound can be turned on if you want a short sound after pressing Render SVG while Live View is off. A successful render and a render error each have their own sound.

## Render View

Render View gives you the current browser rendering of your SVG code.

You can leave it open while you work, collapse it when you want more room in the editor, or open the graphic in full screen when you want to inspect the drawing on its own.

If Live View is on, the rendered image updates automatically after the delay you set in Editor Settings. If Live View is off, use the Render SVG button to refresh the drawing.

## File Actions

File Actions collects the main file commands into one place.

From File Actions, you can:

- save the current file
- save a copy with Save As
- download the SVG
- print or emboss the graphic
- export a raster image
- revert the file back to the version that was loaded when the current session began
- rename the file
- delete the file

If you use Print/Emboss, shapeCrafter sends only the SVG graphic to the browser print flow so the output stays focused on the drawing itself.

## Saved Files

Saved files appear on the home screen in the Saved Files table.

Each file can be opened directly from the table. Every saved file also has its own actions menu with Rename, Duplicate, and Delete.

Duplicate creates a new copy of the file and adds “copy” to the filename so you can branch your work without losing the original.

## Exporting Raster Images

Export Raster lets you convert the current SVG into a bitmap image.

You can choose:

- the file type
- the output units
- the width
- the height
- the DPI
- whether the image should scale proportionately

This makes it easier to prepare a version for sharing or reference while keeping the original SVG file intact.

## Printing And Embossing

shapeCrafter is built so the print flow stays focused on the SVG itself.

When you choose Print/Emboss, the goal is to match the experience of opening the SVG file directly in the browser and printing from there. The browser should receive the SVG graphic alone rather than the surrounding editor interface.

## SVG Code Reference

The SVG Code Reference is built into the editor so you can keep working without leaving the page.

It includes quick reference material for:

- basic shapes
- path commands
- styling
- transforms
- gradients
- advanced SVG structure
- fonts

This material is meant to stay practical and readable while you code.

## Braille Converter

The Braille Converter lets you enter text, choose a braille table, and convert the result into copyable braille Unicode.

You can then place that braille directly into SVG text elements in your file.

The available options include English braille tables for Unified English Braille, U.S. English, British English, and math output now supported in the app.

## Fonts

shapeCrafter includes a Fonts Reference inside the SVG Code Reference. This gives you a quick guide to common font families and how to write `font-family` values in SVG.

Braille29 and Braille36 US are also provided as direct download links in the app, and those fonts are loaded into shapeCrafter so braille text can be used more reliably in browser-based SVG work.

Braille29 should be used at `29pt`, and Braille36 US should be used at `36pt`.

## Keyboard Shortcuts

shapeCrafter includes editable keyboard shortcuts for:

- Jump to Line
- Quick Add
- Tab Indent
- Tab Outdent

You can change these from the Keyboard Shortcuts dialog on the home screen.

## A Good Way To Work

If you are just getting started, a good working pattern is:

1. start a new file or open a template
2. write or insert a few SVG elements
3. use Render SVG or Live View to check the drawing
4. save the file in the browser as you go
5. use the SVG Code Reference and Braille Converter when you need them
6. print, emboss, download, or export when the file is ready

## Ongoing Work

shapeCrafter is still growing. More templates, references, and authoring help will continue to be added as the project develops.
