import { readFileSync } from 'fs';
import path from 'node:path';
import { cliJoin } from '../../src/cli/service/join.service';

describe('Test cli join()', () => {
  describe('folder content should be joined to yaml', () => {

    it('join_withSubDirs', () => {
      const yaml = readFileSync(path.join(__dirname, 'join_withSubDirs.yaml'));

      const joinedSpec = cliJoin(
        __dirname,
        './join_withSubDirs/',
        ['toTest.yaml'],
      );

      expect(unixifyString(joinedSpec))
        .toBe(unixifyString(yaml.toString()));
    });
  });
});

function unixifyString(str: string): string {
  return str.trim()
            .replace(/\r\n/g, '\n')
            .replace(/\r\n/g, '\n')
            .replace(/\n\s*\n/g, '\n')
            .replace(/\t/g, '    ');
}
