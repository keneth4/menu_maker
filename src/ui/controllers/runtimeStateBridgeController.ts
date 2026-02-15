import type {
  RuntimeBindingsPatch,
  RuntimeBindingsState
} from "./runtimeBindingsController";

type RuntimeStateAccessor<Value> = {
  get: () => Value;
  set: (value: Value) => void;
};

export type RuntimeStateAccessors = {
  [Key in keyof RuntimeBindingsState]: RuntimeStateAccessor<RuntimeBindingsState[Key]>;
};

export type RuntimeStateBridge = {
  getState: () => RuntimeBindingsState;
  setState: (patch: RuntimeBindingsPatch) => void;
};

export type RuntimeStateAccessorTuple<Key extends keyof RuntimeBindingsState> = [
  key: Key,
  get: () => RuntimeBindingsState[Key],
  set: (value: RuntimeBindingsState[Key]) => void
];

export const createRuntimeStateAccessors = (
  tuples: RuntimeStateAccessorTuple<keyof RuntimeBindingsState>[]
): RuntimeStateAccessors => {
  const accessors = {} as RuntimeStateAccessors;
  tuples.forEach(([key, get, set]) => {
    accessors[key] = { get, set } as RuntimeStateAccessors[typeof key];
  });
  return accessors;
};

export const createRuntimeStateBridge = (accessors: RuntimeStateAccessors): RuntimeStateBridge => {
  const stateKeys = Object.keys(accessors) as Array<keyof RuntimeBindingsState>;

  const getState = (): RuntimeBindingsState => {
    const snapshot = {} as RuntimeBindingsState;
    stateKeys.forEach((key) => {
      snapshot[key] = accessors[key].get();
    });
    return snapshot;
  };

  const setState = (patch: RuntimeBindingsPatch) => {
    (Object.keys(patch) as Array<keyof RuntimeBindingsPatch>).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(accessors, key)) return;
      accessors[key as keyof RuntimeBindingsState].set(
        patch[key as keyof RuntimeBindingsState] as never
      );
    });
  };

  return {
    getState,
    setState
  };
};
