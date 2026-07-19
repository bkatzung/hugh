# Hugh API Documentation

`Hugh` is a lightweight, highly customizable color picker module. It attaches to standard HTML `<input>` elements, wrapping them in a visual color picker widget that supports on-the-fly switching between HSL and HSV picking modes, alpha channel transparency, real-time continuous updates, and color display and result formats like hex, RGB, HSL, and OKLCH.

The single-element readout/user input box allows for easy copying-and-pasting of the displayed values as well as sophisticated input options.

`Hugh` handles some simple (or non-standard, such as `hsv`) color inputs internally, but also leverages the browser's native CSS engine for advanced color conversions (such as OKLCH, modern `color(srgb ...)`, relative colors, color mixing, etc.).

 The visual picking surface is restricted to the sRGB domain for broad compatibility across monitors. Values from any source that are out-of-gamut for the current display will be mapped or clamped by the browser.

---

## Installation & CDN Usage

Since the project is hosted on GitHub at [github.com/bkatzung/hugh](https://github.com/bkatzung/hugh), you can load the module and its stylesheet directly from the **jsDelivr CDN**.

### HTML Integration

Include the stylesheets for both `XYInput` and `Hugh` in your `<head>`, and configure your import map or import the ES modules directly:

```html
<!-- Include Stylesheets -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/bkatzung/hugh@main/xyinput.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/bkatzung/hugh@main/hugh.css">

<!-- Import Map Configuration -->
<script type="importmap">
{
  "imports": {
    "@hugh": "https://cdn.jsdelivr.net/gh/bkatzung/hugh@main/hugh.esm.js",
    "@tinycolor": "https://cdn.jsdelivr.net/gh/bkatzung/hugh@main/tinycolor.esm.js",
    "@xyinput": "https://cdn.jsdelivr.net/gh/bkatzung/hugh@main/xyinput.esm.js"
  }
}
</script>

<!-- Import and Use Hugh Module -->
<script type="module">
  import { Hugh } from '@hugh';

  const inputElement = document.getElementById('my-color-input');
  const picker = new Hugh({
    input: inputElement,
    withAlpha: true,
    showText: 'rgb'
  }).attach();
</script>
```

---

## Quick Start

Here is a simple example of creating a color picker with continuous updates and OKLCH text display:

```javascript
import { Hugh } from '@hugh';

const myInput = document.getElementById('color-picker');

const picker = new Hugh({
  input: myInput,
  continuous: true,
  showText: 'oklch',
  withAlpha: true,
  format: 'oklch'
}).attach();
```

---

## API Reference

### `new Hugh(opts)`

Creates a new `Hugh` color picker instance.

#### Parameters

- `opts` (Object, **required**): Configuration options for the color picker.
  - `input` (HTMLInputElement, **required**): The `<input>` element to attach the color picker to. Throws a `RangeError('Input required')` if omitted.
  - `defaultColor` (string, default: `'#000'`): The fallback color used if the input element has no valid color value.
  - `pickMode` (string, default: `'auto-hsl'`): The initial color picking mode. Options:
    - `'hsl'`: HSL mode (hue/lightness grid, saturation slider).
    - `'hsv'`: HSV mode ("traditional" saturation/value grid, hue slider).
    - `'auto-hsl'`: Load user preference from `localStorage`, with `hsl` mode as a fallback.
    - `'auto-hsv'`: Load user preference from `localStorage`, with `hsv` mode as a fallback.
  - `continuous` (boolean, default: `false`): If `true`, the input's value is updated in real-time as the user interacts with the picker. If `false`, it is only updated when the user clicks the "Pick" button.
  - `pickText` (string, default: `'\u2713'` (checkmark)): The text/label displayed on the "Pick" (confirm) button.
  - `closeText` (string, default: `'X'`): The text/label displayed on the "Close" button.
  - `withAlpha` (boolean, default: `false`): If `true`, enables the alpha channel slider and includes alpha in the output formats.
  - `showText` (boolean | string, default: `false`): Controls the text input area in the picker.
    - If `false`, the text input area is hidden.
    - If `true`, the text input area is shown with the default format.
    - If a string, shows the text input area and sets the default format to one of: `'hex'`, `'rgb'`, `'hsl'`, `'hsv'`, or `'oklch'`.
  - `format` (string, default: `''`): The output format for the input element's value. Options:
    - `'hex'` (default): Hexadecimal format (e.g., `#ff0000` or `#ff0000ff` with alpha).
    - `'rgb'`: RGB format (e.g., `rgb(255, 0, 0)`).
    - `'hsl'`: HSL format (e.g., `hsl(0, 100%, 50%)`).
    - `'hsv'`: HSV format (e.g., `hsv(0, 100%, 100%)`).
    - `'oklch'`: OKLCH format (e.g., `oklch(63% 0.2514 29)`).
  - `storeName` (string, default: `'hughOptions'`): The key name used in `localStorage` to persist the user's preferred picking mode. Set to `null` or `''` to disable persistence.

> **Notes:**
> - Be aware that the picker has very little "free real-estate". It does not require very much combined `pickText` (in non-continuous mode) and `closeText` before the picker must expand beyond its minimum width (which is already 272 pixels) in order to accommodate it.
> - The color readout shows the modern (comma-less) syntax for all modes. The original `<input>` value will be updated with the older `rgb`/`rgba`/`hsl`/`hsla`/`hsv`/`hsva` syntax (with commas) for those modes.
> - CSS does not natively support the `hsv` color model, but the mode may be useful for working with other tools.

---

### Properties

#### `input` (HTMLInputElement)
*Read-only*

Returns the associated `<input>` element.

#### `widget` (HTMLDivElement)
*Read-only*

Lazily builds and returns the picker's root DOM element (`div.hugh`).

#### `currentOKLCHStr` (string | undefined)
*Read-only*

Returns the current color formatted as an `oklch(...)` string, parsed from the browser's computed style.

---

### Methods

#### `attach()`
- **Returns**: `this` (the `Hugh` instance, allowing method chaining).
- **Description**: Attaches the picker to the `<input>` element. It wraps the input in a `span.hugh__wrapper` along with a toggle button.

#### `open()`
- **Description**: Opens the picker. Appends the picker widget to the input's parent element.

#### `close()`
- **Description**: Closes the picker (removes the picker element from the DOM).

#### `toggle()`
- **Description**: Opens or closes the picker depending on whether it's currently open.

#### `setColor(color)`
- **Parameters**:
  - `color` (TinyColor instance): The new color to set.
- **Description**: Sets the current color.

#### `parseColor(str, hint)`
- **Parameters**:
  - `str` (string): The color string to parse.
  - `hint` (string, optional): A format hint (`'hsl'`, `'oklch'`, `'rgb'`, `'hsv'`) to help parse bare numeric values.
- **Returns**: A `TinyColor` instance.
- **Description**: Parses a color string into a `TinyColor` instance. Uses the browser's CSS custom property conversion engine for advanced formats (like `oklch` or modern `color(srgb ...)`).

#### `setPickMode(mode, all = false)`
- **Parameters**:
  - `mode` (string): `'hsl'`, `'hsv'`, or `'sample'`. If `'sample'` and `window.EyeDropper` is available, opens the system eye dropper.
  - `all` (boolean, default: `false`): If `true`, saves the preference to `localStorage` and updates all other `Hugh` instances on the page.
- **Description**: Sets the picking mode.

---

### Static Properties

#### `gridHeight` (number)
- **Default**: `150`
- **Description**: The height of the color grid in pixels. Common values are `100`, `150`, `200`, or `250`.

---

### Static Methods

#### `static forInput(el)`
- **Parameters**:
  - `el` (HTMLInputElement): The input element.
- **Returns**: The `Hugh` instance associated with the given `<input>` element (or `undefined`).

---

### Symbols

#### `HUGH_SYMBOL` (Symbol)
- **Description**: Exported symbol used to store the `Hugh` instance on the `<input>` element.

---

## CSS Styling & Customization

`Hugh` comes with a minimal stylesheet (`hugh.css`) that defines the basic layout and appearance. You can easily override these styles or apply custom classes.

### Default Classes

- `.hugh`: The main container element of the picker widget.
- `.hugh__wrapper`: The wrapper element that replaces the original `<input>` and contains the toggle button.
- `.hugh__grid`: The 2D color grid container.
- `.hugh__z`: The 1D slider container (saturation in HSL mode, hue in HSV mode).
- `.hugh__alpha`: The 1D alpha channel slider container.
- `.hugh__text`: The text input area container.
- `.hugh__input`: The text input element inside the picker.
- `.hugh__initial`: The swatch showing the initial color.
- `.hugh__current`: The swatch showing the current color.
- `.hugh__pick`: The "Pick" (confirm) button.
- `.hugh__close`: The "Close" button.
- `.hugh__pick-mode`: The picking mode dropdown selector.
- `.hugh__text-mode`: The text format dropdown selector.

### State Classes

The picker widget (`.hugh`) dynamically receives state classes based on its configuration and active mode:

- `.hugh--readonly`: Applied when the associated input is disabled or read-only.
- `.hugh--continuous`: Applied when continuous updates are enabled.
- `.hugh--with-alpha`: Applied when the alpha channel is enabled.
- `.hugh--show-text`: Applied when the text input area is visible.
- `.hugh--pick-hsl`: Applied when the picker is in HSL mode.
- `.hugh--pick-hsv`: Applied when the picker is in HSV mode.

### Custom Properties

`Hugh` uses CSS custom properties to dynamically update its visual state:

- `--initial-color`: The color for the initial (reference) color swatch.
- `--button-color`: The color for the toggle button.
- `--h`: The current hue value (0-360).
- `--s`: The current saturation value (0%-100%).
- `--l`: The current lightness value (0%-100%).
- `--to-rgb`: Used internally on the hidden converter element to leverage the browser's color-conversion engine.

## Credits And References

- The [TinyColor](https://github.com/bgrins/TinyColor) module was written by Brian Grinstead and other contributors and is bundled for convenience and to facilitate no-external-dependency use in browser extensions.
