/*
 * Hugh color picker
 * Copyright 2024-2025 by Kappa Computer Solutions, LLC and Brian Katzung
 * Author: Brian Katzung <briank@kappacs.com>
 */

import tinycolor from 'modules/tinycolor.esm.js';
import XYInput from 'modules/xyinput.esm.js';

export class Hugh {
    static gridHeight = 150;	// 100 / 150 / 200 / 250
    static _eyeDropper;
    static _instances = [];

    constructor (opts = {}) {
	this._opts = {
	// input: the <input> element
	defaultColor: '#000',	// if no valid input value
	pickMode: 'auto-hsl',	// (auto-)?{hsl,hsv}
	continuous: false,	// continuous update or pick?
	pickText: '\u2713',
	closeText: 'X',
	withAlpha: false,	// include alpha channel
	showText: false,	// true / false / hex / rgb / hsl / hsv
	format: 'hex',		// hex / rgb / hsl / hsv
	storeName: 'hughOptions',
	...opts
	};
	const proto = Object.getPrototypeOf(this);
	this._onCode = proto._onCode.bind(this);
	this._onTextEvent = proto._onTextEvent.bind(this);
	this._onVisualEvent = proto._onVisualEvent.bind(this);
	this._instIndex = Hugh._instances.length;
	Hugh._instances.push(this);
    }

    // Return the existing Hugh for an <input> element (or undefined)
    static forInput (el) {
	const index = el.dataset?.hughIndex;
	if (index !== undefined) return Hugh._instances[index];
    }

    // Attach the picker to the <input>
    attach () {
	const input = this.input, parent = input?.parentElement;
	if (!input || parent.classList.contains('hugh__wrapper')) return this;
	const wrapper = document.createElement('span'), button = document.createElement('button');
	wrapper.className = 'hugh__wrapper';
	input.replaceWith(wrapper);
	wrapper.append(input, button);
	button.addEventListener('click', () => this.toggle());
	input.dataset.hughIndex = this._instIndex;
	input.addEventListener('code', this._onCode);
	this._setInitialColor();
	this._updateInput('both');
	return this;
    }

    // Close the picker
    close () { this._parts?.picker.remove(); }

    // Return the associated <input> element
    get input () { return this._opts.input; }

    // Respond to code modifications to the primary <input>
    _onCode (e) {
	const input = this.input, color = tinycolor(input.value);
	if (!color.isValid()) return;	// Ignore invalid colors
	if (!this._opts.withAlpha) color.setAlpha(1);
	/*
	 * If the picker is closed, or open in pick mode, update the button
	 * swatch. If the picker is open, update the initial color.
	 */
	const str = color.toString(), picker = this._parts?.picker, parent = picker?.parentElement, continuous = this._opts.continuous;
	if (!parent || !continuous) input.parentElement.style.setProperty('--color', str);
	if (parent) {
	    this._initialColor = color;
	    this._parts.initial.style.setProperty('--color', str);
	}
    }

    // Respond to text <input> changes
    _onTextEvent (e) {
	const opts = this._opts, input = opts.input;
	if (opts.readOnly) {
	    e.preventDefault();
	    this._updateText();
	    return;
	}
	if (!opts.showText) return;
	const parts = this._parts, picker = parts.picker, format = ['hex', 'rgb', 'hsl', 'hsv'][parts.textMode.selectedIndex];
	let color;
	if (format === 'hex') color = tinycolor(parts.inputHex.value);
	else {
	    const x = parseInt(parts.inputX.value),
	      y = parseInt(parts.inputY.value),
	      z = parseInt(parts.inputZ.value),
	      a = parseInt(parts.inputA.value);
	    switch (format) {
	    case 'rgb':
		color = tinycolor({ r: x, g: y, b: z, a: a / 100 });
		break;
	    case 'hsl':
		color = tinycolor({ h: x, s: y / 100, l: z / 100, a: a / 100 });
		break;
	    case 'hsv':
		color = tinycolor({ h: x, s: y / 100, v: z / 100, a: a / 100 });
		break;
	    }
	}
	if (color.isValid()) {
	    if (!opts.withAlpha) color.setAlpha(1);
	    this.setColor(color);
	    if (opts.continuous) this._updateInput('input');
	    if (format === 'hex') this._updateText();
	    this._updateVisual();
	} else this._updateText();
    }

