import ts from "typescript";
import { autouml } from "../../typings";
import { FileMapper } from "./FileMapper";
import { readFileSync } from "fs";
import * as util from "util";
import * as path from "path";

let KIND_TO_SCOPE_TYPE = new Map<
    ts.SyntaxKind,
    autouml.mapping.ScopeType
>();

KIND_TO_SCOPE_TYPE.set(
    ts.SyntaxKind.ModuleDeclaration,
    autouml.mapping.ScopeType.NAMESPACE
);

KIND_TO_SCOPE_TYPE.set(
    ts.SyntaxKind.EnumDeclaration,
    autouml.mapping.ScopeType.ENUM
);

KIND_TO_SCOPE_TYPE.set(
    ts.SyntaxKind.InterfaceDeclaration,
    autouml.mapping.ScopeType.INTERFACE
);

KIND_TO_SCOPE_TYPE.set(
    ts.SyntaxKind.ClassDeclaration,
    autouml.mapping.ScopeType.CLASS
);

function kindToScope(
    k: ts.SyntaxKind
): autouml.mapping.ScopeType {
    return (
        KIND_TO_SCOPE_TYPE.get(k) ??
        autouml.mapping.ScopeType.PROGRAM
    );
}

function makeScope(
    mapper: FileMapper,
    node: ts.Node,
    mapNode: (_: ts.Node) => unknown
) {
    node.forEachChild((cn) => {
        if (cn.kind === ts.SyntaxKind.Identifier) {
            // add to mapper
            mapper.startScope(
                cn.getText(),
                kindToScope(node.kind)
            );
        }
    });
    ts.forEachChild(node, mapNode);
    mapper.endScope();
}

function modifierlistToModifierSet(
    modifiersList?: ts.NodeArray<ts.ModifierLike>
): Set<autouml.mapping.AccessModifier> {
    let tor = new Set<autouml.mapping.AccessModifier>();
    tor.add(autouml.mapping.AccessModifier.PUBLIC);
    if (modifiersList == undefined) return tor;
    modifiersList.forEach((mod) => {
        switch (mod.kind) {
            case ts.SyntaxKind.PrivateKeyword:
                tor.add(
                    autouml.mapping.AccessModifier.PRIVATE
                );
                tor.delete(
                    autouml.mapping.AccessModifier.PUBLIC
                );
                break;
            case ts.SyntaxKind.ProtectedKeyword:
                tor.add(
                    autouml.mapping.AccessModifier.PROTECTED
                );
                break;
            // default:
            //     if (
            //         !tor.has(
            //             autouml.mapping.AccessModifier
            //                 .PRIVATE
            //         )
            //     ) {
            //         tor.add(
            //             autouml.mapping.AccessModifier
            //                 .PUBLIC
            //         );
            //     }

            //     break;
        }
    });

    return tor;
}

function mapFiles(
    files: string[],
    options: ts.CompilerOptions
): autouml.mapping.IScope {
    let mapper = new FileMapper();
    let program = ts.createProgram(files, options);
    let checker = program.getTypeChecker();
    let fileMap = new Map<string, boolean>();
    for (let f of files) {
        fileMap.set(path.resolve(f), true);
    }
    program.getSourceFiles().forEach((sourceFile) => {
        // let sourceFile = ts.createSourceFile(
        //     fileName,
        //     readFileSync(fileName).toString(),
        //     ts.ScriptTarget.ES2015,
        //     true
        // );
        let fname = path.resolve(sourceFile.fileName);
        if (fileMap.get(fname)) {
            mapper.startScope(
                fname,
                autouml.mapping.ScopeType.FILE
            );
            mapNode(sourceFile);
        }
    });
    function mapNode(node: ts.Node) {
        switch (node.kind) {
            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.ClassDeclaration:
                return makeScope(mapper, node, mapNode);
            /**
             * NON scope starting constructs
             */
            case ts.SyntaxKind.EnumMember: {
                node.forEachChild((cn) => {
                    if (
                        cn.kind === ts.SyntaxKind.Identifier
                    ) {
                        mapper.addEnumMember(cn.getText());
                    }
                });
                break;
            }

            case ts.SyntaxKind.PropertySignature: {
                // for interfaces at least
                // 0th child is id
                // 2th child is the type, which can be a lot of things
                // TODO: see if theres a way to do this more safely
                mapper.addPropertySignature(
                    node.getChildAt(0).getText(),
                    checker.typeToString(
                        checker.getTypeAtLocation(node)
                    )
                );
                //find symbol

                // let s = checker
                //     .getTypeAtLocation(node)
                //     .getSymbol();
                // if (s) {
                //     console.log(
                //         // checker.typeToString(
                //         checker.getTypeAtLocation(node).
                //         // )
                //         // checker.getTypeOfSymbolAtLocation(
                //         //     s,
                //         //     node
                //         // )
                //         // getTypeName(
                //         // checker.getFullyQualifiedName(s)
                //         // )

                //         // checker.getSymbolAtLocation(n)
                //     );
                // }

                break;
            }

            case ts.SyntaxKind.PropertyDeclaration: {
                if (ts.isPropertyDeclaration(node)) {
                    mapper.addPropertyDeclaration(
                        node.getChildAt(0).getText(),
                        modifierlistToModifierSet(
                            node.modifiers
                        ),
                        checker.typeToString(
                            checker.getTypeAtLocation(node)
                        )
                    );
                }
            }
        }
        ts.forEachChild(node, mapNode);
    }

    return mapper.getMapping();
}

export { mapFiles };
