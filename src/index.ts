import { readFileSync } from "fs";
import * as ts from "typescript";

function delint(sourceFile: ts.SourceFile) {
    function delintNode(node: ts.Node) {
        switch (node.kind) {
            case ts.SyntaxKind.ModuleDeclaration: {
                // search for an identifier object in the children
                // console.log(node.getChildren()[2]);
            }
        }

        ts.forEachChild(node, delintNode);
    }
    delintNode(sourceFile);
    // function report(node: ts.Node, message: string) {
    //     const { line, character } =
    //         sourceFile.getLineAndCharacterOfPosition(
    //             node.getStart()
    //         );
    //     console.log(
    //         `${sourceFile.fileName} (${line + 1},${
    //             character + 1
    //         }): ${message}`
    //     );
    // }
}

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

// const fileNames = process.argv.slice(2);
// fileNames.forEach((fileName) => {
//     // Parse a file

// });

function readFile(fileName: string) {
    const sourceFile = ts.createSourceFile(
        fileName,
        readFileSync(fileName).toString(),
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true
    );

    // delint it
    // delint(sourceFile);
    print(sourceFile);
}

export { readFile };
