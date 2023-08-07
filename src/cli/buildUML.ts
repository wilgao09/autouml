import { autouml } from "../../typings/typings";
import * as ts from "typescript";
import { tsconfigFileNotFoundError } from "./errors";
import { FileMapper } from "../ast/FileMapper";
import Visitor from "../visitor";
import d2Codegen from "../d2/codegen";
import * as fs from "fs";
import * as path from "path";

let VERBOSE = false;

function verbose(msg: string) {
    if (VERBOSE) {
        console.log(msg);
    }
}

function tsconfigOptions(
    options: autouml.cli.IOptions
): ts.ParsedCommandLine {
    let tsconfigName = ts.findConfigFile(
        options.baseDir,
        ts.sys.fileExists,
        options.tsconfigFileName
    );

    if (tsconfigName === undefined) {
        throw new tsconfigFileNotFoundError(
            options.baseDir,
            options.tsconfigFileName
        );
    }

    const configFile = ts.readConfigFile(
        tsconfigName,
        ts.sys.readFile
    );
    const compilerOptions = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        "./"
    );
    return compilerOptions;
}

function buildUML(options: autouml.cli.IOptions) {
    if (options.verbose) {
        VERBOSE = true;
    }
    //find tsconfig
    verbose("Finding tsconfig");
    const tsconfig = tsconfigOptions(options);
    verbose("Found tsconfig");
    // get map of the project
    verbose("Constructing mapper");
    let mapper = new FileMapper([
        ...tsconfig.fileNames,
        `${options.baseDir}/typings/**.ts`,
    ]);
    verbose("Mapping files");
    let programMap = mapper.mapFiles();
    // compile to target
    verbose("Selecting code generator");
    let visitor: Visitor;
    switch (options.target) {
        default:
            visitor = new d2Codegen(programMap);
    }
    // write to file
    verbose("Generating code");
    let code = visitor.visit();
    verbose(
        `Writing code to ${path.resolve(
            options.outputPath
        )}`
    );
    fs.writeFileSync(options.outputPath, code);
}

export { buildUML };
