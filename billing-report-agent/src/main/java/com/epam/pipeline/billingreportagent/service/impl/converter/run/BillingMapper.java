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

package com.epam.pipeline.billingreportagent.service.impl.converter.run;

import static com.epam.pipeline.billingreportagent.service.ElasticsearchSynchronizer.DOC_TYPE_FIELD;

import com.epam.pipeline.billingreportagent.model.EntityContainer;
import com.epam.pipeline.billingreportagent.model.PipelineRunBillingInfo;
import com.epam.pipeline.billingreportagent.service.EntityMapper;
import com.epam.pipeline.entity.pipeline.PipelineRun;
import com.epam.pipeline.entity.pipeline.RunInstance;
import com.epam.pipeline.entity.search.SearchDocumentType;
import lombok.NoArgsConstructor;
import org.elasticsearch.common.xcontent.XContentBuilder;
import org.elasticsearch.common.xcontent.XContentFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@NoArgsConstructor
public class BillingMapper implements EntityMapper<PipelineRunBillingInfo> {

    @Override
    public XContentBuilder map(final EntityContainer<PipelineRunBillingInfo> container) {
        try (XContentBuilder jsonBuilder = XContentFactory.jsonBuilder()) {
            final PipelineRunBillingInfo billingInfo = container.getEntity();
            final PipelineRun run = billingInfo.getPipelineRun();
            jsonBuilder
                .startObject()
                .field(DOC_TYPE_FIELD, SearchDocumentType.PIPELINE_RUN.name())
                .field("id", run.getId())
                .field("resource_type", billingInfo.getResourceType())
                .field("pipeline", run.getPipelineName())
                .field("tool", run.getDockerImage())
                .field("instance_type", run.getInstance().getNodeType())
                .field("compute_type", getComputeType(run.getInstance()))
                .field("cost", billingInfo.getCost())
                .field("usage", billingInfo.getUsageMinutes())
                .field("run_price", run.getPricePerHour().unscaledValue().longValue())
                .field("cloudRegionId", run.getInstance().getCloudRegionId())
                .field("billingCenter", "TBD");
            buildUserContent(container.getOwner(), jsonBuilder);
            jsonBuilder.endObject();
            return jsonBuilder;
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to create elasticsearch document for pipeline run: ", e);
        }
    }

    private String getComputeType(final RunInstance instance) {
        // TODO parse real compute type (CPU, GPU)
        return instance.getNodeType();
    }
}
