ALTER TABLE PIPELINE.INSTANCE_OFFER ADD VCPU INTEGER NOT NULL DEFAULT 0;
ALTER TABLE PIPELINE.INSTANCE_OFFER ADD MEMORY REAL NOT NULL DEFAULT 0;
ALTER TABLE PIPELINE.INSTANCE_OFFER ADD MEMORY_UNIT TEXT NULL;