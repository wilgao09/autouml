import { readFileSync } from "fs";
import * as ts from "typescript";

let indent = 0;
function print(n: ts.Node): string {
    let ans: string[] = [];
    function aux(node: ts.Node) {
        ans.push(
            new Array(indent + 1).join(" ") +
                ts.SyntaxKind[node.kind]
        );
        indent++;
        ts.forEachChild(node, aux);
        indent--;
    }
    aux(n);
    return ans.join("\n");
}

function readFile(fileName: string): string {
    const sourceFile = ts.createSourceFile(
        fileName,
        readFileSync(fileName).toString(),
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true
    );

    return print(sourceFile);
}

export { readFile };
