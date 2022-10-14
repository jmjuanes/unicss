import {configure, css, globalCss, keyframes, extractCss} from "../index.js";

configure({
    key: "test/css",
    theme: {
        colors: {
            primary: "__primary",
            secondary: "__secondary",
        },
    },
});

describe("extractCss", () => {
    it("should return the saved styles", () => {
        expect(extractCss()).toBe("");
    });
});

describe("css", () => {
    it("should return a valid classname", () => {
        const element1 = css({});
        const element2 = css({
            color: "white",
        });

        expect(element1).toBe("uni-0");
        expect(extractCss()).toEqual(expect.stringContaining(`.${element2} {color: white;}`));
    });

    it("should apply theme", () => {
        const element = css({
            borderColor: t => t.colors.secondary,
            color: t => `${t.colors.primary}!important`,
        });

        expect(extractCss()).toEqual(
            expect.stringContaining(`.${element} {border-color: __secondary; color: __primary !important;}`),
        );
    });
});

describe("keyframes", () => {
    it("(keyframes) should parse and generate keyframes", () => {
        const name = keyframes({
            from: {opacity: 0},
            to: {opacity: 1},
        });

        expect(name).not.toBe("");
        expect(extractCss()).toEqual(expect.stringContaining(`@keyframes ${name}`));
    });
});

describe("globalCss", () => {
    it("should generate global styles", () => {
        globalCss({
            "html": {
                backgroundColor: "white",
            },
            "@keyframes test-anim": {
                from: {left: "0px"},
                to: {left: "100px"},
            },
            "@fontFace": [
                {src: "source-font1"},
                {src: "source-font2"},
            ],
        });
    
        const styles = extractCss();

        expect(styles).toEqual(expect.stringContaining("html {background-color: white;}"));
        expect(styles).toEqual(expect.stringContaining("@keyframes test-anim"));
        expect(styles).toEqual(expect.stringContaining("@font-face {src: source-font1;}"));
        expect(styles).toEqual(expect.stringContaining("@font-face {src: source-font2;}"));
    });
});
