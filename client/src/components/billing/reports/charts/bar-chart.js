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
import {observer} from 'mobx-react';
import Chart from './base';
import {colors, getColor, getBackgroundColor} from './colors';
import { BarchartDataLabelPlugin } from './extensions';

function toValueFormat (value) {
  return Math.round((+value || 0) * 100.0) / 100.0;
}

function getValues (data, keys, propertyName) {
  return (keys || []).map(key => toValueFormat(data[key][propertyName]));
}

function filterTopData (data, top) {
  if (top && data && Object.keys(data).length > top) {
    const valuedData = Object.keys(data)
      .map((key, index) => ({item: data[key], index}));
    valuedData.sort((a, b) => +b.item.value - (+a.item.value));
    const filteredData = valuedData.filter((i, index) => index < top).map(i => i.index);
    return {
      filtered: true,
      filteredData: Object.keys(data)
        .filter((d, i) => filteredData.indexOf(i) >= 0)
        .reduce((r, c) => ({...r, [c]: data[c]}), {})
    };
  }
  return {
    filteredData: data,
    filtered: false
  };
}

function BarChart (
  {
    axisPosition = 'left',
    colors: colorsConfig,
    data,
    onSelect,
    title,
    style,
    subChart,
    top = 6
  }
) {
  const {filteredData, filtered} = filterTopData(data, top);
  const groups = Object.keys(filteredData || {});
  const chartData = {
    labels: groups,
    datasets: [
      {
        label: 'Previous',
        type: 'quota-bar',
        data: getValues(filteredData, groups, 'previous'),
        borderWidth: 2,
        borderDash: [4, 4],
        borderColor: getColor(colorsConfig, 'previous') || colors.red,
        backgroundColor: getBackgroundColor(colorsConfig, 'previous') || 'transparent',
        borderSkipped: '',
        textColor: '',
        showDataLabels: true
      },
      {
        label: 'Current',
        data: getValues(filteredData, groups, 'value'),
        borderWidth: 1,
        borderColor: getColor(colorsConfig, 'current') || 'rgb(36, 85, 148)',
        backgroundColor: getBackgroundColor(colorsConfig, 'current') || 'white',
        borderSkipped: ''
      }
    ]
  };
  const options = {
    scales: {
      xAxes: [{
        gridLines: {
          drawOnChartArea: false
        },
        scaleLabel: {
          display: subChart,
          labelString: title
        }
      }],
      yAxes: [{
        position: axisPosition,
        ticks: {
          beginAtZero: true
        }
      }]
    },
    title: {
      display: !subChart && !!title,
      text: filtered ? `${title} (TOP ${top})` : title
    },
    legend: {
      display: false
    },
    tooltips: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      [BarchartDataLabelPlugin.id]: {
        showDataLabels: true,
        datasetLabels: ['Current'],
        textColor: '',
        labelPosition: 'inner'
      }
    }
  };
  return (
    <div style={Object.assign({height: '100%', position: 'relative', display: 'block'}, style)}>
      <Chart
        data={chartData}
        type="bar"
        options={options}
        plugins={[
          BarchartDataLabelPlugin.plugin
        ]}
      />
    </div>
  );
}

export default observer(BarChart);
