# autouml

A UML generation tool for TypeScript codebases. Primarily uses the [TypeScript compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) to compile type relations and [d2](https://d2lang.com) to render the class diagrams.

## Requirements

-   node >=18

## Usage

This tool is primarily used as a command line tool. Install it using

```
npm i autouml --save-dev
```

If this is being used in code, `--save` the package instead. Refer to the documentation for more information.

The command line tool comes with a few options. For a comprehensive list, run `npx autouml --help`.

## Documentation

The official documentation can be hound [here](https://mellow-dragon-e9b084.netlify.app). This documentation is designed for developers of this project, and documents the entire codebase. For API information, refer to the exposed functions and classes listed [here](https://mellow-dragon-e9b084.netlify.app/variables/src.autoumlexports).

## Roadmap

This project can expand in a few directions. The following are a few directions that are currently being considered:

-   tsdoc integration
-   more compilation targets (mermaid, plantuml)
-   javascript project support

## Known Issues

The following is a lsit of currently known issues.

-   Empty interfaces are primitives
-   Type literals are interpreted as \_\_type
