/**
 * Other tests
 * This file will frequently be edited to add mroe tests and to separate tests out into other files
 */

import "jest";
import * as typecheck from "../src/typecheck";

describe("typechecking functions", () => {
    test("a watch target is a watch target", () => {
        let wt = {
            target: { k: 8 },
            name: "foo",
        };
        expect(typecheck.isWatchTarget(wt)).toBe(true);
    });

    test("a watch target with many is not a watch target", () => {
        let wt = {
            target: { k: 8 },
            name: "foo",
            baz: "kekw",
        };
        expect(typecheck.isWatchTarget(wt)).toBe(false);
    });

    test("a watch target without a field is not a watch target", () => {
        let wt = {
            target: { k: 8 },
            baz: "kekw",
        };
        expect(typecheck.isWatchTarget(wt)).toBe(false);
    });
    //TODO: this test might change
    test("the types in a watch target are consistent (target)", () => {
        let wt = {
            target: "h",
            name: "kekw",
        };
        expect(typecheck.isWatchTarget(wt)).toBe(false);
    });
    test("the types in a watch target are consistent (name)", () => {
        let wt = {
            target: { k: 8 },
            name: { k: 8 },
        };
        expect(typecheck.isWatchTarget(wt)).toBe(false);
    });
});
