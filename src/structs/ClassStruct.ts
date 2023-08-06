import { autouml } from "../../typings";

class ClassStruct {
    name: string;
    fields: autouml.d2.ClassEntry[];
    constructor(name: string) {
        this.name = name;
        this.fields = [];
    }

    
}

export { ClassStruct };
