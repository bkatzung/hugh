/*
 * Hugh color picker
 * Copyright 2024-2026 by Kappa Computer Solutions, LLC and Brian Katzung
 * Author: Brian Katzung <briank@kappacs.com>
 */

import tinycolor from '@tinycolor';
import XYInput from '@xyinput';

export const HUGH_SYMBOL = Symbol('Hugh');
const FORMATS = ['', 'hex', 'rgb', 'hsl', 'hsv', 'oklch'];

export class Hugh {
	static gridHeight = 150;		// 100 / 150 / 200 / 250
	static _converter;
	static _eyeDropper;

	constructor (opts = {}) {
		this._opts = {
			// input: the <input> element
			defaultColor: '#000',	// if no valid input value
			pickMode: 'auto-hsl',	// (auto-)?{hsl,hsv}
			continuous: false,	// continuous update or pick?
			pickText: '\u2713',
			closeText: 'X',
			withAlpha: false,	// include alpha channel
			showText: false,	// true / false / hex / rgb / hsl / hsv / oklch
			format: '',			// '' / hex / rgb / hsl / hsv / oklch
			storeName: 'hughOptions',
			...opts
		};

		const proto = Object.getPrototypeOf(this);
		const input = opts.input;

		if (!input) throw new RangeError('Input required');
		this._onCode = proto._onCode.bind(this);
		this._onTextEvent = proto._onTextEvent.bind(this);
		this._onVisualEvent = proto._onVisualEvent.bind(this);
		input[HUGH_SYMBOL] = this;
		input.dataset.hugh = '';
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
		input.addEventListener('code', this._onCode);
		this._setInitialColor();
		this._updateInput('both');
		return this;
	}

	// Close the picker
	close () { this._parts?.picker.remove(); }

	static get _converterElement () {
		let converter = Hugh._converter;

		if (!converter) {
			converter = Hugh._converter = document.createElement('script');
			converter.className = 'hugh-converter';
		}
		if (!converter.parentElement) document.head.append(converter);
		return converter;
	}

	// Get the current color as an oklch string (as converted by the browser)
	get currentOKLCHStr () {
		const input = this._parts?.input;

		if (!input) return;

		// Turn the incredibly long raw value into something a bit more compact
		const withAlpha = this._opts.withAlpha;
		const raw = getComputedStyle(input, 'before').borderTopColor;
		const parts = Array.from(raw.matchAll(/([0-9\.]+)(%?)/g));
		const l = String(Math.round(parseFloat(parts[0][1]) * (parts[0][2] ? 100 : 10000)) / 100) + '%';
		const c = String(Math.round(parseFloat(parts[1][1]) * (parts[1][2] ? 100 : 10000)) / 10000);
		const h = Math.round(parts[2][1]);
		const aPct = (parts.length > 3) ? Math.round(parseFloat(parts[3][1]) * (parts[3][2] ? 1 : 100)) : 100;
		const a = (withAlpha && aPct < 100) ? ` / ${aPct}%` : '';

		return `oklch(${l} ${c} ${h}${a})`;
	}

	// Return the existing Hugh for an <input> element (or undefined)
	static forInput (el) {
		return el[HUGH_SYMBOL];
	}

	// Return the associated <input> element
	get input () { return this._opts.input; }

