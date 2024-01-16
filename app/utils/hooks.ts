import { useMemo, useState, useRef } from "react";
import { useAppConfig } from "../store";
import { collectModels } from "./model";

export function useAllModels() {
  const configStore = useAppConfig();
  const models = useMemo(() => {
    return collectModels(configStore.models);
  }, [configStore.models]);

  return models;
}

export const useGetState = <T = any>(
  initVal: T,
): [T, (arg: T) => void, () => T] => {
  const [state, setState] = useState(initVal);
  const ref = useRef(initVal);
  const _setState = (newVal: T) => {
    ref.current = newVal;
    setState(newVal);
  };
  const getState = (): T => {
    return ref.current;
  };
  return [state, _setState, getState];
};
