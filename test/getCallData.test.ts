import { mapFiles } from "../src/ast/helpers";
import d2Codegen from "../src/d2/codegen";
import * as path from "path";
import * as util from "util";
import * as ts from "typescript";
import * as trav from "../src/debugging/ast";
import { autouml } from "../typings/typings";
import { FileMapper } from "../src/ast/FileMapper";

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

describe("get call data", () => {
    test("print calling data", () => {
        let mapper = new FileMapper([
            "./test/files/call.ts",
        ]);
        let [map, relations] = mapper.mapFiles();
        console.log("======");
        trav.readFile("./test/files/call.ts");
        console.log("======");
        inspect(map);
        console.log("======");
    });
});
