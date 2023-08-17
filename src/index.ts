/**
 * This file serves to expose the most essential parts of the tool.
 */

import { FileMapper } from "./ast/FileMapper";
import { MissingArgumentError } from "./ast/MissingArgumentError";
import {
    PARSE_ARGS_CONFIG,
    generateUsageMessage,
} from "./cli/index";

import { buildUML } from "./cli/buildUML";
import { d2Codegen } from "./d2/codegen";
import { Visitor } from "./visitor";

const autoumlExports = {
    ast: {
        FileMapper,
        MissingArgumentError,
    },
    cli: {
        PARSE_ARGS_CONFIG,
        generateUsageMessage,
        buildUML,
    },
    codegen: {
        Visitor,
        d2Codegen,
    },
} as const;

export { autoumlExports };
