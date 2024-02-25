import * as bodyParser from 'body-parser';
import express, { Express, Request, Response } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import { RegisterRoutes } from './routes/routes';

export const application = () => {
  const app: Express = express();

  app.use(bodyParser.json());
  app.use(bodyParser.text());

  app.use(
    '/doc',
    swaggerUi.serve,
    async (_req: Request, res: Response) => {
      return res.send(
        swaggerUi.generateHTML(
          await import('./generated/swagger.json'),
          {
            customCss: '.curl-command { display: none; }',
          },
        ),
      );
    });

  app.get('/', (_, res) => {
    res.redirect('/doc');
  });

  RegisterRoutes(app);

  return app;
};
