CREATE TYPE "AuthRole" AS ENUM ('SUPER_ADMIN', 'STUDENT', 'TEACHER');

CREATE TABLE "auth_sessions" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "role" "AuthRole" NOT NULL,
  "must_change_password" BOOLEAN NOT NULL DEFAULT false,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auth_sessions_account_id_role_revoked_at_expires_at_idx"
ON "auth_sessions"("account_id", "role", "revoked_at", "expires_at");

CREATE INDEX "auth_sessions_expires_at_revoked_at_idx"
ON "auth_sessions"("expires_at", "revoked_at");

CREATE TABLE "login_throttles" (
  "key" TEXT NOT NULL,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "window_started_at" TIMESTAMP(3) NOT NULL,
  "locked_until" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "login_throttles_pkey" PRIMARY KEY ("key")
);
