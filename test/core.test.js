import {create, merge, classNames} from "@unicss/core";

describe("[core] create", () => {
    it("should create a new instance of uniCSS", () => {
        const uni = create({});

        expect(uni.css).toBeDefined();
        expect(uni.extractCss).toBeDefined();
    });

    it("(extractCss) should return the saved styles", () => {
        const uni = create({});

        expect(uni.extractCss()).toBe("");
    });

    it("(css) should return a valid classname", () => {
        const uni = create({});

        const css1 = uni.css({});
        const css2 = uni.css({
            color: "white",
        });
        const css3 = uni.css({
            color: "blue",
            variants: {
                variant1: {
                    color: "red",
                },
            },
        });

        expect(css1()).toBe("uni-1529383744");
        expect(css2()).not.toBe("");
        expect(css3()).not.toBe("");
        expect(css3("variant1")).not.toBe(css3());

        const outputCss = uni.extractCss();

        expect(outputCss).not.toBe("");
        expect(outputCss).toEqual(expect.stringContaining("{color:white;}"));
        expect(outputCss).toEqual(expect.stringContaining("{color:blue;}"));
        expect(outputCss).toEqual(expect.stringContaining("{color:red;}"));
    });

    it("(css) should allow to provide custom properties", () => {
        const uni = create({
            properties: {
                size: value => ({
                    height: value,
                    width: value,
                }),
            },
        });
        const element = uni.css({
            size: "1px",
        });
        const name = element();
        const styles = uni.extractCss();

        expect(styles).toEqual(expect.stringContaining(`.${name} {height:1px;width:1px;}`));
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
