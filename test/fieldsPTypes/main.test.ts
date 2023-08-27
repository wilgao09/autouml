import { FileMapper } from "../../src/ast/FileMapper";
import { autouml } from "../../typings/typings";
import * as util from "node:util";
import * as path from "path";

describe("parameters are in all relevant data structures", () => {
    test("the created ast has them", () => {
        let mapper = new FileMapper([
            "./test/fieldsPTypes/simple.ts",
        ]);
        let [scopes, conns] = mapper.mapFiles();
        // console.log(
        //     util.inspect(scopes, {
        //         showHidden: false,
        //         depth: null,
        //         colors: false,
        //     })
        // );
        expect(conns).toEqual(
            expect.arrayContaining<autouml.mapping.IConnector>(
                [
                    expect.objectContaining<autouml.mapping.IConnector>(
                        {
                            src: {
                                name: "I1",
                                isPrimitive: false,
                                typeParameters: [],
                                typeLocation: {
                                    fileName: path.resolve(
                                        "./test/fieldsPTypes/simple.ts"
                                    ),
                                    duplicatedIn: [
                                        path.resolve(
                                            "./test/fieldsPTypes/simple.ts"
                                        ),
                                    ],
                                    namespaceNest: ["I1"],
                                },
                            },
                            type: autouml.mapping
                                .ConnectorType.AGGREGATES,
                            dst: {
                                name: "I2",
                                isPrimitive: false,
                                typeParameters: [],
                                typeLocation: {
                                    fileName: path.resolve(
                                        "./test/fieldsPTypes/simple.ts"
                                    ),
                                    duplicatedIn: [
                                        path.resolve(
                                            "./test/fieldsPTypes/simple.ts"
                                        ),
                                    ],
                                    namespaceNest: ["I2"],
                                },
                            },
                        }
                    ),
                ]
            )
        );
    });
});
