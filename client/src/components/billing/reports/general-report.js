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
import {inject, observer} from 'mobx-react';
import {Table} from 'antd';
import {
  BarChart,
  GroupedBarChart,
  BillingTable,
  Summary
} from './charts';
import {Period, getPeriod} from './periods';
import {GetBillingData, GetGroupedBillingData} from '../../../models/billing';
import {ChartContainer} from './utilities';
import styles from './reports.css';

function injection (stores, props) {
  const {location} = props;
  const {
    user,
    group,
    period = Period.month
  } = location.query;
  const periodInfo = getPeriod(period);
  const filters = {start: period.start, end: period.end, group};
  return {
    user,
    group,
    summary: new GetBillingData(periodInfo.start, periodInfo.end),
    billingCentersRequest: new GetGroupedBillingData(
      filters,
      GetGroupedBillingData.GROUP_BY.billingCenters
    ),
    resources: new GetGroupedBillingData(
      filters,
      GetGroupedBillingData.GROUP_BY.resources
    )
  };
}

function toValue (value) {
  if (value) {
    return Math.round((+value) * 100.0) / 100.0;
  }
  return null;
}

function toMoneyValue (value) {
  if (value) {
    return `$${Math.round((+value) * 100.0) / 100.0}`;
  }
  return null;
}

function UserReport ({billingCentersRequest, resources, summary}) {
  return (
    <div>
      <BillingTable
        data={summary && summary.loaded ? summary.value : null}
      />
      <div className={styles.chartsContainer}>
        <ChartContainer style={{flex: 1, minWidth: 700, height: 400}}>
          <Summary
            data={summary && summary.loaded ? summary.value.values : []}
            quota={summary && summary.loaded ? summary.value.quota : 0}
            title="Summary"
          />
        </ChartContainer>
        <ChartContainer style={{flex: 1, minWidth: 700, height: 400}}>
          <GroupedBarChart
            data={resources && resources.loaded ? resources.value : {}}
            title="Resources"
          />
        </ChartContainer>
      </div>
    </div>
  );
}

function GroupReport ({group, billingCenters, billingCentersRequest, resources, summary}) {
  let title = 'User\'s spendings';
  let billingCenterName;
  if (billingCenters.loaded) {
    const [billingCenter] = (billingCenters.value || []).filter(c => +c.id === +group);
    if (billingCenter) {
      billingCenterName = billingCenter.name;
      title = `${billingCenter.name} user's spendings`;
    }
  }
  const tableColumns = [{
    key: 'user',
    dataIndex: 'user.userName',
    title: 'User'
  }, {
    key: 'runs-duration',
    dataIndex: 'user.runsDuration',
    title: 'Runs duration (hours)',
    render: toValue
  }, {
    key: 'runs-count',
    dataIndex: 'user.runsCount',
    title: 'Runs count'
  }, {
    key: 'storage-usage',
    dataIndex: 'user.storageUsage',
    title: 'Storages usage (Gb/month)',
    render: toValue
  }, {
    key: 'spendings',
    dataIndex: 'user.spendings',
    title: 'Spendings',
    render: toMoneyValue
  }, {
    key: 'billingCenter',
    title: 'Billing center',
    render: () => billingCenterName
  }];
  return (
    <div style={{marginLeft: 20, marginRight: 20}}>
      <div className={styles.chartsContainer}>
        <div className={styles.chartsColumnContainer} style={{flex: 0.6}}>
          <ChartContainer style={{height: 200}}>
            <BillingTable
              data={summary && summary.loaded ? summary.value : null}
            />
          </ChartContainer>
          <ChartContainer style={{height: 600}}>
            <Summary
              data={summary && summary.loaded ? summary.value.values : []}
              quota={summary && summary.loaded ? summary.value.quota : 0}
              title="Summary"
            />
          </ChartContainer>
        </div>
        <div className={styles.chartsColumnContainer} style={{flex: 0.4}}>
          <ChartContainer style={{height: 400, position: 'relative'}}>
            <GroupedBarChart
              data={resources && resources.loaded ? resources.value : {}}
              title="Resources"
            />
          </ChartContainer>
          <ChartContainer style={{height: 400}}>
            <BarChart
              data={
                billingCentersRequest && billingCentersRequest.loaded
                  ? billingCentersRequest.value
                  : {}
              }
              title={title}
            />
          </ChartContainer>
        </div>
      </div>
      <div style={{marginTop: 10}}>
        <Table
          dataSource={
            billingCentersRequest && billingCentersRequest.loaded
              ? Object.values(billingCentersRequest.value)
              : []
          }
          columns={tableColumns}
          size="small"
        />
      </div>
    </div>
  );
}

function GeneralReport ({billingCentersRequest, resources, summary}) {
  return (
    <div className={styles.chartsContainer}>
      <div className={styles.chartsColumnContainer} style={{flex: 0.6}}>
        <ChartContainer style={{height: 200}}>
          <BillingTable
            data={summary && summary.loaded ? summary.value : null}
          />
        </ChartContainer>
        <ChartContainer style={{height: 600}}>
          <Summary
            data={summary && summary.loaded ? summary.value.values : []}
            quota={summary && summary.loaded ? summary.value.quota : 0}
            title="Summary"
          />
        </ChartContainer>
      </div>
      <div className={styles.chartsColumnContainer} style={{flex: 0.4}}>
        <ChartContainer style={{
          height: 400,
          position: 'relative',
          marginBottom: 40
        }}>
          <GroupedBarChart
            data={resources && resources.loaded ? resources.value : {}}
            title="Resources"
          />
        </ChartContainer>
        <ChartContainer style={{height: 400}}>
          <BarChart
            data={billingCentersRequest && billingCentersRequest.loaded ? billingCentersRequest.value : {}}
            title="Billing centers"
          />
        </ChartContainer>
      </div>
    </div>
  );
}

function DefaultReport (props) {
  const {user, group} = props;
  if (user) {
    return UserReport(props);
  }
  if (group) {
    return GroupReport(props);
  }
  return GeneralReport(props);
}

export default inject('billingCenters', 'users')(inject(injection)(observer(DefaultReport)));
