import {classNames, merge} from "../packages/unicss/index.js";

describe("classNames", () => {
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

describe("merge", () => {
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
