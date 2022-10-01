// Default theme scales mapping
export const defaultThemeMappings = {
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
    bottom: "space",
    boxShadow: "shadows",
    color: "colors",
    fill: "colors",
    fontFamily: "fonts",
    fontSize: "fontSizes",
    fontWeight: "fontWeights",
    height: "sizes",
    left: "space",
    lineHeight: "lineHeights",
    margin: "space",
    marginBottom: "space",
    marginLeft: "space",
    marginRight: "space",
    marginTop: "space",
    maxHeight: "sizes",
    maxWidth: "sizes",
    minHeight: "sizes",
    minWidth: "sizes",
    opacity: "opacities",
    padding: "space",
    paddingBottom: "space",
    paddingLeft: "space",
    paddingRight: "space",
    paddingTop: "space",
    right: "space",
    textShadow: "shadows",
    top: "space",
    width: "sizes",
};

// Default theme aliases
export const defaultThemeAliases = {
    h: "height",
    p: "padding",
    m: "margin",
    size: ["height", "width"],
    w: "width",
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
const parseProp = (prop, theme) => {
    // let propsToParse = [prop];
    if (theme?.aliases?.[prop]) {
        return [theme.aliases[prop]].flat();
    }
    // Parse props
    // return propsToParse.map(item => item.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`));
    return [prop];
};

// Parse CSS value
const parseValue = (prop, value, theme, vars) => {
    let isImportant = false;
    if (typeof value === "string") {
        if (defaultThemeMappings[prop] && value.indexOf("$") === -1) {
            const scaleName = defaultThemeMappings[prop];
            const scale = theme?.scales?.[scaleName];
            value = value.replace(/\s*!important/, () => {
                isImportant = true;
                return "";
            });
            if (scale && typeof scale === "object" && typeof scale[value] !== "undefined") {
                value = scale[value].toString();
            }
        }
        // Replace all variables
        value = value.replace(/\$(\w+)/g, (match, key) => {
            return typeof vars?.[key] !== "undefined" ? vars[key] : match;
        });
    }
    return isImportant ? value + "!important" : value;
};

// Parse mixins
const parseMixins = (styles, theme, prev) => {
    prev = prev || new Set();
    if (theme?.mixins && styles?.apply && (typeof styles.apply === "string" || Array.isArray(styles.apply))) {
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
                    ...parseMixins(get(theme?.mixins || {}, mixinName), theme, prev),
                };
            }),
        };
    }
    // No mixins to apply
    return styles || {};
};

// Transform a selector rule
const transformSelector = (selector, styles, theme, globals) => {
    if (styles && Array.isArray(styles)) {
        return styles.map(s => transformSelector(selector, s, theme, globals)).flat();
    }
    const result = [""];
    const vars = {...globals};
    const parsedStyles = parseMixins(styles, theme);
    Object.keys(parsedStyles)
        .filter(key => {
            // Check to override a global variable or set a new variable
            if (key.startsWith("$")) {
                vars[key.replace("$", "")] = parsedStyles[key];
                return false; // skip this
            }
            // Skip content in the 'variants' key: reserved only to register variants
            // Skip content in the 'apply' key: reserved only to mixins
            // Skip null values
            return key !== "variants" && key !== "apply" && parsedStyles[key] !== null;
        })
        .forEach(key => {
            const value = parsedStyles[key];
            // Nested styles or @media rules 
            if (typeof value === "object") {
                // Media rules styles should be wrapped into a new rule
                if (/^@/.test(key)) {
                    return result.push(
                        wrapRule(key, transformSelector(selector, value, theme, vars), "\n"),
                    );
                }
                // Add nested styles
                // We should replace the & with the current selector
                return result.push(
                    transformSelector(key.replaceAll("&", selector), value, theme, vars),
                );
            }
            // Just parse as a simple property
            parseProp(key, theme).forEach(prop => {
                const p = prop.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
                result[0] = result[0] + `${p}:${parseValue(prop, value, theme, vars)};`;
            });
        });
    // result[0] contains the styles for the current selector, and should be wrapped into {}
    result[0] = wrapRule(selector, result[0], "");
    return result.flat(2);
};

// Transform a styles object to string
export const transform = (styles, theme) => {
    const globals = {
        ...(theme?.globals || {}),
    };
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
                return transformSelector("@font-face", value, theme, globals);
            }
            // if (/^@(media|keyframes)/.test(key.trim())) {
            else {
                // Other rule (for example @media or @keyframes)
                const rules = Object.keys(value).map(k => {
                    return transformSelector(k, value[k], theme, globals);
                });
                return wrapRule(key, rules.join(" "));
            }
        }
        // Other value --> parse as regular classname
        return transformSelector(key, value, theme, globals);
    });
    return result.flat().join("\n");
};

export const createCache = options => {
    const key = options?.key || "css";
    const inserted = new Set(); 
    let target = {
        innerHTML: "",
    };
    // Check if we are in a DOM env: get target from existing <style> tag
    // Or create a new target tag
    if (typeof document !== "undefined") {
        target = document.querySelector(`[data-source="uni/${key}"`);
        if (!target) {
            target = document.createElement("style");
            target.dataset.source = `uni/${key}`;
            target.innerHTML = "";
            document.head.appendChild(target);
        }
    }
    // Initialize cache with the initial values in target
    if (target.innerHTML) {
        const regex = /::(uni\-[\w]+)::/gm;
        [...target.innerHTML.matchAll(regex)].forEach(match => {
            inserted.add(match[1]);
        });
    }
    // Generate new cache and return it
    const cache = {
        key,
        insert: (styles, sep = "\n") => {
            const hash = hashCode(styles);
            if (!inserted.has(hash)) {
                const header = `/* ::{hash}:: */`;
                const body = styles.replaceAll("__uni__", hash);
                target.innerHTML = target.innerHTML + header + sep + body + sep;
                inserted.add(hash);
            }
            return hash;
        },
        clear: () => {
            target.innerHTML = "";
            inserted.clear();
        },
        inserted,
        target,
    };
    return cache;
};

// Create a new instance of UniCSS
export const createUni = (theme, initialCache = null) => {
    const cache = initialCache || createCache({
        key: theme?.key || "css",
    });

    return {
        css: s => cache.insert(transform({".__uni__": s}, theme)),
        globalCss: s => cache.insert(transform(s, theme)),
        keyframes: s => cache.insert(transform({"@keyframes __uni__": s}, theme)),
        extractCss: () => cache.target?.innerHTML || "",
        theme: theme || {},
        cache,
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
