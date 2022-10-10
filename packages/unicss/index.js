const isBrowser = typeof window !== "undefined";
const unitlessProperties = {
    animationIterationCount: true,
    flex: true,
    flexGrow: true,
    flexOrder: true,
    flexShrink: true,
    fontWeight: true,
    gridRow: true,
    gridColumn: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    widows: true,
    zIndex: true,
    zoom: true,
};

export const hashify = (str, prefix = "uni-") => {
    return prefix + Math.abs(Array.from(str).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0)).toString();
};

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
    if (typeof value === "string") {
        return value.replace(/\$([\w\.]+)/g, (match, key) => {
            // Check for a local variable
            if (typeof vars[key] !== "undefined") {
                return vars[key];
            }
            // Check for applying a token property (without naming)
            if (theme?.mapping?.[prop] && key.indexOf(".") === -1) {
                const tokenName = theme.mapping[prop];
                const token = theme?.[tokenName];
                if (token && typeof token === "object" && typeof token[key] !== "undefined") {
                    return token[key];
                }
            }
            // Check for getting a different token
            if (key.indexOf(".") > -1) {
                const newValue = get(theme || {}, key);
                if (typeof newValue !== "undefined") {
                    return newValue;
                }
            }
            // Other case: return the match without replacing
            // TODO: display a warning or error message
            return match;
        });
    }
    // Check for number and not unitless property
    // Automatically append 'px' to the value
    if (typeof value === "number" && !unitlessProperties[prop]) {
        return value.toString() + "px";
    }
    return value;
};

// Parse styles
const parseStyles = (initialStyles, theme) => {
    const media = theme?.media || {};
    return Object.keys(initialStyles).reduce((styles, key) => {
        if (key.startsWith("@")) {
            if (typeof initialStyles[key] === "object") {
                const rule = !!media[key.slice(1)] ? `@media ${media[key.slice(1)]}` : key;
                styles[rule] = merge(styles[rule] || {}, initialStyles[key] || {});
            }
            else if (key.indexOf(":") > -1){
                const [name, prop] = key.slice(1).split(":");
                if (media[name]) {
                    const rule = `@media ${media[name]}`;
                    styles[rule] = merge(styles[rule] || {}, { [prop]: initialStyles[key] });
                }
            }
        }
        else {
            styles[key] = initialStyles[key];
        }
        return styles;
    }, {});
};

// Transform a selector rule
const transformSelector = (selector, initialStyles, theme, vars) => {
    if (initialStyles && Array.isArray(initialStyles)) {
        return initialStyles.map(s => transformSelector(selector, s, theme, {...vars})).flat();
    }
    const result = [""];
    const styles = parseStyles(initialStyles || {}, theme);
    Object.keys(styles)
        .filter(key => {
            if (key.startsWith("$")) {
                vars[key.replace("$", "")] = styles[key];
                return false; // skip this
            }
            // Skip content in the 'variants' key: reserved only to register variants
            // Skip null values
            return key !== "variants" && styles[key] !== null;
        })
        .forEach(key => {
            const value = styles[key];
            // Nested styles or @media rules 
            if (typeof value === "object") {
                // Media rules styles should be wrapped into a new rule
                if (key.startsWith("@media")) {
                    return result.push(
                        wrapRule(key, transformSelector(selector, value, theme, {...vars}), ""),
                    );
                }
                // Add nested styles
                // We should replace the & with the current selector
                return result.push(
                    transformSelector(key.replaceAll("&", selector), value, theme, {...vars}),
                );
            }
            // Just parse as a simple property
            parseProp(key, theme).forEach(prop => {
                const p = prop.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
                result[0] = result[0] + `${p}:${parseValue(prop, value, theme, vars)};`;
            });
        });
    // result[0] contains the styles for the current selector, and should be wrapped into {}
    if (result[0].length > 0) {
        result[0] = wrapRule(selector, result[0], "");
    }
    return result.flat(2).filter(rule => !!rule);
};

