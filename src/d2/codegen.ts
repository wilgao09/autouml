import { autouml } from "../../typings/typings";
import Visitor from "../visitor";

function accessToPrefix(
    access: Set<autouml.mapping.AccessModifier>
): string {
    let tor = "";
    if (
        access.has(autouml.mapping.AccessModifier.PRIVATE)
    ) {
        tor = "-";
    } else if (
        access.has(autouml.mapping.AccessModifier.PROTECTED)
    ) {
        tor = "\\#";
    } else {
        tor = "+";
    }

    return tor;
}

const TAB_SPACE = 4;
const TAB = new Array(TAB_SPACE)
    .fill(0)
    .map((_) => " ")
    .join("");

function indentLines(lines: string[]): string[] {
    for (let i = 0; i < lines.length; i++) {
        lines[i] = TAB + lines[i];
    }
    return lines;
}

export default class d2Codegen
    extends Visitor
    implements autouml.codegen.CodeGenerator
{
    target: autouml.codegen.Target;
    constructor(map?: autouml.mapping.IScope | null) {
        super(map);
        this.target = autouml.codegen.Target.d2;
    }

    protected visitProgram(
        scope: autouml.mapping.IScope,
        childData: string[][]
    ): string[] {
        let lines = childData.flat();

        return lines;
        // return [`Program: {`, ...indentLines(lines), `}`];
    }
    protected visitFile(
        scope: autouml.mapping.IScope,
        childData: string[][]
    ): string[] {
        let lines = childData.flat();
        return [
            `${scope.name.replace(
                /[\[\]\.><\\:]/g,
                "\\$&"
            )} {`,
            ...indentLines(lines),
            `}`,
        ];
    }
    protected visitNamespace(
        scope: autouml.mapping.IScope,
        childData: string[][]
    ): string[] {
        let lines = childData.flat();
        return [
            `${scope.name} {`,

            ...indentLines([`shape: package`, ...lines]),
            `}`,
        ];
    }
    protected visitClass(
        scope: autouml.mapping.IClassScope,
        childData: string[][],
        fieldData: string[][],
        methodData: string[][]
    ): string[] {
        let fLines = fieldData.flat();
        let mLines = methodData.flat();

        return [
            `${scope.name} {`,
            ...indentLines([
                `shape: class`,
                "# Field Data",
                ...fLines,
                "# Method Data",
                ...mLines,
            ]),
            `}`,
        ];
    }

    protected visitInterface(
        scope: autouml.mapping.IInterfaceScope,
        childData: string[][],
        fieldData: string[][]
    ): string[] {
        let fLines = fieldData.flat();
        return [
            `${scope.name} {`,
            ...indentLines([
                `shape: class`,

                `# Field Data`,
                ...fLines,
            ]),

            " }",
        ];
    }
    protected visitEnum(
        scope: autouml.mapping.IEnumScope,
        childData: string[][],
        enumData: string[][]
    ): string[] {
        // TODO: this is not the right d2 shape
        return [
            `${scope.name} {`,
            ...indentLines([
                `shape: class`,
                `# Field Data`,
                `${enumData.flat().join(", ")}`,
            ]),
            `}`,
        ];
    }

    protected visitEnumField(f: string): string[] {
        return [f];
    }
    protected visitInterfaceField(
        f: autouml.mapping.IParam
    ): string[] {
        return [`+${f.name} : ${typeToString(f.type)}`];
    }
    protected visitClassField(
        f: autouml.mapping.IClassField
    ): string[] {
        return [
            `${accessToPrefix(f.access)}${
                f.name
            } : ${typeToString(f.type)}`,
        ];
    }

    protected visitClassMethod(
        m: autouml.mapping.IClassMethods
    ): string[] {
        let params = m.parameters.map(
            (x) =>
                `${x.name}\\: ${typeToString(
                    x.type,
                    false
                )}`
        );
        return [
            `${accessToPrefix(m.access)}${
                m.name
            }(${params}) : ${typeToString(m.type)}`,
        ];
    }
}

function typeToString(
    t: autouml.mapping.ITSType,
    atEnd: boolean = true
): string {
    if (atEnd) {
        return `|ts ${t.name}|`;
    } else {
        return t.name.replace(/[\[\]\.><]/g, "\\$&");
    }
}
