-- Update CompanySize enum to include all values
ALTER TABLE `customers` MODIFY COLUMN `size` ENUM('MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE') NOT NULL;
ALTER TABLE `leads` MODIFY COLUMN `companySize` ENUM('MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE') NOT NULL;

-- Update CustomerStatus enum to include PROSPECT
ALTER TABLE `customers` MODIFY COLUMN `status` ENUM('ACTIVE', 'INACTIVE', 'CHURNED', 'PROSPECT') NOT NULL DEFAULT 'ACTIVE';

-- Update ProjectStage enum - replace IMPLEMENTATION with DEVELOPMENT
-- First, update any existing IMPLEMENTATION records to DEVELOPMENT
UPDATE `projects` SET `stage` = 'DEVELOPMENT' WHERE `stage` = 'IMPLEMENTATION';
UPDATE `project_stage_history` SET `oldStage` = 'DEVELOPMENT' WHERE `oldStage` = 'IMPLEMENTATION';
UPDATE `project_stage_history` SET `newStage` = 'DEVELOPMENT' WHERE `newStage` = 'IMPLEMENTATION';

-- Then update the enum
ALTER TABLE `projects` MODIFY COLUMN `stage` ENUM('REQUIREMENTS', 'DESIGN', 'DEVELOPMENT', 'TESTING', 'DEPLOYMENT', 'LIVE') NOT NULL DEFAULT 'REQUIREMENTS';
ALTER TABLE `project_stage_history` MODIFY COLUMN `oldStage` ENUM('REQUIREMENTS', 'DESIGN', 'DEVELOPMENT', 'TESTING', 'DEPLOYMENT', 'LIVE') NULL;
ALTER TABLE `project_stage_history` MODIFY COLUMN `newStage` ENUM('REQUIREMENTS', 'DESIGN', 'DEVELOPMENT', 'TESTING', 'DEPLOYMENT', 'LIVE') NOT NULL;

-- Add IN_PROGRESS to MilestoneStatus enum
ALTER TABLE `milestones` MODIFY COLUMN `status` ENUM('PENDING', 'IN_PROGRESS', 'DONE') NOT NULL DEFAULT 'PENDING';
