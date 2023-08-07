import ts from "typescript";

// declare global {
export namespace autouml {
    // namespace d2 {
    //     // interface n {
    //     //     k: import("./src/structs/ClassStruct").ClassStruct;
    //     // }
    //     enum AccessModifier {
    //         PUBLIC,
    //         PRIVATE,
    //         PROTECTED,
    //     }
    //     interface ClassEntry {
    //         access: AccessModifier;
    //         name: string;
    //         arguments?: {
    //             name: string;
    //             type: string;
    //         }[];
    //         type?: string;
    //     }
    // }

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
