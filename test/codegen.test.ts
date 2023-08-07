import * as trav from "../src/index";
import { mapFiles } from "../src/ast/helpers";
import d2Codegen from "../src/d2/codegen";
import * as util from "util";
import * as ts from "typescript";

const jestConsole = console;

beforeEach(() => {
    global.console = require("console");
});

afterEach(() => {
    global.console = jestConsole;
});

describe("codegen tests", () => {
    test("it doesnt crash", () => {
        let d2gen = new d2Codegen();
        let map = mapFiles(["./test/files/hw.ts"], {});

        console.log(d2gen.visit(map));
    });
});
