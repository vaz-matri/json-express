import { Command } from 'commander';
import { runExportSchema } from './commands/export';
import { runInit } from './commands/init';
import { runConfigure } from './commands/configure';
import { runMigrate } from './commands/migrate';

const program = new Command();

program
    .name('jex')
    .description('JSON Express developer tooling. The server itself is started via the `json-express` binary shipped by @json-express/core.')
    .version('2.0.0-alpha.0');

program
    .command('init [name]')
    .description('Scaffold a new JSON Express app — interactive (preset or manual/custom); no application code is ever generated')
    .option('-y, --yes', 'skip prompts and scaffold the default stack (@json-express/boot)')
    .option('-p, --preset <preset>', 'skip prompts and scaffold a named preset: boot | identity | ecommerce')
    .action((name: string | undefined, opts: { yes?: boolean; preset?: string }) => runInit(process.cwd(), name, opts));

program
    .command('configure')
    .description('Interactively pick which @json-express/* plugin to use per category and save to .env')
    .action(() => runConfigure(process.cwd()));

program
    .command('export <collection>')
    .description('Export a JSON collection to a strongly-typed model file under ./models')
    .action((collection: string) => runExportSchema(process.cwd(), collection));

program
    .command('migrate')
    .description('Run database migrations for the active adapter (e.g. Postgres CREATE TABLEs)')
    .action(() => runMigrate(process.cwd()));

program.parse();
