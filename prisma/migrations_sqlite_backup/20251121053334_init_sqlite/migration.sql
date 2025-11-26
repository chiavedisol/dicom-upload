-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'pending',
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "upload_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "totalFiles" INTEGER NOT NULL,
    "successfulFiles" INTEGER NOT NULL DEFAULT 0,
    "failedFiles" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "upload_batches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dicom_instances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadBatchId" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "metadata_edits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dicomInstanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "editedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "metadata_edits_dicomInstanceId_fkey" FOREIGN KEY ("dicomInstanceId") REFERENCES "dicom_instances" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "metadata_edits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "upload_batches_userId_idx" ON "upload_batches"("userId");

-- CreateIndex
CREATE INDEX "upload_batches_expiresAt_idx" ON "upload_batches"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "dicom_instances_sopInstanceUid_key" ON "dicom_instances"("sopInstanceUid");

-- CreateIndex
CREATE INDEX "dicom_instances_studyInstanceUid_idx" ON "dicom_instances"("studyInstanceUid");

-- CreateIndex
CREATE INDEX "dicom_instances_seriesInstanceUid_idx" ON "dicom_instances"("seriesInstanceUid");

-- CreateIndex
CREATE INDEX "dicom_instances_sopInstanceUid_idx" ON "dicom_instances"("sopInstanceUid");

-- CreateIndex
CREATE INDEX "dicom_instances_userId_idx" ON "dicom_instances"("userId");

-- CreateIndex
CREATE INDEX "dicom_instances_uploadBatchId_idx" ON "dicom_instances"("uploadBatchId");

-- CreateIndex
CREATE INDEX "dicom_instances_patientName_idx" ON "dicom_instances"("patientName");

-- CreateIndex
CREATE INDEX "dicom_instances_studyDate_idx" ON "dicom_instances"("studyDate");

-- CreateIndex
CREATE INDEX "dicom_instances_modality_idx" ON "dicom_instances"("modality");

-- CreateIndex
CREATE INDEX "dicom_instances_expiresAt_idx" ON "dicom_instances"("expiresAt");

-- CreateIndex
CREATE INDEX "metadata_edits_dicomInstanceId_idx" ON "metadata_edits"("dicomInstanceId");

-- CreateIndex
CREATE INDEX "metadata_edits_userId_idx" ON "metadata_edits"("userId");
