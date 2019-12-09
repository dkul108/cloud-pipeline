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
import moment from 'moment';

const Period = {
  month: 'month',
  quarter: 'quarter',
  halfYear: 'half-a-year',
  year: 'year',
  twoYears: '2-years',
  all: 'all'
};

function getPeriod (period) {
  const now = Date.now();
  const dateNow = moment.utc(now);
  let start;
  let end;
  let tickFormat;

  switch ((period || '').toLowerCase()) {
    case Period.month:
      start = moment.utc({y: dateNow.get('y'), M: dateNow.get('M'), d: 1});
      end = moment(start);
      end = end.add(1, 'M').add(-1, 's');
      tickFormat = 'd M';
      break;
    case Period.quarter:
      start = moment.utc({y: dateNow.get('y'), M: dateNow.get('M'), d: 1}).add(-2, 'M');
      end = moment(start);
      end = end.add(3, 'M').add(-1, 's');
      tickFormat = 'd M';
      break;
    case Period.halfYear:
      start = moment.utc({y: dateNow.get('y'), M: dateNow.get('M'), d: 1}).add(-5, 'M');
      end = moment(start);
      end = end.add(6, 'M').add(-1, 's');
      tickFormat = 'M';
      break;
    case Period.year:
      start = moment.utc({y: dateNow.get('y'), M: 0});
      end = moment(start);
      end = end.add(1, 'y').add(-1, 's');
      tickFormat = 'M';
      break;
    case Period.twoYears:
      start = moment.utc({y: dateNow.get('y'), M: 0}).add(-1, 'y');
      end = moment(start);
      end = end.add(2, 'y').add(-1, 's');
      tickFormat = 'M';
      break;
    case Period.all:
    default:
      end = dateNow;
      break;
  }
  return {
    name: period,
    tick: tickFormat,
    start,
    end
  };
}

export {
  Period,
  getPeriod
};
