class MissingArgumentError extends Error {
    constructor(fnName: string) {
        super(`Missing argument in [${fnName}]`);
    }
}