    // Respond to grid and slider changes
    _onVisualEvent (e) {
	const parts = this._parts, grid = parts.gridXYI, z = parts.zXYI;
	const opts = this._opts, height = Hugh.gridHeight, color = this._color;
	const input = opts.input;
	if (opts.readOnly) {
	    e.preventDefault();
	    this._updateVisual();
	    return;
	}
	if (this._pickMode === 'hsv') {
	    color.h = Math.round(z.x * 1.5) % 360;
	    color.s = grid.x / 250;
	    color.v = (height - grid.y) / height;
	    parts.picker.style.setProperty('--h', color.h);
	} else {
	    color.h = Math.round(grid.x * 1.5) % 360;
	    color.s = (grid.x > 240) ? 0 : (z.x / 250);
	    color.l = (height - grid.y) / height;
	}
	if (opts.withAlpha) color.a = parts.alphaXYI.x / 250;
	if (opts.continuous) this._updateInput('input');
	this._updateVisual(true);
	this._updateText();
    }

    // Open the picker
    open () {
	const input = this.input, picker = this.widget;
	if (!input) return;
	if (input.disabled || input.readOnly) {
	    picker.classList.add('hugh--readonly');
	    this._opts.readOnly = true;
	} else {
	    picker.classList.remove('hugh--readonly');
	    this._opts.readOnly = false;
	}
	picker.style.right = '';
	input.parentElement.append(picker);
	const bcr = picker.getBoundingClientRect();
	if (bcr.x < 10) picker.style.right = '-' + (10 - Math.round(bcr.x)) + 'px';
	this._setInitialColor();
    }

    // Set the color (to a tinycolor value)
    setColor (color) {
	if (!color.isValid()) return;
	const opts = this._opts;
	if (this._pickMode === 'hsv') this._color = color.toHsv();
	else this._color = color.toHsl();
	if (!opts.withAlpha) this._color.a = 1;
	if (opts.input && opts.continuous) this._updateInput('both');
	if (this._parts) {
	    this._updateVisual();
	    this._updateText();
	}
    }

    _setInitialColor () {
	const opts = this._opts;
	let color;
	if (opts.input) this.setColor(color = tinycolor(opts.input.value));
	if (!color?.isValid()) {
	    this.setColor(color = tinycolor(opts.defaultColor));
	    if (opts.continuous) this._updateInput('both');
	}
	this._parts?.initial.style.setProperty('--color', color.toString())
	this._initialColor = color.clone();
    }

    // Set the picking mode to either hsl or hsv
    setPickMode (mode, all = false) {
	const prevMode = this._pickMode, parts = this._parts, picker = parts?.picker;
	if (mode === 'sample' && window.EyeDropper) {
	    Hugh._eyeDropper ||= new EyeDropper();
	    Hugh._eyeDropper.open().then(r => this.setColor(tinycolor(r.sRGBHex)), () => {});
	    if (parts) parts.pickMode.selectedIndex = (prevMode === 'hsv') ? 1 : 0;
	}
	if (mode !== 'hsl' && mode !== 'hsv') return;
	if (all) {
	    if (this._opts.storeName) {
		let config;
		try { config = JSON.parse(localStorage[this._opts.storeName]); }
		catch (_e) { config = {}; }
		config.pickMode = mode;
		localStorage[this._opts.storeName] = JSON.stringify(config);
	    }
	    for (const inst of Hugh._instances) inst.setPickMode(mode);
	    return;
	}
	this._pickMode = mode;
	if (!parts) return;
	if (mode === 'hsv') parts.pickMode.selectedIndex = 1;
	else parts.pickMode.selectedIndex = 0;
	if (prevMode === mode) return;
	const pGrid = parts.grid, pZ = parts.z;
	if (mode === 'hsl') {
	    pGrid.title = pGrid.ariaLabel = 'Hue + Lightness'
	    pZ.title = pZ.ariaLabel = 'Saturation';
	    picker.classList.remove('hugh--pick-hsv');
	    picker.classList.add('hugh--pick-hsl');
	    this._color = tinycolor(this._color).toHsl();
	} else {
	    pGrid.title = pGrid.ariaLabel = 'Saturation + Value'
	    pZ.title = pZ.ariaLabel = 'Hue';
	    picker.classList.remove('hugh--pick-hsl');
	    picker.classList.add('hugh--pick-hsv');
	    this._color = tinycolor(this._color).toHsv();
	}
	this._updateVisual();
	this._updateText();
    }

    // Open or close the picker
    toggle () {
	const picker = this.widget;
	if (picker.parentElement) this.close();
	else this.open();
    }

    // Update the <input> value and wrapper CSS --color
    _updateInput (type = '') {
	const opts = this._opts, input = opts.input;
	if (input) {
	    let format = opts.format;
	    if (format === 'hex') format = (this._color.a < 1) ? 'hex8' : 'hex6';
	    const color = tinycolor(this._color), str = color.toString(format);
	    input.parentElement.style.setProperty('--color', color.toHslString());
	    if (input.value !== str) {
		input.value = str;
		if (type === 'input' || type === 'both') input.dispatchEvent(new InputEvent('input'));
		if (type === 'change' || type === 'both') input.dispatchEvent(new Event('change'));
	    }
	}
    }

