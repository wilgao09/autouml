import { autouml } from "../../typings/typings";
import * as os from "node:os";

// check if either originates from node_modules
function from_node_modules(
    t: autouml.mapping.ITSType | string
): boolean {
    let pathSegments: string[];
    let delim = os.platform() === "win32" ? "\\" : "/";
    if (typeof t === "string") {
        pathSegments = t.split(delim);
    } else {
        pathSegments = t.typeLocation.fileName.split(delim);
    }

    if (pathSegments.length === 0) {
        return false;
    }
    pathSegments.pop();
    for (let p of pathSegments) {
        if (p === "node_modules") {
            return true;
        }
    }
    return false;
}

export { from_node_modules };
