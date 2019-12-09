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
import ResourcesData from './data/resources';
import {colors} from './colors';

class Resources extends React.Component {
  render () {
    const data1 = {
      labels: ['Object', 'File'],
      datasets: [
        {
          label: 'Quota',
          type: 'quota-bar',
          data: [
            ResourcesData.storages.object.previous + (2.0 * Math.random() - 1.0) * 100,
            ResourcesData.storages.file.previous + (2.0 * Math.random() - 1.0) * 100
          ],
          backgroundColor: 'white',
          borderWidth: 2,
          borderDash: [2, 2],
          borderColor: colors.orange
        },
        {
          label: 'Current',
          data: [
            ResourcesData.storages.object.current,
            ResourcesData.storages.file.current
          ],
          borderWidth: 0,
          backgroundColor: colors.current
        },
        {
          label: 'Previous',
          data: [
            ResourcesData.storages.object.previous + (2.0 * Math.random() - 1.0) * 100,
            ResourcesData.storages.file.previous + (2.0 * Math.random() - 1.0) * 100
          ],
          borderWidth: 0,
          backgroundColor: colors.previous
        }
      ]
    };
    const data2 = {
      labels: ['CPU', 'GPU'],
      datasets: [
        {
          label: 'Quota',
          type: 'quota-bar',
          data: [
            ResourcesData.compute.cpu.previous + (2.0 * Math.random() - 1.0) * 100,
            ResourcesData.compute.gpu.previous + (2.0 * Math.random() - 1.0) * 100
          ],
          backgroundColor: 'white',
          borderWidth: 2,
          borderDash: [2, 2],
          borderColor: colors.orange
        },
        {
          label: 'Current',
          data: [
            ResourcesData.compute.cpu.current,
            ResourcesData.compute.gpu.current
          ],
          borderWidth: 0,
          backgroundColor: colors.current
        },
        {
          label: 'Previous',
          data: [
            ResourcesData.compute.cpu.previous + (2.0 * Math.random() - 1.0) * 100,
            ResourcesData.compute.gpu.previous + (2.0 * Math.random() - 1.0) * 100
          ],
          borderWidth: 0,
          backgroundColor: colors.previous
        }
      ]
    };
    const options1 = {
      scales: {
        xAxes: [{
          gridLines: {
            drawOnChartArea: false
          },
          scaleLabel: {
            display: true,
            labelString: 'Storage'
          }
        }],
        yAxes: [{
          position: 'left',
          tick: {
            min: 0
          }
        }]
      },
      title: {
        display: false
      },
      legend: {
        display: false
      },
      tooltips: {
        intersect: false,
        mode: 'index'
      }
    };
    const options2 = {
      scales: {
        xAxes: [{
          gridLines: {
            drawOnChartArea: false
          },
          scaleLabel: {
            display: true,
            labelString: 'Compute instances'
          }
        }],
        yAxes: [{
          position: 'right',
          tick: {
            min: 0
          }
        }]
      },
      title: {
        display: false
      },
      legend: {
        position: 'right',
        display: false
      },
      tooltips: {
        intersect: false,
        mode: 'index'
      }
    };
    return (
      <div style={{position: 'relative', width: '100%', height: '100%', display: 'block'}}>
        <div style={{position: 'relative', width: '50%', height: '100%', display: 'inline-block'}}>
          <Chart data={data1} type="bar" options={options1} />
        </div>
        <div style={{position: 'relative', width: '50%', height: '100%', display: 'inline-block'}}>
          <Chart data={data2} type="bar" options={options2} />
        </div>
      </div>
    );
  }
}

export default Resources;
