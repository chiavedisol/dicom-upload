-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cloud_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gcpProjectId" TEXT,
    "gcpLocation" TEXT NOT NULL DEFAULT 'asia-northeast1',
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
INSERT INTO "new_cloud_config" ("connectionError", "connectionStatus", "createdAt", "gcpDatasetId", "gcpDicomStoreId", "gcpLocation", "gcpProjectId", "id", "isConfigured", "lastTestedAt", "serviceAccountKey", "updatedAt", "updatedBy") SELECT "connectionError", "connectionStatus", "createdAt", "gcpDatasetId", "gcpDicomStoreId", "gcpLocation", "gcpProjectId", "id", "isConfigured", "lastTestedAt", "serviceAccountKey", "updatedAt", "updatedBy" FROM "cloud_config";
DROP TABLE "cloud_config";
ALTER TABLE "new_cloud_config" RENAME TO "cloud_config";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
