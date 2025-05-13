const { execSync } = require('child_process');
const args = require('minimist')(process.argv.slice(2), {
  string: ['task', 'name'],
});

const task = args.task;
const name = args.name;

const dataSource = './dist/Modules/Global/Infrastructure/Database/Config/datasource.js';
const migrationsDir = './src/Modules/Global/Infrastructure/Database/Migrations';

const commands = {
  create: `./node_modules/typeorm/cli.js migration:create ${migrationsDir}/${name || 'DefaultMigrationName'}`,
  generate: `./node_modules/typeorm/cli.js migration:generate ${migrationsDir}/${name || 'DefaultMigrationName'} -d ${dataSource}`,
  run: `./node_modules/typeorm/cli.js migration:run -d ${dataSource}`,
  revert: `./node_modules/typeorm/cli.js migration:revert -d ${dataSource}`,
};

console.log(task)
console.log(name)

if (!task || !commands[task]) {
  console.error(`Invalid or missing task! Use one of: ${Object.keys(commands).join(', ')}`);
  process.exit(1);
}

console.log(`Executing: ${task} ${name ? `with name: ${name}` : ''}`);

try {
  const command = commands[task];
  execSync(command, { stdio: 'inherit' });
  console.log(`${task} completed successfully.`);
} catch (error) {
  console.error(`${task} failed with error:`, error.message);
  process.exit(1);
}
