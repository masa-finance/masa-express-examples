import express, { Express, RequestHandler, Response, Router } from "express";
import {
  MasaSessionMiddleware,
  MasaSessionRouter,
  sessionCheckHandler,
} from "@masa-finance/masa-express";
import cors from "cors";
import { storeSoulName } from "./store-soul-name";

const app: Express = express();

app.use(express.json());

// your session name
const sessionName = "my_fancy_session_name";
// never give this to someone!
const secret = "top_secret_1337";
// 30 days session expiration time
const ttl = 30 * 24 * 60 * 60;
// production, dev or undefined (will fall back to dev then)
const environment = "dev";
// the domain your session should be valid on
const domain = ".vitalik.org";
// custom namespace generated using: https://www.uuidtools.com/generate/v4
const sessionNamespace = "01bbc88d-3cd2-465f-8687-e0ea5e8b1231";

const sessionMiddleware: RequestHandler = MasaSessionMiddleware({
  sessionName,
  secret,
  domain,
  ttl,
  environment,
});

app.use(
  cors({
    origin: domain,
    credentials: true,
  })
);

// session related
app.use(
  "/session",
  MasaSessionRouter({
    sessionMiddleware,
    sessionName,
    sessionNamespace,
  })
);

export const soulNameRouter: Router = express.Router();

soulNameRouter.use(sessionMiddleware);
soulNameRouter.use(sessionCheckHandler as never);

soulNameRouter.post("/store", (async (
  request: Express.RequestSession,
  response: Response
): Promise<void> => {
  try {
    response.json(
      await storeSoulName(
        request.body.soulName,
        request.body.receiver,
        request.body.duration,
        request.body.network
      )
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Soulname Error: ${error.message} ${error.stack}`);
    }
  }
}) as never);

app.use("/soul-name", soulNameRouter);

const port = process.env.PORT || 4000; // use whatever port you need

app.listen(port, () => {
  console.log(`Express app listening at 'http://localhost:${port}'`);
});
