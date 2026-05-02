import { Command } from 'commander';
import { runExportSchema } from './commands/export';
import { runInit } from './commands/init';

const program = new Command();

program
    .name('jex')
    .description('JSON Express developer tooling. The server itself is started via the `json-express` binary shipped by @json-express/core.')
    .version('2.0.0-alpha.0');

program
    .command('init [name]')
    .description('Scaffold a new JSON Express project (writes package.json pointing to @json-express/boot)')
    .action((name?: string) => runInit(process.cwd(), name));

program
    .command('export <collection>')
    .description('Export a JSON collection to a strongly-typed model file under ./models')
    .action((collection: string) => runExportSchema(process.cwd(), collection));

program.parse();
