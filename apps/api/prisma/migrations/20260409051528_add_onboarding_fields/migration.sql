-- AlterTable
ALTER TABLE "auth_sessions" ADD COLUMN     "has_linked_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_linked_phone" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "email" TEXT,
ADD COLUMN     "has_linked_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_linked_phone" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "email" TEXT,
ADD COLUMN     "has_linked_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_linked_phone" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "phone" DROP NOT NULL;
