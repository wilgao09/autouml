#!/usr/bin/env node
"use strict";
/**
 * Main entry into the program
 */

import * as util from "node:util";
import { autouml } from "../../typings/typings";
import { buildUML } from "./buildUML";

/**
 * Valid command line arguments. This object details all flags and their uses, and the program overall usage statement
 */
const PARSE_ARGS_CONFIG: autouml.cli.IParseArgsConfig = {
    usage: "usage: autouml [OPTION]...",
    description:
        "Generate a UML diagram for a Typescript project.",
    options: {
        help: {
            type: "boolean",
            short: "h",
            description: "display this help and exit",
        },
        verbose: {
            type: "boolean",
            short: "v",
            description:
                "print a message for each major step",
        },
        baseDir: {
            type: "string",
            short: "d",
            description:
                "set the base directory for all operations",
        },
        tsconfigFileName: {
            type: "string",
            short: "c",
            description:
                "set the name of the tsconfig file to search for",
        },
        outPath: {
            type: "string",
            short: "o",
            description: "set the output file",
        },
        debugASTPath: {
            type: "string",
            short: "a",
            description:
                "set the output file for the produced AST",
        },
    },
} as const;

/**
 * Generate the usage statement from a given config object.
 * @param config A valid IParseArgsConfig object
 * @returns A well formatted usage statement to print to console
 */
function generateUsageMessage(
    config: autouml.cli.IParseArgsConfig
): string {
    const usage = [config.usage, config.description];
    let maxLength = 0;
    let descs = [];
    if (config.options) {
        for (const [long, op] of Object.entries(
            config.options
        )) {
            const optionText = `  --${long}, -${op.short}`;
            const typeText =
                op.type === "boolean" ? "" : `<${op.type}>`;
            let t = `${optionText} ${typeText}`;
            maxLength = Math.max(maxLength, t.length);
            usage.push(t);
            descs.push(op.description);
        }
        for (let i = 2; i < usage.length; i++) {
            usage[i] += new Array(
                maxLength - usage[i].length
            )
                .fill(" ")
                .join("");
            usage[i] += `    ${descs[i - 2]}`;
        }
    }

    return usage.join("\n");
}

/**
 * Create the options object based on command line arguments. This is expected to only be called from direct invocation of this script.
 * @returns an options object, or null if parsing failed or help was invoked
 */
function createOptionsFromCLI(): autouml.cli.IOptions | null {
    // parse the command line arguments
    let commandLineArgs: {
        values: {
            [x: string]:
                | string
                | boolean
                | (string | boolean)[]
                | undefined;
        };
        positionals: string[] | [];
    };
    try {
        commandLineArgs = util.parseArgs(PARSE_ARGS_CONFIG);
    } catch (e: any) {
        throw new Error(
            `${e}\n${generateUsageMessage(
                PARSE_ARGS_CONFIG
            )}`
        );
    }

    let flags = commandLineArgs.values;

    if (flags.help) {
        console.log(
            generateUsageMessage(PARSE_ARGS_CONFIG)
        );
        return null;
    }

    const options: autouml.cli.IOptions = {
        baseDir: "./",
        tsconfigFileName: "tsconfig.json",
        outPath: "./uml.d2",
        target: autouml.codegen.Target.d2,
        verbose: false,
        debugASTPath: "",
    };

    // TODO: change options object based on command line inputs

    if (flags.verbose) {
        options.verbose = true;
    }

    if (flags.baseDir) {
        options.baseDir = flags.baseDir as string;
    }

    if (flags.tsconfigFileName) {
        options.tsconfigFileName =
            flags.tsconfigFileName as string;
    }

    if (flags.outDir) {
        options.outPath = flags.outPath as string;
    }

    if (flags.debugASTPath) {
        options.debugASTPath = flags.debugASTPath as string;
    }
    return options;
}

// if (require.main === module) {
//     let options = createOptionsFromCLI();
//     if (options) {
//         buildUML(options);
//     }
// }

export {
    PARSE_ARGS_CONFIG,
    generateUsageMessage,
    createOptionsFromCLI,
};
