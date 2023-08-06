// declare global {
export namespace autouml {
    namespace d2 {
        // interface n {
        //     k: import("./src/structs/ClassStruct").ClassStruct;
        // }
        enum AccessModifier {
            PUBLIC,
            PRIVATE,
            PROTECTED,
        }
        interface ClassEntry {
            access: AccessModifier;
            name: string;
            arguments?: {
                name: string;
                type: string;
            }[];
            type?: string;
        }
    }

    namespace lib {
        interface WatchTarget {
            target: object | Function;
            name: string;
        }
    }
}
// }

// export {};
