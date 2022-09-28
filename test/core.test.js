import {
    createUni,
    merge,
    classNames,
} from "@unicss/core";

describe("[core] create", () => {
    it("should create a new instance of uniCSS", () => {
        const theme = {
            scales: {
                colors: {
                    white: "#fff",
                },
            },
            aliases: {},
        };
        const uni = createUni(theme);

        expect(uni.css).toBeDefined();
        expect(uni.globalCss).toBeDefined();
        expect(uni.keyframes).toBeDefined();
        expect(uni.extractCss).toBeDefined();
        expect(uni.theme).toBe(theme);
    });

    it("(extractCss) should return the saved styles", () => {
        const uni = createUni({});

        expect(uni.extractCss()).toBe("");
    });

    it("(css) should return a valid classname", () => {
        const uni = createUni({});
        const element1 = uni.css({});
        const element2 = uni.css({
            color: "white",
        });
        const styles = uni.extractCss();

        expect(element1).toBe("uni-1529383744");
        expect(element2).not.toBe("");
        expect(styles).not.toBe("");
        expect(styles).toEqual(expect.stringContaining("{color:white;}"));
    });

    it("(css) should allow to provide custom aliases", () => {
        const uni = createUni({
            aliases: {
                size: ["height", "width"],
            },
        });
        const element = uni.css({
            size: "1px",
        });
        const styles = uni.extractCss();

        expect(styles).toEqual(expect.stringContaining(`.${element} {height:1px;width:1px;}`));
    });

    it("(css) should use theme scales", () => {
        const uni = createUni({
            scales: {
                colors: {
                    primary: "blue",
                    secondary: "red",
                },
                sizes: {
                    none: "0px",
                },
            },
        });
        const element = uni.css({
            borderColor: "$secondary",
            color: "$primary !important",
            width: "$none",
        });
        const styles = uni.extractCss();

        expect(styles).toEqual(expect.stringContaining(`.${element} {border-color:red;color:blue !important;width:0px;}`));
    });

    it("(css) should apply mixins", () => {
        const uni = createUni({
            mixins: {
                test1: {
                    applied1: "test1",
                    margin: "1px",
                },
                test2: {
                    applied2: "test2",
                    margin: "2px",
                },
            },
        });
        const element = uni.css({
            apply: ["test1", "test2"],
            margin: "0px",
        });
        const styles = uni.extractCss();

        expect(element).not.toBe("");
        expect(styles).toEqual(expect.stringContaining("{margin:2px;applied1:test1;applied2:test2;}"));
    });

    it("(keyframes) should parse and generate keyframes", () => {
        const uni = createUni({});
        const name = uni.keyframes({
            from: {opacity: 0},
            to: {opacity: 1},
        });
        const styles = uni.extractCss();

        expect(name).not.toBe("");
        expect(styles).toEqual(expect.stringContaining(`@keyframes ${name} {from {opacity:0;} to {opacity:1;}}`));
    });

    it("(globalCss) should generate global styles", () => {
        const uni = createUni({});
        uni.globalCss({
            "html": {
                backgroundColor: "white",
            },
            "@keyframes test-anim": {
                from: {left: "0px"},
                to: {left: "100px"},
            },
            "@import": [
                "source1",
                "source2",
            ],
            "@fontFace": [
                {src: "source-font1"},
                {src: "source-font2"},
            ],
        });
        const styles = uni.extractCss();

        // expect(name).toBe("");
        expect(styles).toEqual(expect.stringContaining("html {background-color:white;}"));
        expect(styles).toEqual(expect.stringContaining("@keyframes test-anim"));
        expect(styles).toEqual(expect.stringContaining("@import source1;"));
        expect(styles).toEqual(expect.stringContaining("@import source2;"));
        expect(styles).toEqual(expect.stringContaining("@font-face {src:source-font1;}"));
        expect(styles).toEqual(expect.stringContaining("@font-face {src:source-font2;}"));
    });
});

describe("[core] merge", () => {
    it("should merge two style objects", () => {
        const styles1 = {
            color: "white",
            margin: "0px",
            "&:hover": {
                color: "white",
                padding: "0px",
            },
        };
        const styles2 = {
            color: "red",
            "&:hover": {
                color: "red",
            },
        };
        const styles3 = merge(styles1, styles2);

        expect(styles3.color).toBe("red");
        expect(styles3.margin).toBe("0px");
        expect(styles3["&:hover"].color).toBe("red");
        expect(styles3["&:hover"].padding).toBe("0px");

        // Check if styles1 is not changed
        expect(styles1.color).toBe("white");
        expect(styles1["&:hover"].color).toBe("white");
    });
});

describe("[core] classNames", () => {
    it("should join arguments into a single string", () => {
        const className = classNames("foo", "bar", "baz");
        expect(className).toBe("foo bar baz");
    });

    it("should add only classes with a truthly value in an object", () => {
        const className = classNames({
            foo: true,
            bar: false,
            baz: true,
        });
        expect(className).toBe("foo baz");
    });

    it("should join all elements in an array", () => {
        const className = classNames(["foo", "bar"], "baz");
        expect(className).toBe("foo bar baz");
    });
});
