/* eslint-disable max-len */
declare function each<T>( array: ArrayLike<T>, callback: ( this: T, indexInArray: number, value: T ) => false | void ): ArrayLike<T>;
declare function each<T, K extends keyof T>( obj: T, callback: ( this: T[K], propertyName: K, valueOfProperty: T[K] ) => false | void ): T;
export = each;
