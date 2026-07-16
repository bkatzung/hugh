/*
 * X-and/or-Y input
 * Copyright 2024-2025 by Kappa Computer Solutions, LLC and Brian Katzung
 * Author: Brian Katzung <briank@kappacs.com>
 */

export class XYInput {
    constructor (opts = {}) {
	this._opts = opts;
	this._width = opts.width || 100;
	this._height = opts.height || 100;
	this._x = opts.x || 0;
	this._y = opts.y || 0;
    }

    get input () {
	if (this._input) return this._input;
	const opts = this._opts;
	const input = this._input = document.createElement('span');
	input.className = 'xyinput';
	input.style.width = this._width + 'px';
	input.style.height = this._height + 'px';
	input.tabIndex = 0;
	if (opts.class) input.classList.add(...opts.class.split(/\s+/));
	const marker = this._marker = document.createElement('span');
	marker.className = 'xyinput__marker';
	if (opts.markerClass) marker.classList.add(...opts.markerClass.split(/\s+/));
	input.append(marker);
	marker.style.left = this._x + 'px';
	marker.style.top = this._y + 'px';
	this._setXY(this._x, this._y);
	this.onEvent = Object.getPrototypeOf(this).onEvent.bind(this);
	for (const name of ['blur', 'focus', 'mousedown', 'touchstart']) input.addEventListener(name, this.onEvent);
	return input;
    }

    get marker () {
	if (!this._marker) this.input;
	return this._marker;
    }

    get value () {
	// Smart uni-value
	const opts = this._opts;
	if (!opts.fixedX && opts.fixedY) return this._x;
	if (opts.fixedX && !opts.fixedY) return this._y;
	return this._x.toString() + ',' + this._y.toString();
    }
    get x () { return this._x; }
    getXY () { return [ this._x, this._y ]; }
    get y () { return this._y; }

    set value (v) {
	if (typeof v === 'number') this._setXY(v, v);
	else if (typeof v === 'string') {
	    const parts = v.split(/[^\d]+/);
	    this._setXY(parseInt(parts[0]), parseInt(parts[(parts.length > 1) ? 1 : 0]));
	}
    }
    set x (x) { this._setXY(x, this._y); }
    setXY (x, y) { this._setXY(x, y); return this; }
    set y (y) { this._setXY(this._x, y); }

    _setXY (x, y, ev = false) {
	let moved = false;
	if (!this._opts.fixedX && typeof x === 'number') {
	    if (x < 0) x = 0;
	    else if (x >= this._width) x = this._width - 1;
	    if (this._x !== x) {
		this._x = x;
		this.marker.style.left = x + 'px';
		moved = true;
	    }
	}
	if (!this._opts.fixedY && typeof y === 'number') {
	    if (y < 0) y = 0;
	    else if (y >= this._height) y = this._height - 1;
	    if (this._y !== y) {
		this._y = y;
		this.marker.style.top = y + 'px';
		moved = true;
	    }
	}
	if (ev && moved) {
	    if (ev !== 'change') this._input.dispatchEvent(new InputEvent('input'));
	    if (ev !== 'input') this._input.dispatchEvent(new InputEvent('change'));
	}
    }

    // This universal event handler gets bound
    onEvent (e) {
	let adjX = 0, adjY = 0;
	const endEvent = () => {
	    if (this._x !== this._startX || this._y !== this._startY) this._input.dispatchEvent(new InputEvent('change'));
	}, addListener = ev => addEventListener(ev, this.onEvent),
	removeListener = ev => removeEventListener(ev, this.onEvent);
	switch (e.type) {
	case 'mousedown':
	case 'touchstart':
	    e.preventDefault();
	    this._input.focus();
	    this._startX = this._x;
	    this._startY = this._y;
	    this._bcr = this._input.getBoundingClientRect();
	    this._bcr.x = Math.round(this._bcr.x);
	    this._bcr.y = Math.round(this._bcr.y);
	    // ...
	case 'mousemove':
	case 'touchmove':
	    adjX = -this._bcr.x;
	    adjY = -this._bcr.y;
	    break;
	}
	const etc = e.touches?.[0] || e;	// Event touch or click object
	switch (e.type) {
	case 'blur':
	    this._input.removeEventListener('keydown', this.onEvent);
	    break;
	case 'focus':
	    this._input.addEventListener('keydown', this.onEvent);
	    break;
	case 'keydown':
	    const opts = this._opts, delta = e.shiftKey ? 10 : 1;
	    switch (e.key) {
	    case 'ArrowLeft':
		if (!opts.fixedX) {
		    e.preventDefault();
		    this._setXY(this._x - delta, this._y, 'both');
		}
		break;
	    case 'ArrowRight':
		if (!opts.fixedX) {
		    e.preventDefault();
		    this._setXY(this._x + delta, this._y, 'both');
		}
		break;
	    case 'ArrowUp':
		if (!opts.fixedY) {
		    e.preventDefault();
		    this._setXY(this._x, this._y - delta, 'both');
		}
		break;
	    case 'ArrowDown':
		if (!opts.fixedY) {
		    e.preventDefault();
		    this._setXY(this._x, this._y + delta, 'both');
		}
		break;
	    }
	    break;
	case 'mousedown':
	    addListener('mouseup');
	    addListener('mousemove');
	    this._setXY(etc.clientX + adjX, etc.clientY + adjY, 'input');
	    break;
	case 'touchstart':
	    addListener('touchend');
	    addListener('touchmove');
	    this._setXY(etc.clientX + adjX, etc.clientY + adjY, 'input');
	    break;
	case 'mousemove':
	case 'touchmove':
	    this._setXY(etc.clientX + adjX, etc.clientY + adjY, 'input');
	    break;
	case 'mouseup':
	    removeListener('mouseup');
	    removeListener('mousemove');
	    endEvent();
	    break;
	case 'touchend':
	    removeListener('touchend');
	    removeListener('touchmove');
	    endEvent();
	    break;
	}
    }
}

export { XYInput as default };
// END
