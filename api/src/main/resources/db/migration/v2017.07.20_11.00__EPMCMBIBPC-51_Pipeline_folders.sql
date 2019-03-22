CREATE SEQUENCE pipeline.S_FOLDER START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS PIPELINE.FOLDER
(
    FOLDER_ID BIGINT PRIMARY KEY NOT NULL,
    FOLDER_NAME TEXT NOT NULL,
    PARENT_ID BIGINT,
    CREATED_DATE TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE PIPELINE.FOLDER ADD CONSTRAINT folder_folder_id_fk FOREIGN KEY (PARENT_ID) REFERENCES folder (FOLDER_ID);

ALTER TABLE PIPELINE.PIPELINE ADD FOLDER_ID BIGINT NULL;

ALTER TABLE PIPELINE.PIPELINE ADD CONSTRAINT pipeline_folder_id_fk FOREIGN KEY (folder_id) REFERENCES folder (FOLDER_ID);
