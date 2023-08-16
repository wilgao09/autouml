import ts, { isEnumDeclaration } from "typescript";
import { readFileSync } from "fs";
import { MissingArgumentError } from "./MissingArgumentError";
import { autouml } from "../../typings/typings";
import { mapFiles } from "./helpers";

interface K {
    good: boolean;
}

class X implements K {
    good: boolean = true;
}

class FileMapper {
    private map: autouml.mapping.IScope;
    private currentScope: autouml.mapping.IScope;
    private numconstructors: number;
    private disallowNewFunctions: number;
    private relations: autouml.mapping.IConnector[];

    // NOTE: these two are not used by this class itself; they are passed
    // to helper functions. These are here for bookkeeping reasons
    private files: string[];
    private tsoptions: ts.CompilerOptions | {};
    constructor(files: string[], tsoptions?: ts.CompilerOptions) {
        this.map = {
            scopeType: autouml.mapping.ScopeType.PROGRAM,
            name: "program",
            children: [],
            parent: null,
            connectors: [],
        };
        this.currentScope = this.map;
        this.numconstructors = 0;
        this.tsoptions = tsoptions ?? {};
        this.files = files;
        this.disallowNewFunctions = 0;
        this.relations = [];
    }

    public mapFiles(): [autouml.mapping.IScope, autouml.mapping.IConnector[]] {
        mapFiles(this, this.tsoptions);
        return [this.map, this.relations];
    }

    public getFiles(): Readonly<string[]> {
        return this.files;
    }

    public getCurrentFileName(): string {
        // go up the scope tree until you find one that is a file
        let s = this.currentScope;
        while (s.scopeType != autouml.mapping.ScopeType.FILE && s != null) {
            let p = s.parent;
            if (p) {
                s = p;
            }
        }

        return s.name;
    }

    /**
     * Prevent the adding of new scopes. This is used to deal with
     * inner functions. Note that each call to preventNewScope
     * mostbe accompanied by a call to allowNewScopes
     */
    public preventNewFunctions() {
        this.disallowNewFunctions++;
    }

    public allowNewFunctions() {
        this.disallowNewFunctions--;
    }

    public startScope(
        name: string,
        type: autouml.mapping.ScopeType,
        scopeITSType?: autouml.mapping.ITSType
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
        if (scopeIsEnumInterfaceOrClass(scope)) {
            if (scopeITSType) {
                scope.selfType = scopeITSType;
            } else {
                throw new MissingArgumentError("startScope");
            }
        }
        this.currentScope.children.push(scope as autouml.mapping.IScope);
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
        if (scopeIsEnum(this.currentScope)) {
            this.currentScope.enumData.push(name);
        }
    }

    public addPropertySignature(name: string, type: autouml.mapping.ITSType) {
        if (scopeIsInterface(this.currentScope)) {
            this.currentScope.interfaceData.push({
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
        if (scopeIsClass(this.currentScope)) {
            this.currentScope.fields.push({
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
        if (this.disallowNewFunctions) {
            return;
        }
        if (scopeIsClass(this.currentScope)) {
            let obj = {
                name,
                type,
                access,
                parameters,
                isConstructor: isConstructor,
            };
            if (isConstructor) {
                this.currentScope.methods.splice(this.numconstructors, 0, obj);
                this.numconstructors++;
            } else {
                this.currentScope.methods.push(obj);
            }
        }
    }

    // add a relationship between two types
    // originally intended for inheritance and implementation
    public addRelation(
        src: autouml.mapping.ITSType,
        type: autouml.mapping.ConnectorType,
        dst: autouml.mapping.ITSType
    ) {
        this.relations.push({
            src,
            type,
            dst,
        });
    }

    // add connections to the current scope
    // originally designed for dependence, aggregation, composition
    public addCurrentScopeRelation(
        type: autouml.mapping.ConnectorType,
        dst: autouml.mapping.ITSType
    ) {
        if (
            scopeIsEnumInterfaceOrClass(this.currentScope) &&
            !dst.isPrimitive
        ) {
            this.relations.push({
                src: this.currentScope.selfType,
                type,
                dst,
            });
        }
    }
}

function scopeIsInterface(
    s: autouml.mapping.IScope
): s is autouml.mapping.IInterfaceScope {
    return s.scopeType === autouml.mapping.ScopeType.INTERFACE;
}

function scopeIsClass(
    s: autouml.mapping.IScope
): s is autouml.mapping.IClassScope {
    return s.scopeType === autouml.mapping.ScopeType.CLASS;
}

function scopeIsEnum(
    s: autouml.mapping.IScope
): s is autouml.mapping.IEnumScope {
    return s.scopeType === autouml.mapping.ScopeType.ENUM;
}

function scopeIsEnumInterfaceOrClass(
    s: autouml.mapping.IScope
): s is
    | autouml.mapping.IClassScope
    | autouml.mapping.IInterfaceScope
    | autouml.mapping.IEnumScope {
    return (
        s.scopeType === autouml.mapping.ScopeType.CLASS ||
        s.scopeType === autouml.mapping.ScopeType.INTERFACE ||
        s.scopeType === autouml.mapping.ScopeType.ENUM
    );
}

export { FileMapper };
