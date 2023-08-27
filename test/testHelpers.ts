import { autouml } from "../typings/typings";

function expectProgram(
    scope: autouml.mapping.IScope
): scope is autouml.mapping.IScope {
    expect(scope.scopeType).toBe(
        autouml.mapping.ScopeType.PROGRAM
    );
    expect(scope.parent).toBe(null);
    return true;
}

function expectFile(
    scope: autouml.mapping.IScope
): scope is autouml.mapping.IScope {
    expect(scope.scopeType).toBe(
        autouml.mapping.ScopeType.FILE
    );
    expect(scope.parent).not.toBeNull();
    expectProgram(scope.parent!);
    return true;
}
