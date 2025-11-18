-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "compileCmd" TEXT,
    "runCmd" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Status" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "sourceCode" TEXT,
    "languageId" INTEGER NOT NULL,
    "stdin" TEXT,
    "expectedOutput" TEXT,
    "stdout" TEXT,
    "statusId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "time" DOUBLE PRECISION,
    "memory" INTEGER,
    "stderr" TEXT,
    "token" TEXT NOT NULL,
    "numberOfRuns" INTEGER NOT NULL DEFAULT 1,
    "cpuTimeLimit" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "cpuExtraTime" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "wallTimeLimit" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "memoryLimit" INTEGER NOT NULL DEFAULT 128000,
    "stackLimit" INTEGER NOT NULL DEFAULT 64000,
    "maxProcessesAndThreads" INTEGER NOT NULL DEFAULT 60,
    "enablePerProcessTimeLimit" BOOLEAN NOT NULL DEFAULT true,
    "enablePerProcessMemoryLimit" BOOLEAN NOT NULL DEFAULT true,
    "maxFileSize" INTEGER NOT NULL DEFAULT 1024,
    "compileOutput" TEXT,
    "exitCode" INTEGER,
    "exitSignal" INTEGER,
    "message" TEXT,
    "wallTime" DOUBLE PRECISION,
    "compilerOptions" TEXT,
    "commandLineArguments" TEXT,
    "redirectStderrToStdout" BOOLEAN NOT NULL DEFAULT false,
    "callbackUrl" TEXT,
    "additionalFiles" BYTEA,
    "enableNetwork" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "queuedAt" TIMESTAMP(3),
    "queueHost" TEXT,
    "executionHost" TEXT,
    "userId" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "stdout" TEXT,
    "stderr" TEXT,
    "exitCode" INTEGER,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "submissionId" TEXT NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_token_key" ON "Submission"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Result_submissionId_key" ON "Result"("submissionId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