// Transform a styles object to string
export const transform = (styles, theme) => {
    const result = Object.entries(styles || {}).map(([key, value]) => {
        if (key.startsWith("@")) {
            const atRule = theme?.media?.[key.slice(1)] ? `@media ${theme.media[key.slice(1)]}` : key;
            // Check for @import rule, just add one @import for each source
            // value must be a string or an array of strings
            if (atRule === "@import") {
                return [value].flat().map(v => `@import ${v};`);
            }
            // Check for @font-face rule (or alias)
            else if (atRule === "@font-face" || atRule === "@fontface" || atRule === "@fontFace") {
                return transformSelector("@font-face", value, theme, {});
            }
            // Other rule (for example @media or @keyframes)
            else if (atRule.startsWith("@media") || atRule.startsWith("@keyframes")) {
                const rules = Object.keys(value).map(k => {
                    return transformSelector(k, value[k], theme, {});
                });
                return wrapRule(atRule, rules.join(" "));
            }
        }
        // Other value --> parse as regular classname
        return transformSelector(key, value, theme, {});
    });
    return result.flat(2);
};

const createSheet = () => {
    let target = document.querySelector(`[data-source="unicss"`);
    if (!target) {
        target = document.createElement("style");
        target.dataset.source = "unicss";
        document.head.appendChild(target);
    }
    return target.sheet;
};

const createVirtualSheet = () => {
    const rules = [];
    return {
        type: "text/css",
        cssRules: rules,
        insertRule: css => rules.push({cssText: css}),
        ownerNode: null,
    };
};

// Create UniCSS instance
const create = options => {
    const context = {
        key: options?.key || "",
        theme: options.theme || {},
        pragma: options.pragma || null,
    };
    const inserted = new Set();
    const sheet = isBrowser ? createSheet() : createVirtualSheet();

    // Hydrate current sheet
    if (isBrowser && sheet.cssRules.length > 0) {
        for (let index = 0; index < sheet.cssRules.length; index++) {
            const {cssText} = sheet.cssRules[index];
            // Hydratable rules will start with a comment prefixes with 'uni-'
            // Skip other rules
            if (cssText && cssText.startsWith("--uni")) {
                const id = cssText.match(/--uni:\s*(uni\-[\w]+);/)?.[1];
                if (id && id.startsWith("uni")) {
                    inserted.add(id);
                }
            }
        }
    }

    const _css = (styles, isGlobal = false, isKeyframes = false) => {
        let rules = null;
        if (isGlobal) {
            rules = transform(styles, context.theme);
        }
        else if (isKeyframes) {
            rules = transform({"@keyframes __uni__": styles}, context.theme);
        }
        else {
            rules = transform({".__uni__": styles}, context.theme);
        }

        const hash = hashify(rules.join("\n"));
        if (!inserted.has(hash)) {
            sheet.insertRule(`--uni {--uni:'${hash}';}`, sheet.cssRules.length);
            rules.forEach(rule => {
                sheet.insertRule(rule.replaceAll("__uni__", hash), sheet.cssRules.length);
            });
            inserted.add(hash);
        }
        return hash;
    };

    const _createStyledElement = (type, initialCss) => {
        return props => {
            const {as, css: customCss, ...rest} = props;
            const className = _css({
                boxSizing: "border-box",
                minWidth: "0",
                ...initialCss,
                ...customCss,
            });
            const newProps = {
                ...rest,
                className: classNames(props?.className, className),
            };

            return context.pragma(as || type || "div", newProps);
        };
    };
    
    return {
        css: styles => _css(styles, false, false),
        globalCss: styles => _css(styles, true, false),
        keyframes: styles => _css(styles, false, true),
        styled: (type, styles) => _createStyledElement(type, styles),
        extractCss: () => sheet.cssRules.map(rule => rule.cssText).join("\n"),
        configure: newOptions => {
            context.theme = newOptions.theme || context.theme || {};
            context.pragma = newOptions.pragma || context.pragma || null;
        },
    };
};

export const {configure, extractCss, styled, css, globalCss, keyframes} = create({});
