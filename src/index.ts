import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as swaggerUi from 'swagger-ui-express';
import { RegisterRoutes } from './routes/routes';

const app = express();
const port = 8060;

app.use(bodyParser.json());
app.use(bodyParser.text());

app.use(
  '/doc',
  swaggerUi.serve,
  async (_req: express.Request, res: express.Response) => {
    return res.send(
      swaggerUi.generateHTML(
        await import('./generated/swagger.json'),
        {
          customCss: '.curl-command { display: none; }'
        },
      ),
    );
  });

app.get('/', (req, res) => {
  res.redirect('/doc');
});

RegisterRoutes(app);

app.listen(port, () => console.log(`Server started listening to port ${port}`));
