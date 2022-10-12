# gatsby-plugin-unicss

A Gatsby plugin for using UniCSS with Gatsby. 

## Installation

Add this package to your project using **npm** or **yarn**:

```bash
$ yarn add gatsby-plugin-unicss unicss
```

## Usage

First, add this plugin to your `gatsby-config.js`:

```js
// gatsby-config.js
module.exports = {
    plugins: [
        "gatsby-plugin-unicss",
        // ...other plugins
    ],
};
```

Then, override the default theme with your own theme for UniCSS, using [Gatsby Sadowing](https://www.gatsbyjs.com/docs/how-to/plugins-and-themes/shadowing/):

```js
// ./src/gatsby-plugin-unicss/theme.js
export default {
    colors: {
        primary: "#2171d1",
    },
    // ...other theme configuration
};
```

## License

[MIT License](https://github.com/jmjuanes/unicss/blob/main/LICENSE).
