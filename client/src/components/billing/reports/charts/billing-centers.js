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
import Chart from './base';
import {colors} from './colors';
import BillingCentersData from './data/billing-centers';

function getBillingCenters() {
  return Object.keys(BillingCentersData);
}

function getValues(centers, property) {
  return centers.map(center => BillingCentersData[center][property]);
}

const BillingCentersNames = getBillingCenters();

class BillingCenters extends React.Component {
  render () {
    const data = {
      labels: BillingCentersNames,
      datasets: [
        {
          label: 'Quota',
          type: 'quota-bar',
          data: getValues(BillingCentersNames, 'previous'),
          borderWidth: 2,
          borderColor: colors.orange,
          backgroundColor: 'white',
          borderSkipped: ''
        },
        {
          label: 'Current',
          data: getValues(BillingCentersNames, 'current'),
          borderWidth: 1,
          borderColor: 'rgb(36, 85, 148)',
          backgroundColor: 'white',
          borderSkipped: ''
        }
      ]
    };
    const options = {
      scales: {
        xAxes: [{
          gridLines: {
            drawOnChartArea: false
          }
        }]
      },
      title: {
        display: true,
        text: 'Billing centers (TOP 6)'
      },
      legend: {
        position: 'right'
      },
      tooltips: {
        intersect: false,
        mode: 'index'
      }
    };
    return (
      <div style={{height: '100%', position: 'relative', display: 'block'}}>
        <Chart data={data} type="bar" options={options} />
      </div>
    );
  }
}

export default BillingCenters;
