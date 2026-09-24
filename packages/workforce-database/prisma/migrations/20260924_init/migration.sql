-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WorkforceEmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "WorkforceTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WorkforceTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "WorkforceUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "profileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkforceUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceProfile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceTeamMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceDepartment" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceEmployee" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "departmentId" TEXT,
    "position" TEXT,
    "joinDate" TIMESTAMP(3),
    "salary" DECIMAL(65,30),
    "status" "WorkforceEmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceTask" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "WorkforceTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "WorkforceTaskStatus" NOT NULL DEFAULT 'TODO',
    "departmentId" TEXT,
    "assigneeId" TEXT,
    "createdById" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceInvitation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "invitedById" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkforceCustomRole" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkforceCustomRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkforceUser_email_key" ON "WorkforceUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WorkforceUser_profileId_key" ON "WorkforceUser"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkforceProfile_email_key" ON "WorkforceProfile"("email");

-- CreateIndex
CREATE INDEX "WorkforceProfile_teamId_idx" ON "WorkforceProfile"("teamId");

-- CreateIndex
CREATE INDEX "WorkforceTeamMember_teamId_idx" ON "WorkforceTeamMember"("teamId");

-- CreateIndex
CREATE INDEX "WorkforceTeamMember_userId_idx" ON "WorkforceTeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkforceTeamMember_userId_teamId_key" ON "WorkforceTeamMember"("userId", "teamId");

-- CreateIndex
CREATE INDEX "WorkforceDepartment_teamId_idx" ON "WorkforceDepartment"("teamId");

-- CreateIndex
CREATE INDEX "WorkforceEmployee_teamId_idx" ON "WorkforceEmployee"("teamId");

-- CreateIndex
CREATE INDEX "WorkforceEmployee_departmentId_idx" ON "WorkforceEmployee"("departmentId");

-- CreateIndex
CREATE INDEX "WorkforceEmployee_profileId_idx" ON "WorkforceEmployee"("profileId");

-- CreateIndex
CREATE INDEX "WorkforceTask_teamId_idx" ON "WorkforceTask"("teamId");

-- CreateIndex
CREATE INDEX "WorkforceTask_status_idx" ON "WorkforceTask"("status");

-- CreateIndex
CREATE INDEX "WorkforceTask_priority_idx" ON "WorkforceTask"("priority");

-- CreateIndex
CREATE INDEX "WorkforceTask_departmentId_idx" ON "WorkforceTask"("departmentId");

-- CreateIndex
CREATE INDEX "WorkforceTask_assigneeId_idx" ON "WorkforceTask"("assigneeId");

-- CreateIndex
CREATE INDEX "WorkforceTask_createdById_idx" ON "WorkforceTask"("createdById");

-- CreateIndex
CREATE INDEX "WorkforceTask_dueDate_idx" ON "WorkforceTask"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "WorkforceInvitation_token_key" ON "WorkforceInvitation"("token");

-- CreateIndex
CREATE INDEX "WorkforceInvitation_teamId_idx" ON "WorkforceInvitation"("teamId");

-- CreateIndex
CREATE INDEX "WorkforceInvitation_email_idx" ON "WorkforceInvitation"("email");

-- CreateIndex
CREATE INDEX "WorkforceNotification_userId_idx" ON "WorkforceNotification"("userId");

-- CreateIndex
CREATE INDEX "WorkforceNotification_teamId_idx" ON "WorkforceNotification"("teamId");

-- CreateIndex
CREATE INDEX "WorkforceCustomRole_teamId_idx" ON "WorkforceCustomRole"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkforceCustomRole_teamId_name_key" ON "WorkforceCustomRole"("teamId", "name");

-- AddForeignKey
ALTER TABLE "WorkforceUser" ADD CONSTRAINT "WorkforceUser_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "WorkforceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceTeam" ADD CONSTRAINT "WorkforceTeam_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "WorkforceUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceProfile" ADD CONSTRAINT "WorkforceProfile_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "WorkforceTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceTeamMember" ADD CONSTRAINT "WorkforceTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "WorkforceUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceTeamMember" ADD CONSTRAINT "WorkforceTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "WorkforceTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceDepartment" ADD CONSTRAINT "WorkforceDepartment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "WorkforceTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceDepartment" ADD CONSTRAINT "WorkforceDepartment_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "WorkforceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceEmployee" ADD CONSTRAINT "WorkforceEmployee_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "WorkforceTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceEmployee" ADD CONSTRAINT "WorkforceEmployee_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "WorkforceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceEmployee" ADD CONSTRAINT "WorkforceEmployee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "WorkforceDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceEmployee" ADD CONSTRAINT "WorkforceEmployee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "WorkforceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceTask" ADD CONSTRAINT "WorkforceTask_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "WorkforceTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceTask" ADD CONSTRAINT "WorkforceTask_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "WorkforceDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceTask" ADD CONSTRAINT "WorkforceTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "WorkforceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceTask" ADD CONSTRAINT "WorkforceTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "WorkforceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceInvitation" ADD CONSTRAINT "WorkforceInvitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "WorkforceTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceInvitation" ADD CONSTRAINT "WorkforceInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "WorkforceProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceNotification" ADD CONSTRAINT "WorkforceNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "WorkforceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceNotification" ADD CONSTRAINT "WorkforceNotification_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "WorkforceTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkforceCustomRole" ADD CONSTRAINT "WorkforceCustomRole_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "WorkforceTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
