import ts from "typescript";
import { autouml } from "../../typings/typings";
import { FileMapper } from "./FileMapper";
import { readFileSync } from "fs";
import * as util from "util";
import * as path from "path";
import { globSync } from "glob";

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

function paramDeclListToIParams(
    p: ts.NodeArray<ts.ParameterDeclaration>,
    checker: ts.TypeChecker
): autouml.mapping.IParam[] {
    let tor: autouml.mapping.IParam[] = [];
    tor = p.map((x): autouml.mapping.IParam => {
        let t: string = "any";
        let tt = x.type;
        if (tt) {
            t = checker.typeToString(
                checker.getTypeAtLocation(tt)
            );
        }

        return {
            name: x.name.getText(),
            type: t,
        };
    });
    return tor;
}

function mapFiles(
    inputPaths: string[],
    options: ts.CompilerOptions
): autouml.mapping.IScope {
    let fileMap = new Map<string, boolean>();
    let files: string[] = [];
    for (let p of inputPaths) {
        let fils = globSync(p, {
            ignore: "node_modules/**",
        });
        for (let f of fils) {
            files.push(f);
            fileMap.set(path.resolve(f), true);
        }
    }
    let mapper = new FileMapper(files);
    let program = ts.createProgram(files, options);
    let checker = program.getTypeChecker();

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
            mapper.endScope();
        }
    });
    function mapNode(node: ts.Node) {
        let identifierNode: ts.Identifier | undefined =
            undefined;
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
                for (let c of node.getChildren()) {
                    if (
                        c.kind === ts.SyntaxKind.Identifier
                    ) {
                        identifierNode = c as ts.Identifier;
                    }
                }
                // 0th child is id
                // 2th child is the type, which can be a lot of things
                // TODO: see if theres a way to do this more safely
                mapper.addPropertySignature(
                    identifierNode!.text,
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
                    for (let c of node.getChildren()) {
                        if (
                            c.kind ===
                            ts.SyntaxKind.Identifier
                        ) {
                            identifierNode =
                                c as ts.Identifier;
                        }
                    }
                    mapper.addPropertyDeclaration(
                        identifierNode!.text,
                        modifierlistToModifierSet(
                            node.modifiers
                        ),
                        checker.typeToString(
                            checker.getTypeAtLocation(node)
                        )
                    );
                }
            }

            case ts.SyntaxKind.Constructor: {
                if (ts.isConstructorDeclaration(node)) {
                    let signature =
                        checker.getSignatureFromDeclaration(
                            node
                        )!;
                    mapper.addMethod(
                        "constructor",
                        modifierlistToModifierSet(
                            node.modifiers
                        ),
                        checker.typeToString(
                            checker.getReturnTypeOfSignature(
                                signature
                            )
                        ),
                        paramDeclListToIParams(
                            node.parameters,
                            checker
                        ),
                        true
                    );
                    return;
                }
                break;
            }
            case ts.SyntaxKind.MethodDeclaration: {
                if (ts.isMethodDeclaration(node)) {
                    for (let c of node.getChildren()) {
                        if (
                            c.kind ===
                            ts.SyntaxKind.Identifier
                        ) {
                            identifierNode =
                                c as ts.Identifier;
                        }
                    }
                    let signature =
                        checker.getSignatureFromDeclaration(
                            node
                        )!;
                    mapper.addMethod(
                        identifierNode!.text,
                        modifierlistToModifierSet(
                            node.modifiers
                        ),
                        checker.typeToString(
                            checker.getReturnTypeOfSignature(
                                signature
                            )
                        ),
                        paramDeclListToIParams(
                            node.parameters,
                            checker
                        ),
                        false
                    );
                }
            }
        }
        ts.forEachChild(node, mapNode);
    }

    return mapper.getMapping();
}

export { mapFiles };
