import { FileMapper } from "../../src/ast/FileMapper";
import { autouml } from "../../typings/typings";
import { readFile } from "../../src/debugging/ast";

describe("index signature tests with simple", () => {
    let mapper = new FileMapper(
        ["./test/indexSignatureTest/simple.ts"],
        {}
    );
    let [scopes, conns] = mapper.mapFiles();

    test("the compiler API can see index signature attributes", () => {
        let out = readFile(
            "./test/indexSignatureTest/simple.ts"
        );
        console.log(out);
    });
    test("check that it is in the AST", () => {
        // program sees one file
        expect(scopes.children.length).toBe(1);
        // that one file has one interface
        expect(scopes.children[0].children.length).toBe(1);
        // that interface is an interface

        expect(
            scopes.children[0].children[0].scopeType
        ).toBe(autouml.mapping.ScopeType.INTERFACE);
        let inter = scopes.children[0]
            .children[0] as autouml.mapping.IInterfaceScope;
        // that the interface has the right name
        expect(inter.name).toBe("A");
        // and that the scope data is not empty
        expect(inter.interfaceData.length).toBe(1);
    });

    test("check that the index signature is correctly described", () => {
        let indexSig = (
            scopes.children[0]
                .children[0] as autouml.mapping.IInterfaceScope
        ).interfaceData[0];

        expect(indexSig.name).toBe("[att:string]");
        expect(indexSig.type.name).toBe("number");
    });
});
