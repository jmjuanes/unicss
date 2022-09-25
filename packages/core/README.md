# @unicss/core

A tiny and framework agnostic CSS-in-JS solution.

## Installation

Use **npm** or **yarn** for adding this package to your project:

```bash
$ yarn add @unicss/core
``` 

## Usage

```js
import {css} from "@unicss/core";

const button = css({
    backgroundColor: "#2271b1",
    borderRadius: "0.5rem",
    color: "white",
    padding: "0.5rem 1rem",
    "&:hover": {
        cursor: "pointer",
    },
});

document.getElementById("button").classList.add(button);
```

## API

### css(styles)

A function to generate a classname from the specified styles object.

```js
import {css} from "@unicss/core";

const name = css({
    color: "red",
    fontWeight: "bold",
    "&:hover": {
        color: "blue",
        cursor: "pointer",
    },
});
```

### globalCss(styles)

A function to convert the speicifed styles object to global styles. Useful for registering reset styles or font faces.

```js
import {globalCss} from "@unicss/core";

globalCss({
    body: {
        backgroundColor: "#fff",
        color: "#000",
    },
    a: {
        textDecoration: "none",
    },
});
```

### keyframes(obj)

Generate global animations from the specified keyframes configuration object. This function returns an unique animation identifier that can be used in an `animation` CSS property:

```js
import {keyframes, css} from "@unicss/core";

const scale = keyframes({
    from: {
        transform: "scale(1)",
    },
    to: {
        transform: "scale(1.5)",
    },
});

const image = css({
    height: "500px",
    width: "500px",
    "&:hover": {
        animation: `${scale} 1s ease`,
    },
});

document.getElementById("image").classList.add(image);
```

### createUni(config)

Use this function to generate a new instance of UniCSS if you need to provide your own theme.

```js
import {createUni} from "@unicss/core";

const {css, keyframes, globalCss} = createUni({
    theme: {
        colors: {
            primary: colors.mint["500"],
            secondary: colors.blue["500"],
        },
    },
    // ...other configuration
});
```

### classNames(obj)

A tiny utility for conditionally joining class names.

```js
import {classNames} from "@unicss/core";

const names = classNames({
    "foo": true,
    "bar": trueCondition === true,
    "baz": null,
});
// names === "foo bar"
```


# License

[MIT License](https://github.com/jmjuanes/unicss/blob/main/LICENSE).
