ALTER TABLE PIPELINE.PIPELINE_RUN ADD owner TEXT NULL;
UPDATE PIPELINE.PIPELINE_RUN SET owner = 'Unauthorized';
ALTER TABLE pipeline.pipeline_run ALTER COLUMN owner SET NOT NULL;
