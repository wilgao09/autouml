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

describe("get type data", () => {
    let mapper = new FileMapper([
        "./test/files/simple.d.ts",
    ]);
    let [map, relations] = mapper.mapFiles();
    test("ast has correct form", () => {
        expect(map.scopeType).toBe(
            autouml.mapping.ScopeType.PROGRAM
        );
        expect(map.children.length).toBe(1);
        expect(map.children[0].scopeType).toBe(
            autouml.mapping.ScopeType.FILE
        );
        expect(map.children[0].children.length).toBe(1);
        expect(map.children[0].children[0].scopeType).toBe(
            autouml.mapping.ScopeType.INTERFACE
        );
    });
    test("can get primitive", () => {
        let id = map.children[0]
            .children[0] as autouml.mapping.IInterfaceScope;
        expect(id.interfaceData[0].name).toBe("y");
        expect(id.interfaceData[0].type).toEqual({
            name: "number",
            isPrimitive: true,
            typeLocations: [],
        });
    });

    test("can get object", () => {
        let id = map.children[0]
            .children[0] as autouml.mapping.IInterfaceScope;
        expect(id.interfaceData[1].name).toBe("x");
        expect(id.interfaceData[1].type).toEqual({
            name: "X",
            isPrimitive: false,
            typeLocations: [
                {
                    fileName: path
                        .resolve("./test/files/simple.d.ts")
                        .replace(".d.ts", ""),
                    namespaceNest: ["X"],
                    duplicatedIn: [
                        path.resolve(
                            "./test/files/simple.d.ts"
                        ),
                    ],
                },
            ],
        });
    });
});

describe("get type data across files", () => {
    test("across a directory", () => {
        let mapper = new FileMapper([
            "./test/files/simple.d.ts",
        ]);
        let [map, relations] = mapper.mapFiles();
        // console.log("====");
        // inspect(map);
        // console.log("====");
    });
});

describe("get inheritance data", () => {
    test("print heritage clause data", () => {
        let mapper = new FileMapper([
            "./test/files/simple.d.ts",
        ]);
        let [map, relations] = mapper.mapFiles();
        console.log("====");
        trav.readFile("./test/files/classRelations.ts");
        console.log("====");
        inspect(map);
        console.log("====");
    });
});
