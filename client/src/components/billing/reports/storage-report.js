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
import {
  Table
} from 'antd';
import moment from 'moment';
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
  let groupedBy = GetGroupedBillingData.GROUP_BY.storages;
  if (/^file$/i.test(type)) {
    groupedBy = GetGroupedBillingData.GROUP_BY.fileStorages;
  }
  if (/^object$/i.test(type)) {
    groupedBy = GetGroupedBillingData.GROUP_BY.objectStorages;
  }
  return {
    user,
    group,
    type,
    summary: new GetBillingData(periodInfo.start, periodInfo.end),
    storages: new GetGroupedBillingData(filters, groupedBy)
  };
}

function renderTable ({awsRegions, storages}) {
  if (!storages || !storages.loaded) {
    return null;
  }
  const getRegionName = id => {
    if (!awsRegions || !awsRegions.loaded) {
      return null;
    }
    const [region] = (awsRegions.value || []).filter(r => +r.id === +id);
    if (region) {
      return region.name;
    }
    return null;
  };
  const columns = [
    {
      key: 'storage',
      title: 'Storage',
      render: ({info}) => {
        return info.pathMask || info.name;
      }
    },
    {
      key: 'owner',
      title: 'Owner',
      dataIndex: 'info.owner'
    },
    {
      key: 'usage',
      title: 'Usage',
      render: () => null
    },
    {
      key: 'cost',
      title: 'Cost',
      dataIndex: 'value',
      render: (value) => `$${Math.round(value * 100.0) / 100.0}`
    },
    {
      key: 'region',
      title: 'Region',
      dataIndex: 'info.regionId',
      render: getRegionName
    },
    {
      key: 'created',
      title: 'Created date',
      dataIndex: 'info.createdDate',
      render: (value) => moment.utc(value).format('D MMM YYYY')
    }
  ];
  const dataSource = Object.values(storages.value || {});
  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      size="small"
    />
  );
}

const RenderTable = inject('awsRegions')(observer(renderTable));

function StorageReports ({storages, summary, type}) {
  const getSummaryTitle = () => {
    if (/^file$/i.test(type)) {
      return 'File storages usage';
    }
    if (/^object$/i.test(type)) {
      return 'Object storages usage';
    }
    return 'Storages usage';
  };
  const getTitle = () => {
    if (/^file$/i.test(type)) {
      return 'File storages';
    }
    if (/^object$/i.test(type)) {
      return 'Object storages';
    }
    return 'Storages';
  };
  return (
    <div className={styles.container}>
      <div className={styles.chartsContainer} style={{marginLeft: 100, marginRight: 100}}>
        <ChartContainer style={{height: 175}}>
          <BillingTable
            data={summary && summary.loaded ? summary.value : null}
            showQuota={false}
          />
        </ChartContainer>
        <ChartContainer style={{flex: 1, height: 400, display: 'block'}}>
          <Summary
            data={summary && summary.loaded ? summary.value.values : []}
            title={getSummaryTitle()}
            colors={{
              previous: {color: colors.yellow},
              current: {color: colors.green}
            }}
          />
        </ChartContainer>
      </div>
      <ChartContainer
        style={{
          height: 400,
          marginLeft: 100,
          marginRight: 100,
          position: 'relative'
        }}
      >
        <BarChart
          data={storages && storages.loaded ? storages.value : {}}
          title={getTitle()}
          top={10}
          colors={{
            current: {background: colors.orange, color: colors.orange},
            previous: {background: colors.blue, color: colors.blue}
          }}
        />
      </ChartContainer>
      <ChartContainer style={{marginLeft: 100, marginRight: 100}}>
        <RenderTable storages={storages} />
      </ChartContainer>
    </div>
  );
}

export default inject(injection)(observer(StorageReports));
