declare namespace A {
    namespace B {
        enum X {
            DOLOR = "DOLOR",
            SIT = "SIT",
            AMET = 0,
        }
    }
    interface K {
        s: string;
        a: number;
        g: Map<Array<number>, C.Z>;
    }
    namespace C {
        interface Z {}
    }
    namespace D {
        namespace F {
            class N {
                private x: number;
                public z: string;
                constructor(k: number);
                public fn1(z: Array<N>): boolean;
                private fn2(): string;
            }
        }
    }
}

function useful(t: A.B.X) {
    switch (t) {
        case A.B.X.AMET: {
            console.log("fdfef");
            break;
        }
        case A.B.X.SIT: {
            console.log("ddvdvd");
            break;
        }
        case A.B.X.DOLOR: {
            console.log("fdfdvssvdvef");
            break;
        }
    }
}

useful(A.B.X.DOLOR);
