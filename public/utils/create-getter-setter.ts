/*
 * Wazuh app - Create Getter Setter
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export type Get<T> = () => T;
export type Set<T> = (value: T) => void;

export const createGetterSetter = <T extends object>(name: string): [Get<T>, Set<T>] => {
  let value: T;

  const get: Get<T> = () => {
    if (!value) throw new Error(`${name} was not set.`);
    return value;
  };

  const set: Set<T> = (newValue) => {
    value = newValue;
  };

  return [get, set];
};
