// Default theme scales mapping
export const defaultThemeMap = {
    backgroundColor: "colors",
    borderColor: "colors",
    borderBottomColor: "colors",
    borderLeftColor: "colors",
    borderRightColor: "colors",
    borderTopColor: "colors",
    borderRadius: "radius",
    borderBottomLeftRadius: "radius",
    borderBottomRightRadius: "radius",
    borderTopLeftRadius: "radius",
    borderTopRightRadius: "radius",
    borderWidth: "sizes",
    borderBottomWidth: "sizes",
    borderLeftWidth: "sizes",
    borderRightWidth: "sizes",
    borderTopWidth: "sizes",
    bottom: "spacing",
    boxShadow: "shadows",
    color: "colors",
    fill: "colors",
    fontFamily: "fonts",
    fontSize: "fontSizes",
    fontWeight: "fontWeights",
    height: "sizes",
    left: "spacing",
    lineHeight: "lineHeights",
    margin: "spacing",
    marginBottom: "spacing",
    marginLeft: "spacing",
    marginRight: "spacing",
    marginTop: "spacing",
    maxHeight: "sizes",
    maxWidth: "sizes",
    minHeight: "sizes",
    minWidth: "sizes",
    opacity: "opacities",
    padding: "spacing",
    paddingBottom: "spacing",
    paddingLeft: "spacing",
    paddingRight: "spacing",
    paddingTop: "spacing",
    right: "spacing",
    textShadow: "shadows",
    top: "spacing",
    width: "sizes",
};

const hashCode = str => {
    return "uni-" + Math.abs(Array.from(str).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0)).toString();
};

// Exclude a field from the specified object
const exclude = (obj, field) => {
    return Object.fromEntries(Object.entries(obj).filter(e => e[0] !== field));
};

// Tiny reducer alias
const toObject = (list, fn) => list.reduce(fn, {});

// Get value in object from path
export const get = (obj, path) => {
    return path.split(".").reduce((o, p) => o?.[p], obj);
};

// Merge CSS styles
export const merge = (source, target) => {
    source = {...source};
    Object.keys(target).forEach(key => {
        // Check for @font-face attribute
        if (key === "@font-face") {
            if (typeof source["@font-face"] !== "undefined") {
                source[key] = [source[key]].flat(1).concat(target[key]).flat(1);
                return;
            }
        }
        // Check for object property --> deep merge
        else if (typeof source[key] === "object" && typeof target[key] === "object") {
            source[key] = merge(source[key], target[key]);
            return;
        }
        // Other value --> override source property
        source[key] = target[key];
    });
    return source;
};

// Wrap CSS Rule
const wrapRule = (ruleName, ruleContent, separator) => {
    return `${ruleName} {${separator || ""}${ruleContent}${separator || ""}}`;
};

