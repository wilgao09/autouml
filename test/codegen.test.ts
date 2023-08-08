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

// describe("codegen tests", () => {
//     test("it doesnt crash", () => {
//         let d2gen = new d2Codegen();
//         let map = mapFiles(, ["./test/files/hw.ts"], {});

//         // console.log(d2gen.visit(map));
//     });

//     test("it can handle many files", () => {
//         let d2gen = new d2Codegen();
//         let map = mapFiles(["./test/files/*.ts"], {});
//         // console.log("==========");
//         // console.log(d2gen.visit(map));
//         // console.log("==========");
//     });
// });
