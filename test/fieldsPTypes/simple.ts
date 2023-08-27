interface I2 {
    k: 9;
}

interface I3<T> {
    h: 8;
}

interface I1 {
    x: I3<I2>;
    // y: Array<I1>;
}
