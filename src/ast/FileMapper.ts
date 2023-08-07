import ts from "typescript";
import { readFileSync } from "fs";
import { autouml } from "../../typings";

class FileMapper {
    private map: autouml.mapping.IScope;
    private currentScope: autouml.mapping.IScope;
    private numconstructors: number;
    constructor() {
        this.map = {
            scopeType: autouml.mapping.ScopeType.PROGRAM,
            name: "program",
            children: [],
            parent: null,
        };
        this.currentScope = this.map;
        this.numconstructors = 0;
    }

    public startScope(
        name: string,
        type: autouml.mapping.ScopeType
    ) {
        let scope: any = {
            scopeType: type,
            name: name,
            children: [],
            parent: this.currentScope,
        };
        // TODO: very risky programming
        switch (type) {
            case autouml.mapping.ScopeType.ENUM:
                scope.enumData = [];
                break;
            case autouml.mapping.ScopeType.INTERFACE:
                scope.interfaceData = [];
                break;
            case autouml.mapping.ScopeType.CLASS:
                scope.fields = [];
                scope.methods = [];
                break;
        }
        this.currentScope.children.push(
            scope as autouml.mapping.IScope
        );
        this.currentScope = scope;
    }

    public endScope() {
        let pscope = this.currentScope.parent;
        if (pscope !== null) {
            this.currentScope = pscope;
        }
    }

    public getMapping(): autouml.mapping.IScope {
        return this.map;
    }

    public addEnumMember(name: string) {
        if (
            this.currentScope.scopeType ===
            autouml.mapping.ScopeType.ENUM
        ) {
            let escope = this
                .currentScope as autouml.mapping.IEnumScope;
            escope.enumData.push(name);
        }
    }

    public addPropertySignature(
        name: string,
        type: autouml.mapping.ITSType
    ) {
        if (
            this.currentScope.scopeType ===
            autouml.mapping.ScopeType.INTERFACE
        ) {
            let escope = this
                .currentScope as autouml.mapping.IInterfaceScope;
            escope.interfaceData.push({
                name,
                type,
            });
        }
    }

    public addPropertyDeclaration(
        name: string,
        access: Set<autouml.mapping.AccessModifier>,
        type: autouml.mapping.ITSType
    ) {
        if (
            this.currentScope.scopeType ===
            autouml.mapping.ScopeType.CLASS
        ) {
            let escope = this
                .currentScope as autouml.mapping.IClassScope;
            escope.fields.push({
                name,
                type,
                access,
            });
        }
    }

    public addMethod(
        name: string,
        access: Set<autouml.mapping.AccessModifier>,
        type: autouml.mapping.ITSType,
        parameters: autouml.mapping.IParam[],
        isConstructor: boolean = false
    ) {
        if (
            this.currentScope.scopeType ===
            autouml.mapping.ScopeType.CLASS
        ) {
            let escope = this
                .currentScope as autouml.mapping.IClassScope;
            let obj = {
                name,
                type,
                access,
                parameters,
                isConstructor: isConstructor,
            };
            if (isConstructor) {
                escope.methods.splice(
                    this.numconstructors,
                    0,
                    obj
                );
                this.numconstructors++;
            } else {
                escope.methods.push(obj);
            }
        }
    }
}

export { FileMapper };
