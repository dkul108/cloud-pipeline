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

import Remote from '../../basic/Remote';
import defer from '../../../utils/defer';

function wait (seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

class TemplatesList extends Remote {
  constructor (quotaType) {
    super();
    this.quotaType = quotaType;
  }

  async fetch () {
    this._loadRequired = false;
    if (!this._fetchPromise) {
      this._fetchPromise = new Promise(async (resolve) => {
        this._pending = true;
        try {
          await defer();
          await wait(0.5);
          const value = JSON.parse(localStorage.getItem('quota-templates') || '[]');
          this.update({
            status: 'OK',
            payload: value
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

export default new TemplatesList();
