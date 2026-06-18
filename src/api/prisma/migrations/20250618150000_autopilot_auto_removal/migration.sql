-- Autopilot auto broker removal pref + broker removal action kind

ALTER TYPE "AutopilotActionKind" ADD VALUE 'broker_removal_submitted';

ALTER TABLE "User" ADD COLUMN "autopilotAutoRemoval" BOOLEAN NOT NULL DEFAULT false;
