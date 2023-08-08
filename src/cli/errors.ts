import * as path from "path";

class tsconfigFileNotFoundError extends Error {
    constructor(baseDir: string, fileName: string) {
        super(
            `Failed to find ${fileName} in ${baseDir} (resolved as ${path.resolve(
                baseDir,
                fileName
            )})`
        );
    }
}

export { tsconfigFileNotFoundError };
