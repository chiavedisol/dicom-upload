-- CreateTable
CREATE TABLE "cloud_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gcpProjectId" TEXT,
    "gcpLocation" TEXT NOT NULL DEFAULT 'us-central1',
    "gcpDatasetId" TEXT,
    "gcpDicomStoreId" TEXT,
    "serviceAccountKey" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" DATETIME,
    "connectionStatus" TEXT NOT NULL DEFAULT 'not_tested',
    "connectionError" TEXT,
    "updatedBy" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