	// Respond to code modifications to the primary <input>
	_onCode (e) {
		const input = this.input, color = this.parseColor(input.value);
		const withAlpha = this._opts.withAlpha;

		if (!color.isValid()) return;	// Ignore invalid colors
		if (!withAlpha) color.setAlpha(1);

		/*
		 * If the picker is closed, or open in pick mode, update the button
		 * swatch. If the picker is open, update the initial color.
		 */
		const str = color.toString();
		const picker = this._parts?.picker, parent = picker?.parentElement, continuous = this._opts.continuous;

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

		const parts = this._parts, picker = parts.picker;
		const format = FORMATS[parts.textMode.selectedIndex];
		const color = this.parseColor(parts.input.value, format);

		if (color.isValid()) {
			if (!opts.withAlpha) color.setAlpha(1);
			this.setColor(color);
			if (opts.continuous) this._updateInput('input');
			this._updateVisual();
		}
		this._updateText();
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
		} else { // hsl
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

	// Parse a color string into a tinycolor
	parseColor (str, hint) {
		if (/^#?[0-9a-fA-f]+$/.test(str)) return tinycolor(str); // simple hex color

		const startsNumeric = /^[0-9\.]/.test(str); // starts numeric (not with a color function or name)

		if (str.startsWith('hsv') || (hint === 'hsv' && startsNumeric)) {
			// hsv/hsva (non-browser, tinycolor only)
			const nums = str.matchAll(/([\d\.]+%?)/g);
			const hsv = (nums.length > 2) && `${nums[0][1]} ${nums[1][1]} ${nums[2][1]}`;

			if (nums.length === 3) return tinycolor(`hsv ${hsv}`);
			if (nums.length === 4) return tinycolor(`hsva ${hsv} ${nums[3][1]}`);
		}

		if (startsNumeric && hint) {
			// Try to wrap bare (color-function-less) values based on the hint
			const nums = str.matchAll(/([\d\.]+%?)/g);
			const initial = (nums.length > 2) && `${nums[0][1]} ${nums[1][1]} ${nums[2][1]}`;
			const alpha = (nums.length === 4) ? ` / ${nums[3][1]}` : '';

			if (initial) switch (hint) {
			case 'hsl': str = `hsl(${initial}${alpha})`; break;
			case 'oklch': str = `oklch(${initial}${alpha})`; break;
			case 'rgb': str = `rgb(${initial}${alpha})`; break;
			}
		}

		// Leverage the browser's color-conversion engine
		const converter = Hugh._converterElement;

		converter.style.setProperty('--to-rgb', str);

		const computed = getComputedStyle(converter).color;

		if (computed.startsWith('color(srgb')) { // Modern `color(srgb r g b / a)`
			const parts = Array.from(computed.matchAll(/([\d\.]+)(%)?/g));
			const r = parseFloat(parts[0][1]) / (parts[0][2] ? 100 : 1);
			const g = parseFloat(parts[1][1]) / (parts[1][2] ? 100 : 1);
			const b = parseFloat(parts[2][1]) / (parts[2][2] ? 100 : 1);
			const a = (parts.length > 3) ? (parseFloat(parts[3][1]) / (parts[3][2] ? 100 : 1)) : 1;

			return tinycolor.fromRatio({ r, g, b, a });
		}
		// Probably legacy `rgb(r, g, b)` or `rgba(r, g, b, a)`
		return tinycolor(computed);
	}

	// Set the color (to a tinycolor value)
	setColor (color) {
		const opts = this._opts;

		if (color.isValid()) {
			if (this._pickMode === 'hsv') this._color = color.toHsv();
			else this._color = color.toHsl();
		} else return;

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

		if (opts.input) {
			color = tinycolor(opts.input.value);
			this.setColor(color);
		}
		if (!color?.isValid()) {
			color = tinycolor(opts.defaultColor);
			this.setColor(color);
			if (opts.continuous) this._updateInput('both');
		}
		this._parts?.initial.style.setProperty('--color', color.toString())
		this._initialColor = color.clone();
	}

	// Set the picking mode to either hsl or hsv
	setPickMode (mode, all = false) {
		const prevMode = this._pickMode, parts = this._parts;

		if (mode === 'sample' && window.EyeDropper) {
			Hugh._eyeDropper ||= new EyeDropper();
			Hugh._eyeDropper.open().then(r => this.setColor(tinycolor(r.sRGBHex)), () => {});
			if (parts) parts.pickMode.selectedIndex = (prevMode === 'hsv') ? 1 : 0;
		}
		switch (mode) {
		case 'hsl': case 'hsv': break;
		default: return;
		}
		if (all) {
			if (this._opts.storeName) {
				let config;

				try { config = JSON.parse(localStorage[this._opts.storeName]); }
				catch (_e) { config = {}; }
				config.pickMode = mode;
				localStorage[this._opts.storeName] = JSON.stringify(config);
			}
			for (const node of document.querySelectorAll('input[data-hugh]')) {
				const inst = Hugh.forInput(node);

				if (inst) inst.setPickMode(mode);
			}
			return;
		}
		this._pickMode = mode;
		if (!parts) return;
		if (mode === 'hsv') parts.pickMode.selectedIndex = 1;
		else parts.pickMode.selectedIndex = 0;
		if (prevMode === mode) return;

		const picker = parts.picker, classList = picker.classList;
		const pGrid = parts.grid, pZ = parts.z;

		if (mode === 'hsl') {
			pGrid.title = pGrid.ariaLabel = 'Hue + Lightness'
			pZ.title = pZ.ariaLabel = 'Saturation';
			classList.remove('hugh--pick-hsv');
			classList.add('hugh--pick-hsl');
			this._color = tinycolor(this._color).toHsl();
		} else {
			pGrid.title = pGrid.ariaLabel = 'Saturation + Value'
			pZ.title = pZ.ariaLabel = 'Hue';
			classList.remove('hugh--pick-hsl');
			classList.add('hugh--pick-hsv');
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

			switch (format) {
			case 'hex':
				format = (this._color.a < 1) ? 'hex8' : 'hex6';
				break;
			case 'oklch':
				format = 'hsl';
				break;
			}

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

		const parts = this._parts, picker = parts.picker;
		const format = FORMATS[parts.textMode.selectedIndex];
		const color = tinycolor(this._color);
		const withAlpha = this._opts.withAlpha;
		const pct = (n) => String(Math.round(n * 100)) + '%';

		switch (format) {
		case 'hex':
			parts.input.value = color.toString((withAlpha && this._color.a < 1) ? 'hex8' : 'hex');
			break;
		case 'hsl':
		{
			const { h, s, l, a } = color.toHsl();

			parts.input.value = `hsl(${Math.round(h)} ${pct(s)} ${pct(l)}${(withAlpha && a < 1) ? (' / ' + pct(a)) : ''})`;
			break;
		}
		case 'hsv':
		{
			const { h, s, v, a } = color.toHsv();

			parts.input.value = `hsv(${Math.round(h)} ${pct(s)} ${pct(v)}${(withAlpha && a < 1) ? (' / ' + pct(a)) : ''})`;
			break;
		}
		case 'oklch':
			parts.input.value = this.currentOKLCHStr;
			break;
		case 'rgb':
		{
			const { r, g, b, a } = color.toRgb();

			parts.input.value = `rgb(${r} ${g} ${b}${(withAlpha && a < 1) ? (' / ' + pct(a)) : ''})`;
			break;
		}
		case '':
			parts.input.value = '';
			break;
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
		const sa = this._opts.withAlpha ? ' / A' : '';

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
<option>&#x2014;</option><option>Hex</option><option>R G B${sa}</option>
<option>H S L${sa}</option><option>H S V${sa}</option><option>OK L C H${sa}</option>
</select></div>
<div><input title='Color' aria-label='Color' class='hugh__input' placeholder='\u2014'></div></div>
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
			input: '.hugh__input',
		};

		for (const key of Object.keys(keyElMap)) this._parts[key] = picker.querySelector(':scope ' + keyElMap[key]);

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
		parts.input.addEventListener('change', this._onTextEvent);
		parts.gridXYI.input.addEventListener('input', this._onVisualEvent);
		parts.zXYI.input.addEventListener('input', this._onVisualEvent);
		parts.alphaXYI.input.addEventListener('input', this._onVisualEvent);
		this.setPickMode(pickMode);

		const textIndex = FORMATS.indexOf(opts.showText);

		if (textIndex > 0) parts.textMode.selectedIndex = textIndex;
		return picker;
	}

}

export { Hugh as default };

// END