    // Update the text inputs
    _updateText () {
	if (!this._opts.showText) return;
	const parts = this._parts, picker = parts.picker, format = ['hex', 'rgb', 'hsl', 'hsv'][parts.textMode.selectedIndex], color = tinycolor(this._color);
	if (format === 'hex') {
	    picker.classList.add('hugh--show-text-hex');
	    picker.classList.remove('hugh--show-text-xyz');
	    parts.inputHex.value = color.toString((this._opts.withAlpha && this._color.a < 1) ? 'hex8' : 'hex');
	} else {
	    picker.classList.add('hugh--show-text-xyz');
	    picker.classList.remove('hugh--show-text-hex');
	    const pX = parts.inputX, pY = parts.inputY, pZ = parts.inputZ;
	    let x, y, z, a;
	    switch (format) {
	    case 'rgb':
		pX.title = pX.ariaLabel = 'Red (0-255)';
		pY.title = pY.ariaLabel = 'Green (0-255)';
		pZ.title = pZ.ariaLabel = 'Blue (0-255)';
		({ r: x, g: y, b: z, a } = color.toRgb());
		break;
	    case 'hsl':
		pX.title = pX.ariaLabel = 'Hue (0-360)';
		pY.title = pY.ariaLabel = 'Saturation %';
		pZ.title = pZ.ariaLabel = 'Lightness %';
		({ h: x, s: y, l: z, a } = color.toHsl());
		break;
	    case 'hsv':
		pX.title = pX.ariaLabel = 'Hue (0-360)';
		pY.title = pY.ariaLabel = 'Saturation %';
		pZ.title = pZ.ariaLabel = 'Value %';
		({ h: x, s: y, v: z, a } = color.toHsv());
		break;
	    }
	    if (format === 'rgb') {
		parts.inputX.value = x;			  // R
		parts.inputY.value = y;			  // G
		parts.inputZ.value = z;			  // B
	    } else {
		parts.inputX.value = Math.round(x);	  // H
		parts.inputY.value = Math.round(y * 100); // S %
		parts.inputZ.value = Math.round(z * 100); // L/V %
	    }
	    parts.inputA.value = Math.round(a * 100);	  // A %
	}
    }

    // Update the visual inputs
    _updateVisual (partial = false) {
	const color = this._color, tc = tinycolor(color), hsl = tc.toHsl(), parts = this._parts, pps = parts.picker.style;
	pps.setProperty('--color', tc.toHslString());
	pps.setProperty('--h', hsl.h);
	pps.setProperty('--s', Math.round(hsl.s * 100) + '%');
	pps.setProperty('--l', Math.round(hsl.l * 100) + '%');
	if (partial) return;		// Update CSS props only
	const height = Hugh.gridHeight;
	if (this._pickMode === 'hsv') {
	    // sv + h
	    parts.gridXYI.setXY(Math.round(color.s * 250), height - Math.round(color.v * height));
	    parts.zXYI.x = Math.round(color.h / 1.5);
	} else {
	    // hl + s
	    const ly = height - Math.round(color.l * height);
	    if (color.s) {
		parts.gridXYI.setXY(Math.round(color.h / 1.5), ly);
		parts.zXYI.x = Math.round(color.s * 250);
	    } else parts.gridXYI.setXY(245, ly);
	}
	parts.picker.style.setProperty('--color', tinycolor(color).toHslString());
	parts.alphaXYI.x = Math.round(color.a * 250);
    }

