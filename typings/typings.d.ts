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
        }
        interface IInterfaceScope extends IScope {
            interfaceData: IParam[];
        }
        interface IEnumScope extends IScope {
            enumData: string[];
        }
        interface IClassScope extends IScope {
            fields: Array<IClassField>;
            methods: Array<IClassMethods>;
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
        type ITSType = any;
    }
}
// }

// export {};
