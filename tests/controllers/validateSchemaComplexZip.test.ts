import { readFileSync } from 'fs';
import path from 'node:path';
import { request } from '../helpers';

describe('Test controller validateSchemaComplexZip()', () => {
  describe('ZIP file should be joined and be valid', () => {

    it('masterdata-stationswitchstate', async () => {
      const zipFile = readFileSync(path.join(__dirname, 'apis', 'masterdata-stationswitchstate-api-1.0.2-SNAPSHOT-int___3.0_proto.zip'));

      const res = await request
        .post('/api/v1/asyncapi/joinAndValidateZip')
        .field('checkQuality', 'true')
        .attach('zipFile', zipFile, {
          filename: 'masterdata-stationswitchstate-api-1.0.2-SNAPSHOT-int___3.0_proto.zip',
        })
        .expect(200);

      expect(res.body).toStrictEqual({
        results: [],
        schemaIsValid: true,
      });
    });

    it('packages_and_protoc-gen', async () => {
      const zipFile = readFileSync(path.join(__dirname, 'apis', 'complex_using_packages_and_protoc-gen-validate.zip'));

      const res = await request
        .post('/api/v1/asyncapi/joinAndValidateZip')
        .field('checkQuality', 'true')
        .field('returnAsyncApiDocument', 'true')
        .attach('zipFile', zipFile, {
          filename: 'complex_using_packages_and_protoc-gen-validate.zip',
        })
        .expect(200);

      expect(res.body).toStrictEqual({
                                       results: [],
                                       schemaIsValid: true,
                                     });
    });
  });
});
