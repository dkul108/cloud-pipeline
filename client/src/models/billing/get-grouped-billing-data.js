/*
 * Copyright 2017-2019 EPAM Systems, Inc. (https://www.epam.com/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Remote from '../basic/Remote';
import defer from '../../utils/defer';
import UsersList from '../user/Users';
import dataStoragesList from '../dataStorage/DataStorages';
import InstanceTypes from '../utils/InstanceTypes';
import pipelines from '../pipelines/Pipelines';
import dockerRegistries from '../tools/DockerRegistriesTree';

function wait (seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

class GetGroupedBillingData extends Remote {
  constructor (filters, groupedBy) {
    super();
    this.filters = filters;
    this.groupedBy = groupedBy;
  }

  static GROUP_BY = {
    billingCenters: 'billingCenters',
    resources: 'resource',
    storages: 'storages',
    objectStorages: 'objectStorages',
    fileStorages: 'fileStorages',
    instances: 'instances',
    pipelines: 'pipelines',
    tools: 'tools'
  };

  async fetch () {
    this._loadRequired = false;
    if (!this._fetchPromise) {
      this._fetchPromise = new Promise(async (resolve) => {
        this._pending = true;
        try {
          await defer();
          await wait(0.5);
          console.log(
            'Get grouped billing data: filters',
            this.filters,
            'groupedBy',
            this.groupedBy
          );
          const payload = {};
          if (this.groupedBy === GetGroupedBillingData.GROUP_BY.billingCenters) {
            if (this.filters && this.filters.group) {
              const request = new UsersList();
              await request.fetch();
              if (request.loaded) {
                const users = (request.value || []).map(u => u);
                for (let u = 0; u < users.length; u++) {
                  const user = users[u];
                  const runsCount = Math.round(2 + Math.random() * 20);
                  const spendings = Math.random() * 1000;
                  payload[user.userName] = {
                    value: spendings,
                    previous: Math.random() * 100,
                    user: {
                      ...user,
                      runsCount,
                      runsDuration: runsCount * Math.random(),
                      storageUsage: 200 * Math.random(),
                      spendings
                    }
                  };
                }
              }
            } else {
              const billingCenters = [
                'OMICS',
                'MEDLABICS',
                'SUNHEALTH',
                'HUMANITY-GENX',
                'ONKOLAB',
                'K-TECKMED'
              ];
              for (let bc = 0; bc < billingCenters.length; bc++) {
                const name = billingCenters[bc];
                payload[name] = {
                  value: Math.random() * 100,
                  previous: Math.random() * 100
                };
              }
            }
          } else if (this.groupedBy === GetGroupedBillingData.GROUP_BY.resources) {
            payload['Storage'] = {
              'File': {
                value: Math.random() * 100,
                previous: Math.random() * 100
              },
              'Object': {
                value: Math.random() * 100,
                previous: Math.random() * 100
              }
            };
            payload['Compute instances'] = {
              'CPU': {
                value: Math.random() * 100,
                previous: Math.random() * 100
              },
              'GPU': {
                value: Math.random() * 100,
                previous: Math.random() * 100
              }
            };
          } else if (
            [
              GetGroupedBillingData.GROUP_BY.storages,
              GetGroupedBillingData.GROUP_BY.fileStorages,
              GetGroupedBillingData.GROUP_BY.objectStorages
            ].indexOf(this.groupedBy) >= 0
          ) {
            await dataStoragesList.fetchIfNeededOrWait();
            if (dataStoragesList.loaded) {
              let filter = () => true;
              switch (this.groupedBy) {
                case GetGroupedBillingData.GROUP_BY.fileStorages:
                  filter = e => /^(nfs|dts)$/i.test(e.type);
                  break;
                case GetGroupedBillingData.GROUP_BY.objectStorages:
                  filter = e => /^(s3|az|gs)$/i.test(e.type);
                  break;
              }
              const storages = (dataStoragesList.value || [])
                .filter(filter);
              for (let s = 0; s < storages.length; s++) {
                const storage = storages[s];
                payload[storage.name] = {
                  value: Math.random() * 100,
                  previous: Math.random() * 100,
                  info: storage
                };
              }
            }
          } else if (this.groupedBy === GetGroupedBillingData.GROUP_BY.instances) {
            const instances = new InstanceTypes();
            await instances.fetchIfNeededOrWait();
            const match = instance => !this.filters || !this.filters.type
              ? true
              : (
                /^gpu$/i.test(this.filters.type)
                  ? +(instance.gpu) > 0
                  : (!instance.gpu || isNaN(instance.gpu))
              );
            if (instances.loaded) {
              const values = (instances.value || []).map(i => i).filter(match);
              for (let i = 0; i < values.length; i++) {
                const instance = values[i];
                payload[instance.name] = {
                  value: Math.random() * 100,
                  previous: Math.random() * 100,
                  info: instance,
                  name: instance.name
                };
              }
            }
          } else if (this.groupedBy === GetGroupedBillingData.GROUP_BY.tools) {
            await dockerRegistries.fetchIfNeededOrWait();
            if (dockerRegistries.loaded) {
              const registries = (dockerRegistries.value.registries || []).map(r => r);
              for (let r = 0; r < registries.length; r++) {
                const groups = (registries[r].groups || []).map(g => g);
                for (let g = 0; g < groups.length; g++) {
                  const tools = (groups[g].tools || []).map(t => t);
                  for (let t = 0; t < tools.length; t++) {
                    const tool = tools[t];
                    const name = tool.image.split('/').pop();
                    payload[name] = {
                      value: Math.random() * 100,
                      previous: Math.random() * 100,
                      info: tool,
                      name: name
                    };
                  }
                }
              }
            }
          } else if (this.groupedBy === GetGroupedBillingData.GROUP_BY.pipelines) {
            await pipelines.fetchIfNeededOrWait();
            if (pipelines.loaded) {
              const values = (pipelines.value || []).map(i => i);
              for (let i = 0; i < values.length; i++) {
                const pipeline = values[i];
                payload[pipeline.name] = {
                  value: Math.random() * 100,
                  previous: Math.random() * 100,
                  info: pipeline,
                  name: pipeline.name
                };
              }
            }
          }
          this.update({
            status: 'OK',
            payload
          });
        } catch (e) {
          this.failed = true;
          this.error = e.toString();
        }
        this._pending = false;
        this._fetchPromise = null;
        resolve();
      });
    }
    return this._fetchPromise;
  }
}

export default GetGroupedBillingData;
