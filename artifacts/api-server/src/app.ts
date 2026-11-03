import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
// Only this route accepts a transient, resized reference image.
app.use(["/api/design-suggestions", "/api/gemini/artwork"], express.json({ limit: "2100kb" }));
const designBodyError: ErrorRequestHandler = (error, _req, res, next) => {
  if (error?.type === "entity.too.large") {
    res.status(413).json({ error: "The reference image is too large. Choose a smaller image." });
  } else if (error instanceof SyntaxError) {
    res.status(400).json({ error: "The style request was not valid JSON." });
  } else next(error);
};
app.use(["/api/design-suggestions", "/api/gemini/artwork"], designBodyError);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
