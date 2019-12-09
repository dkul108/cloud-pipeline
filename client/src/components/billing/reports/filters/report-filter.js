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
import {Button, Dropdown, Icon, Menu} from 'antd';

export default function ({onChange, filter}) {
  const onSelect = ({key}) => {
    onChange && onChange(key);
  };
  const storagesMenu = (
    <Menu selectedKeys={[filter]} onClick={onSelect}>
      <Menu.Item key="storages.file">File storages</Menu.Item>
      <Menu.Item key="storages.object">Object storages</Menu.Item>
    </Menu>
  );
  const instancesMenu = (
    <Menu selectedKeys={[filter]} onClick={onSelect}>
      <Menu.Item key="instances.cpu">CPU</Menu.Item>
      <Menu.Item key="instances.gpu">GPU</Menu.Item>
    </Menu>
  );
  const [main] = (filter || '').split('.');
  const getButtonType = (t) => (new RegExp(`^${t}$`, 'i')).test(main) ? 'primary' : undefined;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
      }}
    >
      <Button.Group>
        <Button
          type={getButtonType('general')}
          onClick={() => onSelect({key: 'general'})}
        >
          General
        </Button>
        <Dropdown overlay={storagesMenu}>
          <Button
            onClick={() => onSelect({key: 'storages'})}
            type={getButtonType('storages')}
          >
            Storages <Icon type="down" />
          </Button>
        </Dropdown>
        <Dropdown overlay={instancesMenu}>
          <Button
            onClick={() => onSelect({key: 'instances'})}
            type={getButtonType('instances')}
          >
            Compute instances <Icon type="down" />
          </Button>
        </Dropdown>
      </Button.Group>
    </div>
  );
}
