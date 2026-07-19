# XYInput API Documentation

`XYInput` is a lightweight, dependency-free JavaScript module that provides a 2D (X and/or Y) input control. It allows users to select a point within a defined area using mouse dragging, touch gestures, or keyboard arrow keys. It is highly customizable and can be configured as a 2D grid selector, a horizontal slider, or a vertical slider.

---

## Installation & CDN Usage

Since the project is hosted on GitHub at [github.com/bkatzung/hugh](https://github.com/bkatzung/hugh), you can load the module and its stylesheet directly from the **jsDelivr CDN**.

### HTML Integration

Include the CSS in your `<head>` and import the ES module in your JavaScript:

```html
<!-- Include XYInput Stylesheet -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/bkatzung/hugh@main/xyinput.css">

<!-- Import and Use XYInput Module -->
<script type="module">
  import XYInput from 'https://cdn.jsdelivr.net/gh/bkatzung/hugh@main/xyinput.esm.js';

  // Initialize a 2D input
  const xy = new XYInput({ width: 200, height: 200 });
  document.body.appendChild(xy.input);
</script>
```

---

## Quick Start

Here is a simple example of creating a 2D input and listening for value changes:

```javascript
import XYInput from 'https://cdn.jsdelivr.net/gh/bkatzung/hugh@main/xyinput.esm.js';

const myInput = new XYInput({
  width: 150,
  height: 150,
  x: 75,
  y: 75
});

// Append the DOM element to your container
document.getElementById('container').appendChild(myInput.input);

// Listen for real-time updates during dragging
myInput.input.addEventListener('input', () => {
  console.log('Current coordinates:', myInput.getXY()); // e.g., [80, 72]
});

// Listen for final value changes when interaction ends
myInput.input.addEventListener('change', () => {
  console.log('Final value:', myInput.value); // e.g., "80,72"
});
```

---

## API Reference

### `new XYInput(opts)`

Creates a new `XYInput` instance.

#### Parameters

- `opts` (Object, optional): Configuration options for the input control.
  - `width` (number, default: `100`): The width of the input area in pixels.
  - `height` (number, default: `100`): The height of the input area in pixels.
  - `x` (number, default: `0`): The initial X coordinate of the marker.
  - `y` (number, default: `0`): The initial Y coordinate of the marker.
  - `class` (string, optional): Space-separated CSS class names to add to the main input element.
  - `markerClass` (string, optional): Space-separated CSS class names to add to the marker element.
  - `fixedX` (boolean, default: `false`): If `true`, the X coordinate is locked and cannot be changed.
  - `fixedY` (boolean, default: `false`): If `true`, the Y coordinate is locked and cannot be changed.

---

### Properties

#### `input` (HTMLSpanElement)
*Read-only*

Returns the main DOM element (`<span>`) representing the input control. The element is lazily created on first access.
- It has the CSS class `xyinput`.
- It has inline styles for `width` and `height` applied.
- It has `tabIndex = 0` to make it focusable and support keyboard navigation.
- It contains the marker element.

#### `marker` (HTMLSpanElement)
*Read-only*

Returns the DOM element (`<span>`) representing the draggable marker. The element is lazily created.
- It has the CSS class `xyinput__marker`.
- Its position is updated dynamically via inline `left` and `top` styles.

#### `value` (string | number)
*Read/Write*

A "smart" unified value representation of the current coordinates.
- **Getter**:
  - If `fixedY` is `true` and `fixedX` is `false` (horizontal slider), returns the X coordinate as a **number**.
  - If `fixedX` is `true` and `fixedY` is `false` (vertical slider), returns the Y coordinate as a **number**.
  - Otherwise, returns a **string** in the format `"x,y"` (e.g., `"50,50"`).
- **Setter**:
  - If a **number** is assigned, both X and Y coordinates are set to that value.
  - If a **string** is assigned, it is parsed for numbers (ignoring non-digit characters). The first number sets X, and the second sets Y. If only one number is found, both X and Y are set to that value.

#### `x` (number)
*Read/Write*

The current X coordinate of the marker. Constrained between `0` and `width - 1`.

#### `y` (number)
*Read/Write*

The current Y coordinate of the marker. Constrained between `0` and `height - 1`.

---

### Methods

#### `getXY()`
- **Returns**: `[number, number]`
- **Description**: Returns the current coordinates as an array containing `[x, y]`.

#### `setXY(x, y)`
- **Parameters**:
  - `x` (number): The new X coordinate.
  - `y` (number): The new Y coordinate.
- **Returns**: `this` (the `XYInput` instance, allowing method chaining).
- **Description**: Sets both X and Y coordinates simultaneously.

---

## Events

The `input` DOM element (retrieved via `xyInputInstance.input`) dispatches standard DOM events that you can listen to using `addEventListener`:

### `input`
Dispatched in real-time as the user drags the marker or presses arrow keys. Use this event for immediate feedback (e.g., updating a color preview or a text display).

### `change`
Dispatched when the user finishes interacting with the control:
- On mouse release (`mouseup`) or touch end (`touchend`), if the coordinates changed from when the interaction started.
- Immediately on keyboard arrow key presses (alongside the `input` event).

---

## Keyboard Support

When the `input` element has focus, it supports keyboard navigation:
- **ArrowLeft**: Decrements the X coordinate.
- **ArrowRight**: Increments the X coordinate.
- **ArrowUp**: Decrements the Y coordinate.
- **ArrowDown**: Increments the Y coordinate.
- **Shift + Arrow**: Moves the marker by `10` pixels instead of `1` pixel.

---

## CSS Styling & Customization

`XYInput` comes with a minimal stylesheet (`xyinput.css`) that defines the basic layout and appearance. You can easily override these styles or apply custom classes.

### Default Classes

- `.xyinput`: The main container element. By default, it has a solid border and relative positioning.
- `.xyinput__marker`: The draggable marker. By default, it is styled as a small white circular dot with a border.

### Slider Helper Classes

The stylesheet includes built-in helper classes for 1D sliders:

- `.xyinput--x-slider`: Styles the marker as a vertical bar, ideal for horizontal sliders.
- `.xyinput--y-slider`: Styles the marker as a horizontal bar, ideal for vertical sliders.

#### Example: Creating a Horizontal Slider

```javascript
const slider = new XYInput({
  width: 200,
  height: 20,
  fixedY: true, // Lock Y axis
  class: 'xyinput--x-slider' // Apply horizontal slider marker styling
});

document.body.appendChild(slider.input);
```
