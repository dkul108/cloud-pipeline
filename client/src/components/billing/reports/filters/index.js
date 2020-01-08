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
import {inject, Provider} from 'mobx-react';
import PeriodFilter from './period-filter';
import ReportFilter from './report-filter';
import RunnerFilter, {RunnerType} from './runner-filter';
import {Period} from '../periods';
import ReportsRouting from '../routing';
import styles from '../reports.css';

class Filter {
  period;
  report;
  runner;

  rebuild = ({location, router}) => {
    this.router = router;
    const {
      period = Period.month,
      user,
      group
    } = (location || {}).query || {};
    if (user) {
      this.runner = {
        type: RunnerType.user,
        id: user
      };
    } else if (group) {
      this.runner = {
        type: RunnerType.group,
        id: group
      };
    } else {
      this.runner = undefined;
    }
    this.report = ReportsRouting.parse(location);
    this.period = period;
  };

  navigate = (navigation) => {
    let {report, runner, period} = navigation || {};
    if (report === undefined) {
      report = this.report;
    }
    if (runner === undefined) {
      runner = this.runner;
    }
    if (period === undefined) {
      period = this.period;
    }
    const params = [
      runner && runner.type === RunnerType.user && `user=${runner.id}`,
      runner && runner.type === RunnerType.group && `group=${runner.id}`,
      period && `period=${period}`
    ].filter(Boolean);
    let query = '';
    if (params.length) {
      query = `?${params.join('&')}`;
    }
    if (this.router) {
      this.router.push(`${ReportsRouting.getPath(report)}${query}`);
    }
  };

  buildNavigationFn = (property) => e => this.navigate({[property]: e});
}

class Filters extends React.Component {
  reportsFilter = new Filter();

  componentWillReceiveProps (nextProps, nextContext) {
    this.reportsFilter.rebuild(this.props);
  }

  componentDidMount () {
    this.reportsFilter.rebuild(this.props);
  }

  render () {
    if (!this.reportsFilter) {
      return null;
    }
    const {children} = this.props;
    return (
      <div className={styles.container}>
        <div className={styles.selectors}>
          <div>
            <ReportFilter
              filter={this.reportsFilter.report}
              onChange={this.reportsFilter.buildNavigationFn('report')}
            />
          </div>
          <div>
            <PeriodFilter
              filter={this.reportsFilter.period}
              onChange={this.reportsFilter.buildNavigationFn('period')}
            />
            <RunnerFilter
              filter={this.reportsFilter.runner}
              onChange={this.reportsFilter.buildNavigationFn('runner')}
            />
          </div>
          <div />
        </div>
        <div style={{marginTop: 10}}>
          <Provider reportsFilter={this.reportsFilter}>
            {children}
          </Provider>
        </div>
      </div>
    );
  }
}

export {RunnerType, Filter};

export const injectFilters = (...opts) => inject('reportsFilter')(...opts);
export default Filters;
