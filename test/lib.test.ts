/**
 * Reader tests
 * These tests generally unit test src/index.ts
 */

import "jest";
import * as readers from "../src/index";

test("correctly sorts an object", () => {
    let reader = new readers.AutoUML();
    let testobj = {
        target: {
            k: 8,
        },
        name: "frr",
    };
    let res = reader.add(testobj);
    expect(res).toBe(true);
    expect(reader.watchObjects[0]).toBe(testobj);
});

test("correctly sorts a constructor", () => {
    let reader = new readers.AutoUML();

    let res = reader.add(Array);
    expect(res).toBe(true);
    expect(reader.watchConstructors[0]).toBe(Array);
});

// typescript is so good
// test("correctly discards a nonfunction, nonobject", () => {
//     let reader = new readers.AutoUML()
//     let res = reader.add(7)
// });
