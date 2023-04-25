import Arweave from "arweave";

const ARWEAVE_HOST = "arweave.net";
const ARWEAVE_PORT = 443;
const ARWEAVE_PROTOCOL = "https";

console.log(
  `Using arweave at: ${ARWEAVE_PROTOCOL}://${ARWEAVE_HOST}:${ARWEAVE_PORT}`
);

let arweaveInstance: Arweave;

export const initArweave = () => {
  if (!arweaveInstance) {
    arweaveInstance = Arweave.init({
      host: ARWEAVE_HOST,
      port: ARWEAVE_PORT,
      protocol: ARWEAVE_PROTOCOL,
    });
  }

  return arweaveInstance;
};
