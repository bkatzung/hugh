# Hugh & XYInput

A lightweight, dependency-free suite of interactive UI controls for modern web applications.

This repository contains two companion modules:
1. **Hugh**: A highly customizable, browser-powered color picker widget.
2. **XYInput**: A versatile 2D (X/Y) input control, perfect for grids, sliders, and custom selectors.

---

## Features

### Hugh (Color Picker)
- **Dual Picking Modes**: Switch on-the-fly between HSL (Hue/Lightness grid, Saturation slider) and HSV (Saturation/Value grid, Hue slider) picking modes.
- **Alpha Channel Support**: Optional transparency slider for full RGBA/HSLA/OKLCHA control.
- **Browser-Powered Conversions**: Leverages the browser's native CSS engine for advanced color conversions (such as OKLCH, modern `color(srgb ...)`, relative colors, color mixing, etc.).
- **sRGB Picking Domain**: Restricts visual picking to the sRGB domain for broad monitor compatibility, while allowing out-of-gamut inputs to be mapped or clamped by the browser.
- **Continuous or Pick Updates**: Update the input value in real-time during interaction, or only when confirming the selection.
- **No External Dependencies**: Bundles a version of TinyColor for seamless, self-contained usage.

### XYInput (2D Input Control)
- **Multi-Dimensional Input**: Select a point within a defined 2D area using mouse dragging, touch gestures, or keyboard arrow keys.
- **Flexible Configurations**: Easily configure as a 2D grid selector, a horizontal slider, or a vertical slider.
- **Keyboard Navigation**: Full keyboard support with arrow keys (and Shift modifier for larger steps).
- **Zero Dependencies**: Extremely lightweight and written in pure vanilla JavaScript.

---

## Installation & CDN Usage

You can load both modules and their stylesheets directly from the **jsDelivr CDN**:

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
```

---

## Quick Start

### 1. Using Hugh (Color Picker)

Attach a color picker to an existing `<input>` element:

```html
<input id="my-color" value="#ff0000">

<script type="module">
  import { Hugh } from '@hugh';

  const picker = new Hugh({
    input: document.getElementById('my-color'),
    continuous: true,
    showText: 'oklch',
    withAlpha: true
  }).attach();
</script>
```

### 2. Using XYInput (2D Grid / Slider)

Create a 2D input control and append it to the DOM:

```html
<div id="container"></div>

<script type="module">
  import XYInput from '@xyinput';

  const xy = new XYInput({
    width: 200,
    height: 200,
    x: 100,
    y: 100
  });

  document.getElementById('container').appendChild(xy.input);

  xy.input.addEventListener('input', () => {
    console.log('Current coordinates:', xy.getXY());
  });
</script>
```

---

## Documentation

For detailed API references, configuration options, and customization guides, please refer to the companion documentation:

-  [**Hugh API Documentation**](docs/hugh.md)
-  [**XYInput API Documentation**](docs/xyinput.md)

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
