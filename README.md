# UniCSS

A universal CSS-in-JS microlibrary (less than 500 lines of code!) for styling your UI components.

Features:
- :sparkles: **Framework agnostic**: the library integrates well with React and Preact, but you can use the `css`, `keyframes` or `globalCss` functions with any other framework like Vue.
- :nail_care: **Themeable**: use your custom colors, typography, properties aliases, custom media queries and more.
- :clipboard: **CSS features**: upports pseudo-classes like `:hover` or `:focus` and at-rules like `@media` queries, `@font-face`, `@keyframes` and `@import`.
- :train2: **Server-Side Rendering**: UniCSS supports server-side rendering thanks to `extractCss` function. 

## Installation

Use **npm** or **yarn** for adding this package to your project:

```bash
$ yarn add unicss
``` 

## Usage

Use the `configure` function to provide the *pragma* function from your UI framework (`createElement` for React, `h` for Preact). The `configure` function should be called only once in the entry file of your application.

```js
import React from "react";
import {configure, styled} from "unicss";

configure({pragma: React.createElement});
```

Use the `styled` function to create a component and add styles to it. Note that you should execute `configure` before using the `styled` function.

```js
const Button = styled("button", {
    backgroundColor: "dodgerblue",
    borderRadius: "9999px",
    color: "white",
    padding: "0.875rem 1rem",
    "&:hover": {
        backgroundColor: "royalblue",
        cursor: "pointer",
    },
});
```

The `styled` function returns a component for the specified `tag` name, and can be rendered in your application as any other component:

```jsx
render(
    <Button onClick={() => alert("Hello world!")}>
        Click me
    </Button>
);
```

Note that the `styled` function is not available outside *React* or *Preact*, but you can use the `css`, `globalCss` or `keyframes` functions to style your HTML elements.

```js
import {css} from "unicss";

// Generate a classname from the specified styles object
const titleClassName = css({
    display: "block",
    fontSize: "3rem",
    fontWeight: "bold",
});

// Usage in Vanilla JS
const title = document.querySelector("#title");
title.classList.add(titleClassName);

// Usage in JSX
render(
    <h1 className={titleClassName}>
        Hello world
    </h1>
);
```

## License

[MIT License](https://github.com/jmjuanes/unicss/blob/main/LICENSE).
