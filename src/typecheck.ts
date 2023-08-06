import { autouml } from "../typings";

//WatchTarget attributes
const WatchTargetAttributes: Readonly<Array<string>> = [
    "target",
    "name",
];
function isWatchTarget(
    object: any
): object is autouml.lib.WatchTarget {
    let h = new Set<string>();
    for (let a of WatchTargetAttributes) {
        h.add(a);
    }
    let attrno = 0;
    for (let a of Object.keys(object)) {
        attrno++;
        h.delete(a);
    }
    return (
        h.size === 0 &&
        attrno === WatchTargetAttributes.length
    );
}

export { isWatchTarget };
