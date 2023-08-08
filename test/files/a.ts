// import { K } from "./simple";

type Z = X.M;
declare namespace X {
    interface M {
        z: number;
        y: number;
        x: Z;
    }
    // const enum K {
    //     ASC,
    //     DESC,
    // }
}
