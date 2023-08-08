class A {}

class B extends A {}
class D<T extends B> {}

type AB = A | B;
class C extends A implements B, D<B> {
    public map: Map<A, B>;
}
