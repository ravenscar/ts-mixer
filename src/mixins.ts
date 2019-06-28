import * as isClass from 'is-class';

/**
 * Utility function that returns the full chain of prototypes (excluding Object.prototype) from the given prototype.
 * The order will be [proto, protoParent, protoGrandparent, ...]
 */
function getProtoChain(proto: object): object[] {
	let protoChain = [];

	while(proto !== Object.prototype) {
		protoChain.push(proto);
		proto = Object.getPrototypeOf(proto);
	}

	return protoChain;
}

/**
 * Utility function that works like `Object.apply`, but copies properties with getters and setters properly as well.
 * Additionally gives the option to exclude properties by name.
 */
function copyProps(dest, src, exclude: string[] = []) {
	const props = Object.getOwnPropertyDescriptors(src);
	for (let prop of exclude) delete props[prop];
	Object.defineProperties(dest, props);
}

/**
 * Shorthand Array<any> type.
 */
type Arr = Array<any>;

/**
 * A rigorous type alias for a class.
 */
type Class<CtorArgs extends Arr = Arr, InstanceType = {}, StaticType = {}> =
	{new(...args: CtorArgs): InstanceType} & {[K in keyof StaticType]: StaticType[K]};

function createMixinClass(Base: Class, ...ingredients: Class[]) {
  // Start building a class that represents the mixture of the given Base and Class
  class Mixed extends Base {
    constructor(...args) {
      super(...args);
      for (const constructor of ingredients) {
        // If the constructor is a callable JS function, we would prefer to apply it directly to `this`,
        if (!isClass(constructor)) constructor.apply(this, args);

        // but if it's an ES6 class, we can't call it directly so we have to instantiate it and copy props
        else copyProps(this, new constructor(...args));
      }
    }
  }
  
  return Mixed;
}

function copyPrototypes(Mixed: Class,...ingredients: Class[]) {
  // Apply prototypes, including those up the chain
  let mixedClassProto = Mixed.prototype, appliedPrototypes = [];
  for (let item of ingredients) {
    let protoChain = getProtoChain(item.prototype as any);

    // Apply the prototype chain in reverse order, so that old methods don't override newer ones; also make sure
    // that the same prototype is never applied more than once.
    for(let i = protoChain.length - 1; i >= 0; i --) {
      let newProto = protoChain[i];

      if (appliedPrototypes.indexOf(newProto) === -1) {
        copyProps(mixedClassProto, protoChain[i], ['constructor']);
        appliedPrototypes.push(newProto);
      }
    }
  }
}

function copyStatics(Mixed : Class, ...ingredients: Class[]) {
  // Mix static properties by linking to the original static props with getters/setters
  for (let constructor of ingredients) {
    for (let prop in constructor) {
      if (!Mixed.hasOwnProperty(prop)) {
        Object.defineProperty(Mixed, prop, {
          get() { return (constructor as any)[prop]; },
          set(val) { (constructor as any)[prop] = val; },
          enumerable: true,
          configurable: false
        });
      }
    }
  }
}

/**
 * Mixes a number of classes together.  Overloads are provided for up to 10 inputs, which should be more than plenty.
 */
function Mixin<A extends Arr, C1,S1>(
	c1: Class<A,C1,S1>,
): Class<A,C1,S1>;

function Mixin<A extends Arr, C1,S1, C2,S2>(
	c1: Class<A,C1,S1>,
	c2: Class<A,C2,S2>,
): Class<A, C1&C2, S1&S2>;

function Mixin<A extends Arr, C1,S1, C2,S2, C3,S3>(
	c1: Class<A,C1,S1>,
	c2: Class<A,C2,S2>,
	c3: Class<A,C3,S3>
): Class<A, C1&C2&C3, S1&S2&S3>;

function Mixin<A extends Arr, C1,S1, C2,S2, C3,S3, C4,S4>(
	c1: Class<A,C1,S1>,
	c2: Class<A,C2,S2>,
	c3: Class<A,C3,S3>,
	c4: Class<A,C4,S4>,
): Class<A, C1&C2&C3&C4, S1&S2&S3&S4>;

function Mixin<A extends Arr, C1,S1, C2,S2, C3,S3, C4,S4, C5,S5>(
	c1: Class<A,C1,S1>,
	c2: Class<A,C2,S2>,
	c3: Class<A,C3,S3>,
	c4: Class<A,C4,S4>,
	c5: Class<A,C5,S5>,
): Class<A, C1&C2&C3&C4&C5, S1&S2&S3&S4&S5>;

