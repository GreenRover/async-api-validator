import { agent as _request } from 'supertest';

import { application as getApplication } from '../src/application';

export const request = _request(getApplication())
