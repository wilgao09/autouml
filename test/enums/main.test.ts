import { FileMapper } from "../../src/ast/FileMapper";
import { autouml } from "../../typings/typings";
import * as util from "node:util";
import * as path from "path";

describe("enums are represented properly", () => {
    test("enums are represented", () => {
        let mapper = new FileMapper(
            {
                options: {},
                fileNames: ["./test/enums/simple.ts"],
                errors: [],
            },
            {
                baseDir: "./test/enums",
                tsconfigFileName: "tsconfig.json",
                outPath: "./test/enums",
                target: autouml.codegen.Target.d2,
                verbose: false,
                debugASTPath: "./test/enums/debug.ast",
            }
        );
        let [scopes, conns] = mapper.mapFiles();
        // we expect to find an enum here
        let e = scopes.children[0].children[0];
        expect(e).not.toBeUndefined();
        expect(e).toMatchObject({
            scopeType: autouml.mapping.ScopeType.ENUM,
            name: "E",
            children: [],
            // parent:
            enumData: ["A", "B", "C", "D"],
        });
    });
    test("enums are treated as nonprimitives", () => {
        let mapper = new FileMapper(
            {
                options: {},
                fileNames: ["./test/enums/simple.ts"],
                errors: [],
            },
            {
                baseDir: "./test/enums",
                tsconfigFileName: "tsconfig.json",
                outPath: "./test/enums",
                target: autouml.codegen.Target.d2,
                verbose: false,
                debugASTPath: "./test/enums/debug.ast",
            }
        );
        let [scopes, conns] = mapper.mapFiles();
        expect(conns).toEqual(
            expect.arrayContaining([
                expect.objectContaining<autouml.mapping.IConnector>(
                    {
                        src: {
                            name: "L",
                            isPrimitive: false,
                            typeParameters: [],
                            typeLocation: {
                                fileName: "simple.ts",
                                duplicatedIn: ["simple.ts"],
                                namespaceNest: ["L"],
                            },
                        },
                        type: autouml.mapping.ConnectorType
                            .AGGREGATES,
                        dst: {
                            name: "E",
                            isPrimitive: false,
                            typeParameters: [],
                            typeLocation: {
                                fileName: "simple.ts",
                                duplicatedIn: ["simple.ts"],
                                namespaceNest: ["E"],
                            },
                        },
                    }
                ),
            ])
        );
    });
});