    // Build the picker widget if needed and return its root element
    get widget () {
	if (this._parts) return this._parts.picker;
	const opts = this._opts, parts = this._parts = {}, picker = parts.picker = document.createElement('div');
	const sa = this._opts.withAlpha ? ' / A %' : '';
	picker.innerHTML =
`<div class='hugh__right'><button title='Pick color' aria-label='Pick color' class='hugh__pick'></button>
<button title='Close picker' aria-label='Close picker' class='hugh__close'></button></div>
<div class='hugh__left'><select title='Pick mode' aria-label='Pick mode' class='hugh__pick-mode'>
<option>HSL</option><option>HSV</option>${
window.EyeDropper ? '<option>Sample</option>' : ''
}<option>HSL All</option><option>HSV All</option>
</select> <span title='Initial color' aria-label='Initial color' aria-role='button' class='hugh__initial' tabindex='0'>&nbsp;</span>
<span title='Current color' aria-label='Current color' aria-role='button' class='hugh__current'>&nbsp;</span></div>
<div class='hugh__grid'></div>
<div class='hugh__z'></div>
<div title='Alpha' aria-label='Alpha' class='hugh__alpha'></div>
<div class='hugh__text'><div><select title='Text mode' aria-label='Text mode' class='hugh__text-mode'>
<option>Hex</option><option>R / G / B${sa}</option>
<option>H &#xb0; / S % / L %${sa}</option><option>H &#xb0; / S % / V %${sa}</option>
</select></div>
<div class='hugh__text-hex'><input title='Hex RGB' aria-label='Hex RGB' class='hugh__input-hex'></div>
<div class='hugh__text-xyz'><input class='hugh__input-x'> / <input class='hugh__input-y'> / <input class='hugh__input-z'>
<span class='hugh__alpha'>/ <input title='Alpha %' aria-label='Alpha %' class='hugh__input-a'></span></div>
`;
	let config;
	try { config = JSON.parse(localStorage[opts.storeName]); }
	catch (_e) { config = {}; }
	const keyElMap = {
	    pick: '.hugh__pick',
	    close: '.hugh__close',
	    pickMode: '.hugh__pick-mode',
	    initial: '.hugh__initial',
	    current: '.hugh__current',
	    grid: '.hugh__grid',
	    z: '.hugh__z',
	    alpha: '.hugh__alpha',
	    textMode: '.hugh__text-mode',
	    inputHex: '.hugh__input-hex',
	    inputX: '.hugh__input-x',
	    inputY: '.hugh__input-y',
	    inputZ: '.hugh__input-z',
	    inputA: '.hugh__input-a',
	};
	for (const key of Object.keys(keyElMap)) this._parts[key] = picker.querySelector(keyElMap[key]);
	let pickMode = config.pickMode;
	switch (opts.pickMode) {
	case 'hsl':
	case 'hsv':
	    pickMode = opts.pickMode;
	    break;
	case 'auto-hsl': pickMode ||= 'hsl'; break;
	case 'auto-hsv': pickMode ||= 'hsv'; break;
	}
	picker.className = 'hugh';
	if (opts.withAlpha) picker.classList.add('hugh--with-alpha');
	if (opts.showText) picker.classList.add('hugh--show-text');
	if (opts.continuous) picker.classList.add('hugh--continuous');
	parts.pick.textContent = opts.pickText;
	parts.close.textContent = opts.closeText;
	parts.gridXYI = new XYInput({ width: 251, height: Hugh.gridHeight + 1 });
	parts.grid.append(parts.gridXYI.input);
	parts.zXYI = new XYInput({ width: 251, height: 20, fixedY: true, x: 250, y: 10, class: 'xyinput--x-slider' });
	parts.z.append(parts.zXYI.input);
	parts.alphaXYI = new XYInput({ width: 251, height: 20, fixedY: true, x: 250, y: 10, class: 'xyinput--x-slider' });
	parts.alpha.append(parts.alphaXYI.input);

	this._setInitialColor();

	// Respond to picking-mode changes
	parts.pickMode.addEventListener('change', () => {
	    const mode = parts.pickMode.selectedOptions[0].value;
	    switch (mode) {
	    case 'HSL All':
		this.setPickMode('hsl', true);
		break;
	    case 'HSL':
		this.setPickMode('hsl');
		break;
	    case 'HSV All':
		this.setPickMode('hsv', true);
		break;
	    case 'HSV':
		this.setPickMode('hsv');
		break;
	    case 'Sample':
		this.setPickMode('sample');
		break;
	    }
	});

	// Initial click => reset to initial color
	parts.initial.addEventListener('click', () => this.setColor(this._initialColor));
	// Curent click => grid focus
	parts.current.addEventListener('click', () => parts.gridXYI.input.focus());
	// Pick => update and close
	parts.pick.addEventListener('click', () => { this._updateInput('both'); this.close(); });
	parts.close.addEventListener('click', () => this.close());
	parts.textMode.addEventListener('change', () => this._updateText());
	for (const part of ['inputHex', 'inputX', 'inputY', 'inputZ', 'inputA']) parts[part].addEventListener('change', this._onTextEvent);

	parts.gridXYI.input.addEventListener('input', this._onVisualEvent);
	parts.zXYI.input.addEventListener('input', this._onVisualEvent);
	parts.alphaXYI.input.addEventListener('input', this._onVisualEvent);
	this.setPickMode(pickMode);
	const textIndex = ['hex', 'rgb', 'hsl', 'hsv'].indexOf(opts.showText);
	if (textIndex > 0) parts.textMode.selectedIndex = textIndex;
	return picker;
    }

}

export { Hugh as default };

// END