// Parse CSS property
const parseProp = (prop, value, config) => {
    let propsToParse = {
        [prop]: value,
    };
    // Check if custom properties object has been provided
    if (typeof config?.properties?.[prop] === "function") {
        const newProps = config.properties[prop](value);
        if (newProps && typeof newProps === "object") {
            propsToParse = newProps;
        }
    }
    // Parse props
    return Object.keys(propsToParse).map(item => ([
        item.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`),
        propsToParse[item],
    ]));
};

// Parse CSS value
const parseValue = (prop, value, config) => {
    if (typeof value === "string" && value.indexOf("$") > -1 && defaultThemeMap[prop]) {
        const scaleName = defaultThemeMap[prop];
        const scale = config?.theme?.[scaleName];

        if (scale && typeof scale === "object") {
            return value.replace(/\$([^\s]+)/g, (match, key) => {
                return typeof scale[key] !== "undefined" ? scale[key].toString() : match;
            });
        }
    }
    return value;
};

// Parse mixins
const parseMixins = (styles, config, prev) => {
    prev = prev || new Set();
    if (config?.mixins && styles?.apply && (typeof styles.apply === "string" || Array.isArray(styles.apply))) {
        const mixinsList = [styles.apply].flat().filter(n => {
            return n && typeof n === "string";
        });
        return {
            ...exclude(styles, "apply"),
            ...toObject(mixinsList, (newStyles, mixinName) => {
                if (prev.has(mixinName)) {
                    return newStyles;
                }
                // Apply styles from this mixin
                prev.add(mixinName);
                return {
                    ...newStyles,
                    ...parseMixins(get(config?.mixins || {}, mixinName), config, prev),
                };
            }),
        };
    }
    // No mixins to apply
    return styles || {};
};

// Transform a selector rule
const transformSelector = (selector, styles, config) => {
    if (styles && Array.isArray(styles)) {
        return styles.map(s => transformSelector(selector, s, config)).flat();
    }
    const result = [""];
    Object.entries(parseMixins(styles, config)).forEach(([key, value]) => {
        // skip content in the 'variants' key: reserved only to register variants
        // Skip content in the 'apply' key: reserved only to mixins
        if (key === "variants" || key === "apply" || value === null) {
            return;
        }
        // Nested styles or @media rules 
        if (typeof value === "object") {
            // Media rules styles should be wrapped into a new rule
            if (/^@/.test(key)) {
                return result.push(
                    wrapRule(key, transformSelector(selector, value, config), "\n"),
                );
            }
            // Add nested styles
            // We should replace the & with the current selector
            return result.push(
                transformSelector(key.replaceAll("&", selector), value, config),
            );
        }
        // Just parse as a simple property
        parseProp(key, value, config).forEach(([prop, value]) => {
            result[0] = result[0] + `${prop}:${parseValue(prop, value, config)};`;
        });
    });
    // result[0] contains the styles for the current selector, and should be wrapped into {}
    result[0] = wrapRule(selector, result[0], "");
    return result.flat(2);
};

// Transform a styles object to string
export const transform = (styles, config) => {
    const result = Object.entries(styles || {}).map(([key, value]) => {
        // Check for at rule
        if (key.startsWith("@")) {
            // Check for @import rule, just add one @import for each source
            // value must be a string or an array of strings
            if (key === "@import") {
                return [value].flat().map(v => `@import ${v};`);
            }
            // Check for @font-face rule
            else if (["@fontFace", "@fontface", "@font-face"].indexOf(key) > -1) {
                return transformSelector("@font-face", value, config);
            }
            // if (/^@(media|keyframes)/.test(key.trim())) {
            else {
                // Other rule (for example @media or @keyframes)
                const rules = Object.keys(value).map(k => {
                    return transformSelector(k, value[k], config);
                });
                return wrapRule(key, rules.join(" "));
            }
        }
        // Other value --> parse as regular classname
        return transformSelector(key, value, config);
    });
    return result.flat().join("\n");
};

const registerStyles = (hash, css, cache, target) => {
    if (!cache.has(hash)) {
        target.innerHTML = target.innerHTML + css.replaceAll("__uni__", hash) + "\n";
        cache.add(hash);
    }
    return hash;
};

const createTarget = key => {
    // Check if we are in a DOM env
    if (typeof document !== "undefined") {
        let target = document.querySelector(`[data-source="uni/${key}"`);
        if (!target) {
            target = document.createElement("style");
            target.dataset.source = `uni/${key}`;
            target.innerHTML = "";
            document.head.appendChild(target);
        }
        return target;
    }
    // Other case: we are not in an env supporting DOM (maybe SSR)
    // return a fake <style> tag
    return {
        innerHTML: "",
    };
};

// Create a new instance of UniCSS
export const createUni = config => {
    const cache = new Set();
    config = config || {};
    config.target = config.target || createTarget("css");

    // Register css styles
    const css = s => {
        const styles = transformSelector(".__uni__", s, config).join("\n"); 
        const hash = hashCode(styles);
        return registerStyles(hash, styles, cache, config.target);
    };

    // Generate a keyframes styles
    const keyframes = s => {
        const styles = wrapRule(
            "@keyframes __uni__",
            Object.keys(s).map(k => transformSelector(k, s[k], config)).join(" "),
        );
        const hash = hashCode(styles);
        return registerStyles(hash, styles, cache, config.target);
    };

    // Generate global styles
    const globalCss = s => {
        const styles = transform(s, config);
        const hash = hashCode(styles);
        return registerStyles(hash, styles, cache, config.target);
    };

    return {
        css,
        globalCss,
        keyframes,
        extractCss: () => config.target?.innerHTML || "",
        theme: config?.theme || {},
        target: config?.target,
    };
};

// Cached instance
let cachedInstance = null;
const getCachedInstance = () => {
    return cachedInstance || (cachedInstance = createUni({}));
};

export const css = s => getCachedInstance().css(s);
export const globalCss = s => getCachedInstance().globalCss(s);
export const keyframes = s => getCachedInstance().keyframes(s);
export const extractCss = () => getCachedInstance().extractCss();

// Tiny utility for conditionally joining classNames
export const classNames = (...args) => {
    return (args || []).map(items => {
        if (typeof items === "string") {
            return items.split(" ").filter(item => item.length);
        }
        else if (Array.isArray(items)) {
            return items.filter(item => typeof item === "string" && item.length); 
        }
        else if (typeof items === "object") {
            return Object.keys(items || {}).filter(key => !!items[key]);
        }
        return [];
    }).flat().join(" ");
};
