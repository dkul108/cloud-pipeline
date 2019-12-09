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
import moment from 'moment';

function wait (seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

class GetBillingData extends Remote {
  constructor (start, end) {
    super();
    this.start = start;
    this.end = end;
  }

  async fetch () {
    this._loadRequired = false;
    if (!this._fetchPromise) {
      this._fetchPromise = new Promise(async (resolve) => {
        this._pending = true;
        try {
          await defer();
          await wait(0.5);
          console.log(
            'Get billing data: start',
            this.start ? this.start.format() : null,
            'end',
            this.end ? this.end.format() : null
          );
          if (!this.start) {
            this.start = moment.utc().add(-4, 'y');
            console.log('Setting early start date:', this.start.format());
          }
          const values = [];
          const dateRange = this.end - this.start;
          const range = Math.round(moment.duration(dateRange).asMonths());
          const quotaPerMonth = 1500;
          const previousQuotaPerMonth = 1400;
          const quota = range * quotaPerMonth;
          const previousQuota = range * previousQuotaPerMonth;
          const perDay = quotaPerMonth / 30.0;
          const perDayPrevious = previousQuotaPerMonth / 30.0;
          let value = 0;
          let previous = 0;
          const processDate = (d) => {
            let add = perDay * 2 * Math.random();
            value = Math.round((value + add) * 100.0) / 100.0;
            add = perDayPrevious * 2 * Math.random();
            previous = Math.round((previous + add) * 100.0) / 100.0;
            values.push({
              date: d.format(),
              value: d > moment.now() ? undefined : value,
              previous
            });
            return moment(d).add(1, 'd');
          };
          let date = processDate(this.start);
          while (date <= this.end) {
            date = processDate(date);
          }
          this.update({
            status: 'OK',
            payload: {
              quota,
              previousQuota,
              values
            }
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

export default GetBillingData;
