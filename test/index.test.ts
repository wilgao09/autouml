import * as trav from "../src/debugging/ast";
import { mapFiles } from "../src/ast/helpers";
import * as util from "util";
import * as ts from "typescript";

const jestConsole = console;

beforeEach(() => {
    global.console = require("console");
});

afterEach(() => {
    global.console = jestConsole;
});

function inspect(a: any) {
    console.log(
        util.inspect(
            a,
            false,
            null
            // true /* enable colors */
        )
    );
}

describe("output investigation", () => {
    test("test file AST", () => {
        trav.readFile("./test/files/hw.ts");
    });

    test("scope mapping", () => {
        inspect(mapFiles(["./test/files/hw.ts"], {}));
    });
});
