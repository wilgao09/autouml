import ts from "typescript";
import { autouml } from "../../typings/typings";
import { FileMapper } from "./FileMapper";
import { readFileSync } from "fs";
import * as util from "util";
import * as path from "path";
import { globSync } from "glob";
import { wellKnownTypesSet } from "./wellknown";

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

function kindToScope(
    k: ts.SyntaxKind
): autouml.mapping.ScopeType {
    switch (k) {
        case ts.SyntaxKind.ModuleDeclaration:
            return autouml.mapping.ScopeType.NAMESPACE;
        case ts.SyntaxKind.EnumDeclaration:
            return autouml.mapping.ScopeType.ENUM;
        case ts.SyntaxKind.InterfaceDeclaration:
            return autouml.mapping.ScopeType.INTERFACE;
        case ts.SyntaxKind.ClassDeclaration:
            return autouml.mapping.ScopeType.CLASS;
        default:
            return autouml.mapping.ScopeType.PROGRAM;
    }
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

function isUserDefinedType(type: ts.Type): boolean {
    function hasFlag(type: ts.Type, flag: ts.TypeFlags) {
        return (type.flags & flag) === flag;
    }

    const symbol = type.getSymbol();
    if (symbol == null) return false;
    if (wellKnownTypesSet.has(symbol.name)) {
        return false;
    }

    // Check if the type is an object type with Class or Interface flag
    if (hasFlag(type, ts.TypeFlags.Object)) {
        let decls = symbol.getDeclarations();
        if (!decls) {
            return false;
        }
        return (
            (ts.getCombinedModifierFlags(decls[0]) &
                ts.ModifierFlags
                    .NonPublicAccessibilityModifier) ===
            0
        );
    }

    // Check if the type is a union or intersection type
    if (hasFlag(type, ts.TypeFlags.UnionOrIntersection)) {
        let t = type as ts.UnionOrIntersectionType;
        // You might want to check individual members of the union or intersection
        return t.types.some((memberType) =>
            isUserDefinedType(memberType)
        );
    }

    // Check if this is an enum type
    // if for some reason this returns true...
    if (hasFlag(type, ts.TypeFlags.Enum)) return true;

    // it's not an enum type if it's an enum literal type
    if (
        hasFlag(type, ts.TypeFlags.EnumLiteral) &&
        !type.isUnion()
    )
        return true;

    const { valueDeclaration } = symbol;
    return (
        valueDeclaration != null &&
        valueDeclaration.kind ===
            ts.SyntaxKind.EnumDeclaration
    );
}

class TypeScraper {
    fileMap: Map<string, boolean>;
    files: string[];
    program: ts.Program;
    checker: ts.TypeChecker;
    mapper: FileMapper;
    constructor(mapper: FileMapper) {
        this.mapper = mapper;

        this.fileMap = new Map<string, boolean>();
        this.files = [];
        // console.log(mapper.getFiles());
        for (let p of mapper.getFiles()) {
            let fils = globSync(p, {
                ignore: "node_modules/**",
            });
            for (let f of fils) {
                this.files.push(f);
                this.fileMap.set(path.resolve(f), true);
            }
        }
        // let mapper = new FileMapper(files);
        this.program = ts.createProgram(
            this.files,
            this.mapper.getTSOptions().options
        );
        this.checker = this.program.getTypeChecker();
    }

    public run() {
        this.program
            .getSourceFiles()
            .forEach((sourceFile) => {
                // let sourceFile = ts.createSourceFile(
                //     fileName,
                //     readFileSync(fileName).toString(),
                //     ts.ScriptTarget.ES2015,
                //     true
                // );
                let fname = path.resolve(
                    sourceFile.fileName
                );
                if (this.fileMap.get(fname)) {
                    this.mapper.startScope(
                        path.relative(
                            this.mapper.getUMLOptions()
                                .baseDir,
                            fname
                        ),
                        autouml.mapping.ScopeType.FILE
                    );
                    this.mapNode(sourceFile);
                    this.mapper.endScope();
                }
            });
    }

    public makeScope(node: ts.Node) {
        this.mapper.startScope(
            getNameOfScopeable(node),
            kindToScope(node.kind),
            this.tsTypeToAutoUMLType(
                this.checker.getTypeAtLocation(node)
            )
        );
        ts.forEachChild(node, this.mapNode.bind(this));
        this.mapper.endScope();
    }

    public locateType(
        i: ts.Type
    ): autouml.mapping.ITSTypeLocation {
        let tor: autouml.mapping.ITSTypeLocation = {
            fileName: "",
            namespaceNest: [],
            duplicatedIn: [],
        };
        let isym = i.getSymbol();

        if (isym) {
            // fullname is '"path".A.B.C'
            // but if the name is local, there is no path
            let fullName =
                this.checker.getFullyQualifiedName(isym);

            // check if the definition is out of this file
            let fragments = fullName.split('"');
            //the declaration is out of this file
            if (fragments[0] === "") {
                // tor.fileName = fragments[1];
                // note that fragments[1] is missing the file extnesion!!!

                // isolate the namespace nesting
                fragments[2] = fragments[2].slice(1);
                tor.namespaceNest = fragments[2].split(".");
            } else {
                // fragments[0] is the entire string unchanged
                tor.namespaceNest = fragments[0].split(".");
            }

            // let currentFileName = path.parse(tor.fileName);
            // find where this interface is also declared
            let decls = isym.getDeclarations();

            if (decls) {
                decls.forEach((x) => {
                    let p = path.relative(
                        this.mapper.getUMLOptions().baseDir,
                        x.getSourceFile().fileName
                    );
                    if (tor.fileName === "") {
                        tor.fileName = p;
                    }
                    tor.duplicatedIn.push(p);
                });
            }
        }

        return tor;
    }

    public tsTypeToAutoUMLType(
        t: ts.Type
    ): autouml.mapping.ITSType {
        // clone the default type
        let tor: autouml.mapping.ITSType = JSON.parse(
            JSON.stringify(DEFAULT_TYPE)
        );
        //get the name
        tor.name = this.checker.typeToString(t);
        if (isUserDefinedType(t)) {
            // if (t.isClassOrInterface() || isEnumType(t)) {
            tor.isPrimitive = false;
            tor.typeLocation = this.locateType(t);
        }
        let targs = (t as ts.TypeReference).typeArguments;
        if (targs) {
            for (let arg of targs) {
                tor.typeParameters.push(
                    this.tsTypeToAutoUMLType(arg)
                );
            }
        }
        return tor;
    }

    public paramDeclListToIParams(
        p: ts.NodeArray<ts.ParameterDeclaration>
    ): autouml.mapping.IParam[] {
        let tor: autouml.mapping.IParam[] = [];
        tor = p.map((x): autouml.mapping.IParam => {
            let t = DEFAULT_TYPE;
            let tt = x.type;
            if (tt) {
                t = this.tsTypeToAutoUMLType(
                    this.checker.getTypeAtLocation(tt)
                );
            }

            return {
                name: x.name.getText(),
                type: t,
            };
        });
        return tor;
    }

    public getAllTypesFromCallExpresion(
        callExpr: ts.CallExpression
    ): autouml.mapping.ITSType[] {
        let tor: autouml.mapping.ITSType[] = [];
        tor = callExpr.arguments.map((arg) =>
            this.tsTypeToAutoUMLType(
                this.checker.getTypeAtLocation(arg)
            )
        );
        const expression = callExpr.expression;
        if (
            ts.isPropertyAccessExpression(expression) ||
            ts.isElementAccessExpression(expression)
        ) {
            const objectExpression = expression.expression;
            const objectType =
                this.checker.getTypeAtLocation(
                    objectExpression
                );
            tor.push(this.tsTypeToAutoUMLType(objectType));
        }
        return tor;
    }

    public mapNode(node: ts.Node) {
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
                                this.mapper.addRelation(
                                    this.tsTypeToAutoUMLType(
                                        this.checker.getTypeAtLocation(
                                            c.parent
                                        )
                                    ),
                                    relation,
                                    this.tsTypeToAutoUMLType(
                                        this.checker.getTypeFromTypeNode(
                                            t
                                        )
                                    )
                                );
                            });
                        });
                    }
                }

                return this.makeScope(node);
            /**
             * NON scope starting constructs
             */
            case ts.SyntaxKind.EnumMember: {
                node.forEachChild((cn) => {
                    if (
                        cn.kind === ts.SyntaxKind.Identifier
                    ) {
                        this.mapper.addEnumMember(
                            cn.getText()
                        );
                    }
                });
                break;
            }

            // for interface members
            case ts.SyntaxKind.PropertySignature: {
                if (ts.isPropertySignature(node)) {
                    let t = this.tsTypeToAutoUMLType(
                        this.checker.getTypeAtLocation(node)
                    );
                    this.mapper.addPropertySignature(
                        node.name.getText(),
                        t
                    );
                    this.mapper.addCurrentScopeRelation(
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
                    let t = this.tsTypeToAutoUMLType(
                        this.checker.getTypeAtLocation(
                            node.getChildAt(4)
                        )
                    );
                    let name = `[${node
                        .getChildAt(1)
                        .getText()
                        .replace(/ /g, "")}]`;
                    this.mapper.addPropertySignature(
                        name,
                        t
                    );
                    this.mapper.addCurrentScopeRelation(
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
                    let t = this.tsTypeToAutoUMLType(
                        this.checker.getTypeAtLocation(node)
                    );
                    this.mapper.addPropertyDeclaration(
                        node.name?.getText(),
                        modifierlistToModifierSet(
                            node.modifiers
                        ),
                        t
                    );
                    this.mapper.addCurrentScopeRelation(
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
                        this.checker.getSignatureFromDeclaration(
                            node
                        )!;
                    this.mapper.addMethod(
                        "constructor",
                        modifierlistToModifierSet(
                            node.modifiers
                        ),
                        this.tsTypeToAutoUMLType(
                            this.checker.getReturnTypeOfSignature(
                                signature
                            )
                        ),
                        this.paramDeclListToIParams(
                            node.parameters
                        ),
                        true
                    );
                    return;
                }
                this.mapper.preventNewFunctions();
                break;
            }
            case ts.SyntaxKind.MethodDeclaration: {
                if (ts.isMethodDeclaration(node)) {
                    let signature =
                        this.checker.getSignatureFromDeclaration(
                            node
                        )!;
                    this.mapper.addMethod(
                        node.name?.getText(),
                        modifierlistToModifierSet(
                            node.modifiers
                        ),
                        this.tsTypeToAutoUMLType(
                            this.checker.getReturnTypeOfSignature(
                                signature
                            )
                        ),
                        this.paramDeclListToIParams(
                            node.parameters
                        ),
                        false
                    );
                    this.mapper.preventNewFunctions();
                    break;
                }
            }

            // understand class dependecies
            case ts.SyntaxKind.CallExpression: {
                if (ts.isCallExpression(node)) {
                    let types =
                        this.getAllTypesFromCallExpresion(
                            node
                        );
                    for (let t of types) {
                        if (!t.isPrimitive) {
                            this.mapper.addCurrentScopeRelation(
                                autouml.mapping
                                    .ConnectorType.DEPENDS,
                                t
                            );
                        }
                    }
                }
            }
        }
        ts.forEachChild(node, this.mapNode.bind(this));
        if (
            ts.isMethodDeclaration(node) ||
            ts.isConstructorDeclaration(node)
        ) {
            this.mapper.allowNewFunctions();
        }
    }
}

export { TypeScraper };
