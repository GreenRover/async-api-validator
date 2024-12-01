import { readFileSync } from 'fs';
import path from 'node:path';
import { request } from '../helpers';

describe('Test controller validateSchemaSimple()', () => {
  describe('Valid schemas schould be tested as valid', () => {

    const validApis = [
      'monalesy_metric_2.0.yaml',
      'monalesy_metric_2.1.yaml',
      'monalesy_metric_2.2.yaml',
      'monalesy_metric_2.3.yaml',
      'monalesy_metric_2.4.yaml',
      'monalesy_metric_2.5.yaml',
      'monalesy_metric_2.6.yaml',
      'monalesy_service_desc_3.0.yaml',
    ];
    for (const validApi of validApis) {
      it('Valid API "' + validApi + '" should not fail', async () => {
        const api = readFileSync(path.join(__dirname, 'apis', validApi));

        const { body: data } = await request
          .post('/api/v1/asyncapi/validate?checkQuality=true')
          .set(headerForText(api))
          .send(api.toString())
          .expect(200);

        expect(data).toStrictEqual({
                                     results: [],
                                     schemaIsValid: true,
                                   });
      });
    }
  });
});


function headerForText(buffer: Buffer): Record<string, string> {
  return {
    'Content-Type': 'text/plain',
    'Accept': '*/*',
    'Cache-Control': 'no-cache',
    'Content-Length': '' + Buffer.byteLength(buffer),
  };
}
