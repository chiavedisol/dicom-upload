-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_dicom_instances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadBatchId" TEXT,
    "userId" TEXT NOT NULL,
    "studyInstanceUid" TEXT NOT NULL,
    "seriesInstanceUid" TEXT NOT NULL,
    "sopInstanceUid" TEXT NOT NULL,
    "patientId" TEXT,
    "patientName" TEXT,
    "patientBirthDate" DATETIME,
    "patientSex" TEXT,
    "studyDate" DATETIME,
    "studyTime" TEXT,
    "studyDescription" TEXT,
    "accessionNumber" TEXT,
    "modality" TEXT,
    "seriesNumber" INTEGER,
    "seriesDescription" TEXT,
    "instanceNumber" INTEGER,
    "rows" INTEGER,
    "columns" INTEGER,
    "numberOfFrames" INTEGER,
    "manufacturer" TEXT,
    "manufacturerModelName" TEXT,
    "bodyPartExamined" TEXT,
    "fullMetadata" TEXT,
    "uploadStatus" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "fileSize" BIGINT,
    "originalFilename" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "dicom_instances_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "upload_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dicom_instances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_dicom_instances" ("accessionNumber", "bodyPartExamined", "columns", "createdAt", "errorMessage", "expiresAt", "fileSize", "fullMetadata", "id", "instanceNumber", "manufacturer", "manufacturerModelName", "modality", "numberOfFrames", "originalFilename", "patientBirthDate", "patientId", "patientName", "patientSex", "rows", "seriesDescription", "seriesInstanceUid", "seriesNumber", "sopInstanceUid", "studyDate", "studyDescription", "studyInstanceUid", "studyTime", "uploadBatchId", "uploadStatus", "uploadedAt", "userId") SELECT "accessionNumber", "bodyPartExamined", "columns", "createdAt", "errorMessage", "expiresAt", "fileSize", "fullMetadata", "id", "instanceNumber", "manufacturer", "manufacturerModelName", "modality", "numberOfFrames", "originalFilename", "patientBirthDate", "patientId", "patientName", "patientSex", "rows", "seriesDescription", "seriesInstanceUid", "seriesNumber", "sopInstanceUid", "studyDate", "studyDescription", "studyInstanceUid", "studyTime", "uploadBatchId", "uploadStatus", "uploadedAt", "userId" FROM "dicom_instances";
DROP TABLE "dicom_instances";
ALTER TABLE "new_dicom_instances" RENAME TO "dicom_instances";
CREATE UNIQUE INDEX "dicom_instances_sopInstanceUid_key" ON "dicom_instances"("sopInstanceUid");
CREATE INDEX "dicom_instances_studyInstanceUid_idx" ON "dicom_instances"("studyInstanceUid");
CREATE INDEX "dicom_instances_seriesInstanceUid_idx" ON "dicom_instances"("seriesInstanceUid");
CREATE INDEX "dicom_instances_sopInstanceUid_idx" ON "dicom_instances"("sopInstanceUid");
CREATE INDEX "dicom_instances_userId_idx" ON "dicom_instances"("userId");
CREATE INDEX "dicom_instances_uploadBatchId_idx" ON "dicom_instances"("uploadBatchId");
CREATE INDEX "dicom_instances_patientName_idx" ON "dicom_instances"("patientName");
CREATE INDEX "dicom_instances_studyDate_idx" ON "dicom_instances"("studyDate");
CREATE INDEX "dicom_instances_modality_idx" ON "dicom_instances"("modality");
CREATE INDEX "dicom_instances_expiresAt_idx" ON "dicom_instances"("expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