function Mixin<A extends Arr, C1,S1, C2,S2, C3,S3, C4,S4, C5,S5, C6,S6>(
	c1: Class<A,C1,S1>,
	c2: Class<A,C2,S2>,
	c3: Class<A,C3,S3>,
	c4: Class<A,C4,S4>,
	c5: Class<A,C5,S5>,
	c6: Class<A,C6,S6>
): Class<A, C1&C2&C3&C4&C5&C6, S1&S2&S3&S4&S5&S6>;

function Mixin<A extends Arr, C1,S1, C2,S2, C3,S3, C4,S4, C5,S5, C6,S6, C7,S7>(
	c1: Class<A,C1,S1>,
	c2: Class<A,C2,S2>,
	c3: Class<A,C3,S3>,
	c4: Class<A,C4,S4>,
	c5: Class<A,C5,S5>,
	c6: Class<A,C6,S6>,
	c7: Class<A,C7,S7>,
): Class<A, C1&C2&C3&C4&C5&C6&C7, S1&S2&S3&S4&S5&S6&S7>;

function Mixin<A extends Arr, C1,S1, C2,S2, C3,S3, C4,S4, C5,S5, C6,S6, C7,S7, C8,S8>(
	c1: Class<A,C1,S1>,
	c2: Class<A,C2,S2>,
	c3: Class<A,C3,S3>,
	c4: Class<A,C4,S4>,
	c5: Class<A,C5,S5>,
	c6: Class<A,C6,S6>,
	c7: Class<A,C7,S7>,
	c8: Class<A,C8,S8>,
): Class<A, C1&C2&C3&C4&C5&C6&C7&C8, S1&S2&S3&S4&S5&S6&S7&S8>;

function Mixin<A extends Arr, C1,P1,S1, C2,S2, C3,S3, C4,S4, C5,S5, C6,S6, C7,S7, C8,S8, C9,S9>(
	c1: Class<A,C1,S1>,
	c2: Class<A,C2,S2>,
	c3: Class<A,C3,S3>,
	c4: Class<A,C4,S4>,
	c5: Class<A,C5,S5>,
	c6: Class<A,C6,S6>,
	c7: Class<A,C7,S7>,
	c8: Class<A,C8,S8>,
	c9: Class<A,C9,S9>,
): Class<A, C1&C2&C3&C4&C5&C6&C7&C8&C9, S1&S2&S3&S4&S5&S6&S7&S8&S9>;

function Mixin<A extends Arr, C1,S1, C2,S2, C3,S3, C4,S4, C5,S5, C6,S6, C7,S7, C8,S8, C9,S9, C10,S10>(
	c1: Class<A,C1,S1>,
	c2: Class<A,C2,S2>,
	c3: Class<A,C3,S3>,
	c4: Class<A,C4,S4>,
	c5: Class<A,C5,S5>,
	c6: Class<A,C6,S6>,
	c7: Class<A,C7,S7>,
	c8: Class<A,C8,S8>,
	c9: Class<A,C9,S9>,
	c10: Class<A,C10,S10>,
): Class<A, C1&C2&C3&C4&C5&C6&C7&C8&C9&C10, S1&S2&S3&S4&S5&S6&S7&S8&S9&S10>;

function Mixin(...ingredients: Class[]) {
  const Mixed = createMixinClass(class {}, ...ingredients);
  copyPrototypes(Mixed, ...ingredients);
  copyStatics(Mixed, ...ingredients);

	return Mixed as any;
}

function Augment<A extends Arr, C1,S1, C2,S2>(
	c1: Class<A,C1,S1>,
	c2: Class<A,C2,S2>,
): Class<A, C1&C2, S1&S2>;

function Augment(Base: Class, Extra: Class) {
  const Mixed = createMixinClass(Base, Extra);
  copyPrototypes(Base, Extra);
  copyStatics(Base, Extra);

	return Mixed as any;
}

/**
 * A decorator version of the `Mixin` function.  You'll want to use this instead of `Mixin` for mixing generic classes.
 */
const mix = (...ingredients: Class[]) =>
	// @ts-ignore
	decoratedClass => Mixin(...(ingredients.concat([decoratedClass])));

  /**
 * A decorator version of the `Augment` function.  You'll want to use this instead of `Augment` for mixing generic classes.
 */
const base = (...ingredients: Class[]) =>
decoratedClass => {
  if (ingredients.length === 0) {
    return Mixin(decoratedClass)
  }

  const Base = ingredients.shift();
  // @ts-ignore
  const Mixed = Mixin(...(ingredients.concat([decoratedClass])));

  return Augment(Base, Mixed) as any;
}

export {Mixin, mix, Augment, base};
