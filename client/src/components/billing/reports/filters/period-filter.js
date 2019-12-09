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

import React from 'react';
import {Radio} from 'antd';
import {Period} from '../periods';

export default function ({onChange, filter}) {
  return (
    <Radio.Group value={filter} onChange={e => onChange(e.target.value)}>
      <Radio.Button key={Period.all} value={Period.all}>All</Radio.Button>
      <Radio.Button key={Period.twoYears} value={Period.twoYears}>2 years</Radio.Button>
      <Radio.Button key={Period.year} value={Period.year}>Year</Radio.Button>
      <Radio.Button key={Period.halfYear} value={Period.halfYear}>6 months</Radio.Button>
      <Radio.Button key={Period.quarter} value={Period.quarter}>3 months</Radio.Button>
      <Radio.Button key={Period.month} value={Period.month}>Month</Radio.Button>
    </Radio.Group>
  );
}
