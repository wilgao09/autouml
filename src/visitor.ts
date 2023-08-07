import { autouml } from "../typings";

export class VisitingMapNotDefinedError extends Error {
    constructor() {
        super("Tried visiting the nodes of a null map");
    }
}

export default abstract class Visitor {
    map: autouml.mapping.IScope | null;
    constructor(map?: autouml.mapping.IScope | null) {
        if (map) {
            this.map = map;
        } else {
            this.map = null;
        }
    }

    public visit(
        map?: autouml.mapping.IScope | null
    ): string {
        if (map !== undefined) {
            this.map = map;
        }
        if (!this.map) {
            throw new VisitingMapNotDefinedError();
        }
        return this._visit(this.map).join("\n");
    }

    private _visit(
        scope: autouml.mapping.IScope
    ): string[] {
        let childData: string[][] = [];
        for (let c of scope.children) {
            childData.push(this._visit(c));
        }

        switch (scope.scopeType) {
            case autouml.mapping.ScopeType.PROGRAM:
                return this.visitProgram(scope, childData);

            case autouml.mapping.ScopeType.FILE:
                return this.visitFile(scope, childData);

            case autouml.mapping.ScopeType.NAMESPACE:
                return this.visitNamespace(
                    scope,
                    childData
                );

            case autouml.mapping.ScopeType.CLASS:
                let fieldData: string[][] = [];
                let methodData: string[][] = [];
                let cscope: autouml.mapping.IClassScope =
                    scope as autouml.mapping.IClassScope;
                for (let f of cscope.fields) {
                    fieldData.push(this.visitClassField(f));
                }
                for (let m of cscope.methods) {
                    fieldData.push(
                        this.visitClassMethod(m)
                    );
                }
                return this.visitClass(
                    cscope,
                    childData,
                    fieldData,
                    methodData
                );

            case autouml.mapping.ScopeType.INTERFACE:
                let interfaceFields: string[][] = [];
                let iscope: autouml.mapping.IInterfaceScope =
                    scope as autouml.mapping.IInterfaceScope;
                for (let f of iscope.interfaceData) {
                    interfaceFields.push(
                        this.visitInterfaceField(f)
                    );
                }
                return this.visitInterface(
                    scope as autouml.mapping.IInterfaceScope,
                    childData,
                    interfaceFields
                );

            case autouml.mapping.ScopeType.ENUM:
                let enumFields: string[][] = [];
                let escope: autouml.mapping.IEnumScope =
                    scope as autouml.mapping.IEnumScope;
                for (let e of escope.enumData) {
                    enumFields.push(this.visitEnumField(e));
                }
                return this.visitEnum(
                    scope as autouml.mapping.IEnumScope,
                    childData,
                    enumFields
                );
        }
    }

    protected abstract visitProgram(
        scope: autouml.mapping.IScope,
        childData: string[][]
    ): string[];
    protected abstract visitFile(
        scope: autouml.mapping.IScope,
        childData: string[][]
    ): string[];
    protected abstract visitNamespace(
        scope: autouml.mapping.IScope,
        childData: string[][]
    ): string[];
    protected abstract visitClass(
        scope: autouml.mapping.IClassScope,
        childData: string[][],
        fieldData: string[][],
        methodData: string[][]
    ): string[];
    protected abstract visitInterface(
        scope: autouml.mapping.IInterfaceScope,
        childData: string[][],
        interfaceData: string[][]
    ): string[];
    protected abstract visitEnum(
        scope: autouml.mapping.IEnumScope,
        childData: string[][],
        enumData: string[][]
    ): string[];

    // not automatically part of the visiting scheme
    protected abstract visitEnumField(f: string): string[];
    protected abstract visitInterfaceField(
        f: autouml.mapping.IParam
    ): string[];
    protected abstract visitClassField(
        f: autouml.mapping.IClassField
    ): string[];
    protected abstract visitClassMethod(
        m: autouml.mapping.IClassMethods
    ): string[];
}
