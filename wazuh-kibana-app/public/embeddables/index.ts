/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  TableContainer,
  TABLE_CONTAINER,
  TableContainerFactoryDefinition,
  TableContainerFactory
} from './table';
import {
  HELLO_WORLD_EMBEDDABLE,
  HelloWorldEmbeddable,
  HelloWorldEmbeddableFactory,
  HelloWorldEmbeddableFactoryDefinition
} from './hello-world';

import { CoreSetup } from 'opensearch_dashboards/public';
import {
  EmbeddableSetup,
  EmbeddableStart,
  CONTEXT_MENU_TRIGGER,
} from '../../../../src/plugins/embeddable/public';
import {
  WazuhSetupPlugins,
  WazuhStartPlugins,
} from '../types';


export interface EmbeddableFactories {
  getTableContainerEmbeddableFactory?: () => TableContainerFactory;
  getHelloWorldEmbeddableFactory?: () => HelloWorldEmbeddableFactory;
}

export function RegisterEmbeddable(
  core: CoreSetup<WazuhStartPlugins>,
  plugins: WazuhSetupPlugins) {
  const factories: EmbeddableFactories = {};
  factories.getTableContainerEmbeddableFactory = plugins.embeddable.registerEmbeddableFactory(
    TABLE_CONTAINER,
    new TableContainerFactoryDefinition(async () => ({
      embeddableServices: (await core.getStartServices())[1].embeddable,
    }))
  );
  factories.getHelloWorldEmbeddableFactory = plugins.embeddable.registerEmbeddableFactory(
    HELLO_WORLD_EMBEDDABLE,
    new HelloWorldEmbeddableFactoryDefinition()
  );

  return factories;
}
