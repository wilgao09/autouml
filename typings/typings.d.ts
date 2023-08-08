import ts from "typescript";

// declare global {
export namespace autouml {
    namespace cli {
        interface IOptions {
            baseDir: string;
            tsconfigFileName: string;
            outputPath: string;
            target: codegen.Target;
            verbose: boolean;
        }
    }

    namespace codegen {
        const enum Target {
            d2,
        }
        interface CodeGenerator {
            target: Target;
        }
    }

    namespace mapping {
        const enum ScopeType {
            PROGRAM,
            FILE,
            NAMESPACE,
            CLASS,
            INTERFACE,
            ENUM,
        }
        const enum AccessModifier {
            PUBLIC,
            PRIVATE,
            PROTECTED,
        }
        interface IScope {
            scopeType: ScopeType;
            name: string;
            children: Array<IScope>;
            parent: IScope | null;
            connectors: Array<IConnector>;
        }
        interface IInterfaceScope extends IScope {
            interfaceData: IParam[];
            selfType: ITSType;
        }
        interface IEnumScope extends IScope {
            enumData: string[];
            selfType: ITSType;
        }
        interface IClassScope extends IScope {
            fields: Array<IClassField>;
            methods: Array<IClassMethods>;
            selfType: ITSType;
        }
        interface IParam {
            type: ITSType; //TODO: wtf is this
            name: string;
        }
        interface IClassField {
            access: Set<AccessModifier>;
            name: string;
            type: ITSType;
        }
        interface IClassMethods {
            isConstructor: boolean;
            access: Set<AccessModifier>;
            name: string;
            type: ITSType;
            parameters: IParam[];
        }
        interface ITSType {
            name: string;
            isPrimitive: boolean;
            typeLocation: ITSTypeLocation;
            typeParameters: ITSType[];
        }

        interface ITSTypeLocation {
            fileName: string;
            duplicatedIn: string[];
            namespaceNest: string[];
        }
        const enum ConnectorType {
            INHERITS,
            IMPLEMENTS,
            DEPENDS,
            AGGREGATES,
            COMPOSES,
            ASSOCIATES,
        }

        interface IConnector {
            src: ITSType;
            type: ConnectorType;
            dst: ITSType;
        }
    }
}
// }

// export {};
