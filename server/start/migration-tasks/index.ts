import migrateReportsDirectoryName from "./reports_directory_name";

export function jobMigrationTasksRun(context) {
  const migrationTasks = [
    migrateReportsDirectoryName
  ];

  migrationTasks.forEach(task => task(context));
}