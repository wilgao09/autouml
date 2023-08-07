/**
 * Main entry into the program
 */

import { parseArgs } from "node:util";
import { autouml } from "../typings/typings";
import { buildUML } from "./cli/buildUML";

const commandLineArgs = parseArgs({
    options: {
        help: {
            type: "boolean",
            short: "h",
        },
        verbose: {
            type: "boolean",
            short: "v",
        },
    },
});

const USAGE = `
Usage: autouml [OPTION]...
    Automatically generates UML diagrams for typescript projects. This makes use of the local tsconfig.json.
`;

let flags = commandLineArgs.values;

if (flags.help) {
    console.log(USAGE);
    process.exit(0);
}

const options: autouml.cli.IOptions = {
    baseDir: "./",
    tsconfigFileName: "tsconfig.json",
    outputPath: "./uml.d2",
    target: autouml.codegen.Target.d2,
    verbose: false,
};

// TODO: change options object based on command line inputs

if (flags.verbose) {
    options.verbose = true;
}

buildUML(options);
