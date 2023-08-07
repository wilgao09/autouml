import { readFileSync } from "fs";
import * as ts from "typescript";


let indent = 0;
function print(node: ts.Node) {
    console.log(
        new Array(indent + 1).join(" ") +
            ts.SyntaxKind[node.kind]
    );
    indent++;
    ts.forEachChild(node, print);
    indent--;
}


function readFile(fileName: string) {
    const sourceFile = ts.createSourceFile(
        fileName,
        readFileSync(fileName).toString(),
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true
    );

    print(sourceFile);
}

export { readFile };
