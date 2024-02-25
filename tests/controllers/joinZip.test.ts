import { readFileSync } from 'fs';
import { request } from '../helpers';

describe('Test controller joinZip()', () => {
  describe('ZIP file should be joined to yaml', () => {

    it('masterdata-stationswitchstate', async () => {
      const zipFile = readFileSync(__dirname + '/apis/masterdata-stationswitchstate-api-1.0.2-SNAPSHOT-int___3.0_proto.zip');
      const yaml = readFileSync(__dirname + '/apis/masterdata-stationswitchstate_3.0_proto.yaml');

      const res = await request
        .post('/api/v1/asyncapi/joinZip')
        .attach('zipFile', zipFile, {
          filename: 'masterdata-stationswitchstate-api-1.0.2-SNAPSHOT-int___3.0_proto.zip',
        })
        .expect(200);

      expect(unixifyString(res.text))
        .toBe(unixifyString(yaml.toString()));
    });
  });
});

function unixifyString(str: string): string {
  return str.trim()
    .replace(/\r\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\n\n/g, '\n')
    .replace(/\t/g, '    ');
}
