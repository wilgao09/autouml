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

function getNameOfScopeable(n: ts.Node): string {
    let name = "UNKNOWN NAME";
    if (ts.isClassDeclaration(n)) {
        const className = n.name?.text;
        // Extract type parameters if the class has them
        let typeParameters =
            n.typeParameters
                ?.map((tp) => tp.getText())
                .join(", ") || "";
        if (typeParameters !== "") {
            typeParameters = `<${typeParameters}>`;
        }

        return `${className}${typeParameters}`;
    } else {
        n.forEachChild((cn) => {
            if (ts.isIdentifier(cn)) {
                name = cn.getText();
            }
        });
    }
    return name;
    // } else if (ts.isInterfaceDeclaration(n)) {
    //     return n.name?.text;
    // } else if (ts.isEnumDeclaration(n)) {
    //     return n.name?.text;
    // }
}

function makeScope(
    mapper: FileMapper,
    checker: ts.TypeChecker,
    node: ts.Node,
    mapNode: (_: ts.Node) => unknown
) {
    // node.forEachChild((cn) => {
    //     if (cn.kind === ts.SyntaxKind.Identifier) {
    // add to mapper
    mapper.startScope(
        getNameOfScopeable(node),
        kindToScope(node.kind),
        tsTypeToAutoUMLType(
            mapper.getCurrentFileName(),
            checker,
            checker.getTypeAtLocation(node)
        )
    );
    //     }
    // });
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
        }
    });

    return tor;
}

const DEFAULT_TYPE: autouml.mapping.ITSType = {
    name: "any",
    isPrimitive: true,
    typeLocation: {
        fileName: "",
        duplicatedIn: [],
        namespaceNest: [],
    },
    typeParameters: [],
};

function locateInterfaceType(
    currentFileName: string,
    checker: ts.TypeChecker,
    i: ts.InterfaceType
): autouml.mapping.ITSTypeLocation {
    let tor: autouml.mapping.ITSTypeLocation = {
        fileName: currentFileName,
        namespaceNest: [],
        duplicatedIn: [],
    };
    let isym = i.getSymbol();

    if (isym) {
        // fullname is '"path".A.B.C'
        // but if the name is local, there is no path
        let fullName = checker.getFullyQualifiedName(isym);

        // check if the definition is out of this file
        let fragments = fullName.split('"');
        //the declaration is out of this file
        if (fragments[0] === "") {
            tor.fileName = fragments[1];
            // note that fragments[1] is missing the file extnesion!!!

            // isolate the namespace nesting
            fragments[2] = fragments[2].slice(1);
            tor.namespaceNest = fragments[2].split(".");
        } else {
            // fragments[0] is the entire string unchanged
            tor.namespaceNest = fragments[0].split(".");
        }

        let currentFileName = path.parse(tor.fileName);
        // find where this interface is also declared
        let decls = isym.getDeclarations();
        if (decls) {
            decls.forEach((x) => {
                let p = path.resolve(
                    x.getSourceFile().fileName
                );
                tor.duplicatedIn.push(p);
                // recall that the current filename might not have the file extension
                // if the current file has no extension, and p contains the file, we will assume it originated from there
                if (currentFileName.ext === "") {
                    tor.fileName = p;
                    currentFileName = path.parse(
                        tor.fileName
                    );
                }
            });
        }
    }

    return tor;
}

function isEnumType(
    type: ts.Type
): type is ts.InterfaceType {
    function hasFlag(type: ts.Type, flag: ts.TypeFlags) {
        return (type.flags & flag) === flag;
    }
    // if for some reason this returns true...
    if (hasFlag(type, ts.TypeFlags.Enum)) return true;

    // it's not an enum type if it's an enum literal type
    if (
        hasFlag(type, ts.TypeFlags.EnumLiteral) &&
        !type.isUnion()
    )
        return true;

    // get the symbol and check if its value declaration is an enum declaration
    const symbol = type.getSymbol();
    if (symbol == null) return false;

    const { valueDeclaration } = symbol;
    return (
        valueDeclaration != null &&
        valueDeclaration.kind ===
            ts.SyntaxKind.EnumDeclaration
    );
}

function tsTypeToAutoUMLType(
    currentFileName: string,
    checker: ts.TypeChecker,
    t: ts.Type
): autouml.mapping.ITSType {
    // clone the default type
    let tor: autouml.mapping.ITSType = JSON.parse(
        JSON.stringify(DEFAULT_TYPE)
    );
    //get the name
    tor.name = checker.typeToString(t);
    if (t.isClassOrInterface() || isEnumType(t)) {
        tor.isPrimitive = false;
        tor.typeLocation = locateInterfaceType(
            currentFileName,
            checker,
            t
        );
    }
    let targs = (t as ts.TypeReference).typeArguments;
    if (targs) {
        for (let arg of targs) {
            tor.typeParameters.push(
                tsTypeToAutoUMLType(
                    currentFileName,
                    checker,
                    arg
                )
            );
        }
    }
    return tor;
}

