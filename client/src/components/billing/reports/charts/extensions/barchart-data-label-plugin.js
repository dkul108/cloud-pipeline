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

const id = 'barchart-data-label';

function isNotSet (v) {
  return v === undefined || v === null;
}

const plugin = {
  id,
  afterDatasetsDraw: function (chart, ease, pluginOptions) {
    // console.log('chart', chart.options.title.text)
    if (pluginOptions && pluginOptions.showDataLabels) {
      const {
        datasetLabels = [],
        textColor,
        labelPosition = 'inner'
      } = pluginOptions;
      const ctx = chart.chart.ctx;
      const getDataIndex = (data = [], label) => {
        return data.reduce((searchIndex, data, index) => {
          if (data.label === label) {
            searchIndex = index;
          }
          return searchIndex;
        }, null);
      };
      const getTextColor = (element, title) => {
        const borderColor = element._view.borderColor;
        let color = textColor || borderColor;
        if (!textColor && labelPosition === 'inner' && title !== 'Billing centers') {
          color = 'white';
        }
        return color;
      };
      chart.data.datasets
        .map((dataset, i) => {
          const dataIndex = datasetLabels.includes(dataset.label)
            ? getDataIndex(chart.data.datasets, dataset.label)
            : null;
          if (isNotSet(dataIndex)) {
            return null;
          }
          const meta = chart.getDatasetMeta(dataIndex);
          if (meta) {
            meta.data.forEach((element, index) => {
              const title = element._chart.options.title.text;
              ctx.fillStyle = getTextColor(element, title);
              const fontSize = 14;
              const dataString = dataset.data[index].toString();
              const padding = 5;
              const position = element.tooltipPosition();
              ctx.font = '14px serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              labelPosition === 'inner'
                ? ctx.fillText(dataString, position.x, position.y + fontSize + padding)
                : ctx.fillText(dataString, position.x, position.y - padding);
            });
          }
        });
    }
  }
};

export {id, plugin};
