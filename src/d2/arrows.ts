import { autouml } from "../../typings/typings";
import * as path from "path";

const enum Arrowhead {
    TRIANGLE = "triangle",
    DIAMOND = "diamond",
    ARROW = "arrow",
}

interface IArrowStyle {
    text: string;
    // source-arrowhead.label: 1
    targetArrowhead: {
        shape: Arrowhead;
        style: {
            filled: boolean;
        };
    };
    style: {
        strokeDash: number;
    };
}

function normalize(s: string): string {
    return s
        .replace(/\./g, "\\.")
        .replace(/\\(?!\.)/g, ".")
        .replace(/\/(?!\.)/g, ".")
        .split(/(?<!\\)\./g)
        .map((x) => `"${x}"`)
        .join(".");
}

function typeToString(t: autouml.mapping.ITSType): string {
    if (t.isPrimitive) {
        return t.name;
    }
    return `${normalize(
        path.normalize(t.typeLocation.fileName)
    )}.${t.typeLocation.namespaceNest
        .join(".")
        .replace(/[()]/g, "\\$&")}`;
}

import connType = autouml.mapping.ConnectorType;

function getArrowStyle(
    t: autouml.mapping.ConnectorType
): IArrowStyle {
    let tor: IArrowStyle = {
        text: "",
        // source-arrowhead.label: 1
        targetArrowhead: {
            shape: Arrowhead.ARROW,
            style: {
                filled: false,
            },
        },
        style: {
            strokeDash: 5,
        },
    };

    if (
        t === connType.ASSOCIATES ||
        t === connType.DEPENDS
    ) {
        tor.targetArrowhead.shape = Arrowhead.ARROW;
    }
    if (
        t === connType.INHERITS ||
        t === connType.IMPLEMENTS
    ) {
        tor.targetArrowhead.shape = Arrowhead.TRIANGLE;
    }

    if (
        t === connType.AGGREGATES ||
        t === connType.COMPOSES
    ) {
        tor.targetArrowhead.shape = Arrowhead.DIAMOND;
    }

    // dashed
    if (
        t === connType.IMPLEMENTS ||
        t === connType.DEPENDS
    ) {
        tor.style.strokeDash = 5;
    } else {
        tor.style.strokeDash = 0;
    }

    // filled
    if (t === connType.COMPOSES) {
        tor.targetArrowhead.style.filled = true;
    } else {
        tor.targetArrowhead.style.filled = false;
    }
    return tor;
}

function arrowStyleToString(s: IArrowStyle): string {
    let lines = `: ${s.text ? `"${s.text}"` : ""}{
    target-arrowhead: {
        shape: ${s.targetArrowhead.shape}
        style.filled: ${s.targetArrowhead.style.filled}
    }
    style.stroke-dash: ${s.style.strokeDash}
}    
`;
    return lines;
}

function drawArrow(
    relation: autouml.mapping.IConnector
): string {
    return `${typeToString(relation.src)} -> ${typeToString(
        relation.dst
    )} ${arrowStyleToString(getArrowStyle(relation.type))}`;
}

function compileRelations(
    relations: autouml.mapping.IConnector[]
): string {
    let ans = [];
    for (let r of relations) {
        ans.push(drawArrow(r));
    }
    return ans.join("\n");
}

export { compileRelations };
