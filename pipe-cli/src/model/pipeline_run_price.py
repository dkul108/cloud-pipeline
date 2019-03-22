# Copyright 2017-2019 EPAM Systems, Inc. (https://www.epam.com/)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

class PipelineRunPrice(object):
    def __init__(self):
        self.instance_type = None
        self.instance_disk = None
        self.price_per_hour = None
        self.total_price = None

    @classmethod
    def load(cls, json):
        instance = cls()
        if 'instanceType' in json:
            instance.instance_type = json['instanceType']
        if 'instanceDisk' in json:
            instance.instance_disk = json['instanceDisk']
        if 'pricePerHour' in json:
            instance.price_per_hour = json['pricePerHour']
        if 'totalPrice' in json:
            instance.total_price = json['totalPrice']
        return instance
