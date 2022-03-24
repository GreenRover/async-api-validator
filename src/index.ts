import dotenv from "dotenv";
import express from "express";
import { initialize } from "express-openapi";
import logger from "morgan";
import swaggerUi from "swagger-ui-express";

// initialize configuration
dotenv.config();

// port is now available to the Node.js runtime
// as if it were an environment variable
const port = process.env.SERVER_PORT;

const app = express();
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// OpenAPI routes
initialize({
    apiDoc: './api/api-doc.js',
    app,
    paths: './dist/api/paths',
    routesGlob: '**/*.{ts,js}',
    routesIndexFileRegExp: /(?:index)?\.[tj]s$/
});

// OpenAPI UI
app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(null, {
        swaggerOptions: {
            url: `http://localhost:${port}/api-docs`,
        },
    })
);

// define a route handler for the default home page
app.get("/", (req, res) => {
    res.send("Hello world!");
});

// start the Express server
app.listen(port, () => {
    logger(`server started at http://localhost:${port}`);
    logger(
        `OpenAPI documentation available in http://localhost:${port}/api-documentation`
    );
});