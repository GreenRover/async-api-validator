#!/usr/bin/env node

import yargs from 'yargs/yargs';
import { cliJoin } from './service/join.service';

const argv = yargs(process.argv.slice(2))
  .option('path', {
    alias: 'p',
    describe: 'provide a path to directory containing the files to joins',
    type: 'string',
    demandOption: true,
    default: './',
  })
  .option('specName', {
    describe: 'Name of the async api spec to read and integrate schemas.',
    type: 'string',
    array: true,
    coerce: (arg: string[]) => arg.map(a => a.toLowerCase()),
    default: ['spec.yaml', 'spec.json'],
  })
  .example('$0 --path /opt/asyncapi/spec-source/ --specName async-api.yaml', 'Resolve all $ref from the /opt/asyncapi/spec-source/async-api.yaml and integrate into file.')
  .help()
  .parse();

const dirPath = (argv as any).path as string;
const specName = (argv as any).specName as string[];

try {
  console.log(cliJoin(process.cwd(), dirPath, specName));
} catch (e) {
  console.error(e);
  process.exit(1);
}