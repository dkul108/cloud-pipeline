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

import Chart from 'chart.js';
import 'chart.js/dist/Chart.css';

Chart.defaults['quota-bar'] = Chart.defaults.line;
Chart.controllers['quota-bar'] = Chart.controllers.line.extend({
  draw: function (ease) {
    const meta = this.getMeta();
    const {xAxisID} = meta;
    const chart = this.chart;
    if (xAxisID && chart && chart.scales[xAxisID]) {
      const ctx = this.chart.ctx;
      const {data = [], index} = meta || {};
      const {borderWidth, borderColor, borderDash} = this.getDataset();
      const bars = this.chart.config.data.datasets
        .map((d, i) => this.chart.getDatasetMeta(i))
        .filter(d => d.index !== index && d.type === 'bar');
      ctx.save();
      if (borderColor) {
        ctx.strokeStyle = borderColor;
      }
      if (borderWidth !== undefined) {
        ctx.lineWidth = borderWidth;
      }
      if (borderDash) {
        ctx.setLineDash(borderDash);
      } else {
        ctx.setLineDash([]);
      }
      if (bars.length) {
        for (let i = 0; i < data.length; i++) {
          const dataItem = data[i];
          const left = Math.min(
            ...bars
              .filter(b => b.data && b.data.length > i)
              .map(b => b.data[i]._view.x - b.data[i]._view.width / 2.0)
          );
          const right = Math.max(
            ...bars
              .filter(b => b.data && b.data.length > i)
              .map(b => b.data[i]._view.x + b.data[i]._view.width / 2.0)
          );
          ctx.beginPath();
          ctx.moveTo(left, dataItem._view.y);
          ctx.lineTo(right, dataItem._view.y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
});

Chart.defaults.global.datasets['quota-bar'] = {showLine: false};
