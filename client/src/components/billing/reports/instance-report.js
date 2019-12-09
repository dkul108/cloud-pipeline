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
  BillingTable,
  colors,
  Summary
} from './charts';
import {Period, getPeriod} from './periods';
import {GetBillingData, GetGroupedBillingData} from '../../../models/billing';
import {ChartContainer} from './utilities';
import styles from './reports.css';

function injection (stores, props) {
  const {location, params} = props;
  const {type} = params || {};
  const {
    user,
    group,
    period = Period.month
  } = location.query;
  const periodInfo = getPeriod(period);
  const filters = {start: period.start, end: period.end, group, user, type};
  return {
    type,
    summary: new GetBillingData(periodInfo.start, periodInfo.end),
    instances: new GetGroupedBillingData(
      filters,
      GetGroupedBillingData.GROUP_BY.instances
    ),
    tools: new GetGroupedBillingData(
      filters,
      GetGroupedBillingData.GROUP_BY.tools
    ),
    pipelines: new GetGroupedBillingData(
      filters,
      GetGroupedBillingData.GROUP_BY.pipelines
    )
  };
}

function renderResourcesSubData (
  {
    data,
    color = colors.orange,
    owner = true,
    title,
    singleTitle
  }
) {
  const columns = [
    {
      key: 'name',
      dataIndex: 'name',
      title: singleTitle
    },
    owner && {
      key: 'owner',
      dataIndex: 'info.owner',
      title: 'Owner'
    },
    {
      key: 'usage',
      title: 'Usage (hours)',
      render: () => null
    },
    {
      key: 'runs',
      title: 'Runs count',
      render: () => null
    },
    {
      key: 'cost',
      dataIndex: 'value',
      title: 'Cost',
      render: value => value ? `$${Math.round(value * 100.0) / 100.0}` : null
    }
  ].filter(Boolean);
  return (
    <div
      style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}
    >
      <div
        style={{
          flex: 1,
          height: 300,
          display: 'block',
          paddingRight: 5,
          position: 'relative'
        }}
      >
        <BarChart
          data={data}
          title={title}
          colors={{
            current: {background: color, color: color},
            previous: {background: colors.blue, color: colors.blue}
          }}
        />
      </div>
      <div
        style={{flex: 1, paddingLeft: 5}}
      >
        <Table
          dataSource={Object.values(data)}
          columns={columns}
          size="small"
        />
      </div>
    </div>
  );
}

const ResourcesSubData = observer(renderResourcesSubData);

function InstanceReport ({summary, instances, tools, pipelines, type}) {
  const getInstanceTitle = () => {
    if (/^cpu$/i.test(type)) {
      return 'CPU instance types';
    }
    if (/^gpu$/i.test(type)) {
      return 'GPU instance types';
    }
    return 'Instance types';
  };
  const getSummaryTitle = () => {
    if (/^cpu$/i.test(type)) {
      return 'CPU instances runs';
    }
    if (/^gpu$/i.test(type)) {
      return 'GPU instances runs';
    }
    return 'Compute instances runs';
  };
  return (
    <div className={styles.container}>
      <div
        className={styles.chartsContainer}
        style={{
          marginLeft: 10,
          marginRight: 10,
          justifyContent: 'space-around',
          alignItems: 'start'
        }}
      >
        <ChartContainer style={{width: 700}}>
          <BillingTable
            data={summary && summary.loaded ? summary.value : null}
            showQuota={false}
          />
          <Summary
            data={summary && summary.loaded ? summary.value.values : []}
            title={getSummaryTitle()}
            colors={{
              previous: {color: colors.yellow},
              current: {color: colors.green}
            }}
            style={{height: 500}}
          />
        </ChartContainer>
        <ChartContainer
          style={{minWidth: 600, flex: 1}}
        >
          <ResourcesSubData
            data={instances && instances.loaded ? instances.value : []}
            owner={false}
            color={colors.orange}
            title={getInstanceTitle()}
            singleTitle="Instance"
          />
          <ResourcesSubData
            data={tools && tools.loaded ? tools.value : []}
            owner
            color={colors.gray}
            title="Tools"
            singleTitle="Tool"
          />
          <ResourcesSubData
            data={pipelines && pipelines.loaded ? pipelines.value : []}
            owner
            color={colors.current}
            title="Pipelines"
            singleTitle="Pipeline"
          />
        </ChartContainer>
      </div>
    </div>
  );
}

export default inject('awsRegions')(inject(injection)(observer(InstanceReport)));