function paramDeclListToIParams(
    p: ts.NodeArray<ts.ParameterDeclaration>,
    checker: ts.TypeChecker
): autouml.mapping.IParam[] {
    let tor: autouml.mapping.IParam[] = [];
    tor = p.map((x): autouml.mapping.IParam => {
        let t = DEFAULT_TYPE;
        let tt = x.type;
        if (tt) {
            t = tsTypeToAutoUMLType(
                x.getSourceFile().fileName,
                checker,
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

function getAllTypesFromCallExpresion(
    currentFileName: string,
    callExpr: ts.CallExpression,
    checker: ts.TypeChecker
): autouml.mapping.ITSType[] {
    let tor: autouml.mapping.ITSType[] = [];
    tor = callExpr.arguments.map((arg) =>
        tsTypeToAutoUMLType(
            currentFileName,
            checker,
            checker.getTypeAtLocation(arg)
        )
    );
    const expression = callExpr.expression;
    if (
        ts.isPropertyAccessExpression(expression) ||
        ts.isElementAccessExpression(expression)
    ) {
        const objectExpression = expression.expression;
        const objectType = checker.getTypeAtLocation(
            objectExpression
        );
        tor.push(
            tsTypeToAutoUMLType(
                currentFileName,
                checker,
                objectType
            )
        );
    }
    return tor;
}

/**
 * Maps a set of input files and stores all data in the mapper
 * @param mapper
 * @param inputPaths
 * @param options
 */
function mapFiles(
    mapper: FileMapper,
    options: ts.CompilerOptions
) {
    let fileMap = new Map<string, boolean>();
    let files: string[] = [];
    for (let p of mapper.getFiles()) {
        let fils = globSync(p, {
            ignore: "node_modules/**",
        });
        for (let f of fils) {
            files.push(f);
            fileMap.set(path.resolve(f), true);
        }
    }
    // let mapper = new FileMapper(files);
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
        switch (node.kind) {
            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.ClassDeclaration:
                if (
                    ts.isClassDeclaration(node) ||
                    ts.isInterfaceDeclaration(node)
                ) {
                    // get extends and implements data
                    let hc = node.heritageClauses;
                    if (hc) {
                        hc.forEach((c) => {
                            let relation: autouml.mapping.ConnectorType;
                            if (
                                c.token ===
                                ts.SyntaxKind.ExtendsKeyword
                            ) {
                                relation =
                                    autouml.mapping
                                        .ConnectorType
                                        .INHERITS;
                            } else {
                                relation =
                                    autouml.mapping
                                        .ConnectorType
                                        .IMPLEMENTS;
                            }
                            c.types.forEach((t) => {
                                mapper.addRelation(
                                    tsTypeToAutoUMLType(
                                        mapper.getCurrentFileName(),
                                        checker,
                                        checker.getTypeAtLocation(
                                            c.parent
                                        )
                                    ),
                                    relation,
                                    tsTypeToAutoUMLType(
                                        mapper.getCurrentFileName(),
                                        checker,
                                        checker.getTypeFromTypeNode(
                                            t
                                        )
                                    )
                                );
                            });
                        });
                    }
                }
                return makeScope(
                    mapper,
                    checker,
                    node,
                    mapNode
                );
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

            // for interface members
            case ts.SyntaxKind.PropertySignature: {
                if (ts.isPropertySignature(node)) {
                    let t = tsTypeToAutoUMLType(
                        mapper.getCurrentFileName(),
                        checker,
                        checker.getTypeAtLocation(node)
                    );
                    mapper.addPropertySignature(
                        node.name.getText(),
                        t
                    );
                    mapper.addCurrentScopeRelation(
                        autouml.mapping.ConnectorType
                            .AGGREGATES,
                        t
                    );
                }

                break;
            }

            // for interface index signature members
            case ts.SyntaxKind.IndexSignature: {
                if (ts.isIndexSignatureDeclaration(node)) {
                    let t = tsTypeToAutoUMLType(
                        mapper.getCurrentFileName(),
                        checker,
                        checker.getTypeAtLocation(
                            node.getChildAt(4)
                        )
                    );
                    let name = `[${node
                        .getChildAt(1)
                        .getText()
                        .replace(/ /g, "")}]`;
                    mapper.addPropertySignature(name, t);
                    mapper.addCurrentScopeRelation(
                        autouml.mapping.ConnectorType
                            .AGGREGATES,
                        t
                    );
                }

                break;
            }

            // for class members
            case ts.SyntaxKind.PropertyDeclaration: {
                if (ts.isPropertyDeclaration(node)) {
                    let t = tsTypeToAutoUMLType(
                        mapper.getCurrentFileName(),
                        checker,
                        checker.getTypeAtLocation(node)
                    );
                    mapper.addPropertyDeclaration(
                        node.name?.getText(),
                        modifierlistToModifierSet(
                            node.modifiers
                        ),
                        t
                    );
                    mapper.addCurrentScopeRelation(
                        autouml.mapping.ConnectorType
                            .AGGREGATES,
                        t
                    );
                }
                break;
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
                        tsTypeToAutoUMLType(
                            mapper.getCurrentFileName(),
                            checker,
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
                mapper.preventNewFunctions();
                break;
            }
            case ts.SyntaxKind.MethodDeclaration: {
                if (ts.isMethodDeclaration(node)) {
                    let signature =
                        checker.getSignatureFromDeclaration(
                            node
                        )!;
                    mapper.addMethod(
                        node.name?.getText(),
                        modifierlistToModifierSet(
                            node.modifiers
                        ),
                        tsTypeToAutoUMLType(
                            mapper.getCurrentFileName(),
                            checker,
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
                    mapper.preventNewFunctions();
                    break;
                }
            }

            // understand class dependecies
            case ts.SyntaxKind.CallExpression: {
                if (ts.isCallExpression(node)) {
                    let types =
                        getAllTypesFromCallExpresion(
                            mapper.getCurrentFileName(),
                            node,
                            checker
                        );
                    for (let t of types) {
                        if (!t.isPrimitive) {
                            mapper.addCurrentScopeRelation(
                                autouml.mapping
                                    .ConnectorType.DEPENDS,
                                t
                            );
                        }
                    }
                }
            }
        }
        ts.forEachChild(node, mapNode);
        if (
            ts.isMethodDeclaration(node) ||
            ts.isConstructorDeclaration(node)
        ) {
            mapper.allowNewFunctions();
        }
    }
}

export { mapFiles };
