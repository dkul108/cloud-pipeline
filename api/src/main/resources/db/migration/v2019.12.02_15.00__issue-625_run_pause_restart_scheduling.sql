CREATE SEQUENCE pipeline.S_SCHEDULE START WITH 1 INCREMENT BY 1;
CREATE TABLE IF NOT EXISTS PIPELINE.RUN_SCHEDULE (
    ID BIGINT  NOT NULL PRIMARY KEY,
    ACTION BIGINT  NOT NULL,
    RUN_ID  BIGINT  NOT NULL REFERENCES pipeline.PIPELINE_RUN (RUN_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CRON_EXPRESSION TEXT  NOT NULL,
    CREATED_DATE  TIMESTAMP WITH TIME ZONE NOT NULL,
    TIME_ZONE TEXT
);
