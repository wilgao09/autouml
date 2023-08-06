import { autouml } from "../typings";
import { d2StringOfObject } from "./convertTod2";
import { isWatchTarget } from "./typecheck";

class AutoUML {
    watchObjects: Array<object>;
    watchConstructors: Array<Function>;
    constructor() { // ...objsAndClasses: Array<autouml.lib.WatchTarget>
        this.watchObjects = [];
        this.watchConstructors = [];
        // for (let arg of objsAndClasses) {
        //     this.add(arg);
        // }
    }

    toString(): string {
        let output = "";
        let i = 0;
        for (let o of this.watchObjects) {
            output += d2StringOfObject(o, i.toString());
            i++;
        }

        return output;
    }

    output() {}

    add(
        arg: autouml.lib.WatchTarget | object | Function
    ): boolean {
        let targ: object | Function;
        let name: string = "";
        if (isWatchTarget(arg)) {
            targ = arg.target;
            name = arg.name;
        } else {
            targ = arg;
            if ((targ as any)["name"] !== undefined) {
                name = (targ as any)["name"];
            } else {
                name = `object-${this.watchObjects.length}`;
            }
        }
        if (typeof targ === "function") {
            this.watchConstructors.push(targ);
        } else if (typeof arg === "object") {
            this.watchObjects.push(targ);
        } else {
            return false;
        }
        return true;
    }

    remove(a: object | Function) {}
}

export default AutoUML;
export { AutoUML };
