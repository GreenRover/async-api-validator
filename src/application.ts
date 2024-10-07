import * as bodyParser from 'body-parser';
import express, { Express } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import swaggerDocument from './generated/swagger.json';
import { RegisterRoutes } from './routes/routes';

export const application = () => {
  const app: Express = express();

  app.use(bodyParser.json());
  app.use(bodyParser.text());

  app.use(
    '/doc',
    swaggerUi.serve,
    swaggerUi.setup(
      swaggerDocument,
      {
        customCss: '.curl-command { display: none; }',
      },
    ),
  );

  app.get('/', (_, res) => {
    res.redirect('/doc');
  });

  RegisterRoutes(app);

  return app;
};
