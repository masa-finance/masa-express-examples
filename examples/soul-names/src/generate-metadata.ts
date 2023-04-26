import { generateImage } from "./image-generator";
import { utils } from "ethers";
import {
  Attribute,
  ISoulName,
  Masa,
  signMessage,
  SoulNameErrorCodes,
  SoulNameResultBase,
} from "@masa-finance/masa-sdk";
import Transaction from "arweave/node/lib/transaction";

const { ARWEAVE_PRIVATE_KEY } = process.env;

export const generateMetadata = async ({
  masa,
  soulname,
}: {
  masa: Masa;
  soulname: string;
}): Promise<
  SoulNameResultBase & {
    // image info
    imageTransaction?: Transaction;
    imageResponse?: {
      status: number;
      statusText: string;
      data: unknown;
    };
    // metadata info
    metadataTransaction?: Transaction;
    metadataResponse?: {
      status: number;
      statusText: string;
      data: unknown;
    };
  }
> => {
  // generate default result
  const result: SoulNameResultBase = {
    success: false,
    message: "Unknown Error",
    errorCode: SoulNameErrorCodes.UnknownError,
  };

  // generate the image and return its buffer here
  const imageData: Buffer = await generateImage(soulname);
  // hash the image
  const imageHash: string = utils.keccak256(imageData);
  // sign the hash using the authority key
  const imageHashSignature = await signMessage(imageHash, masa.config.wallet);

  if (imageHashSignature) {
    // create arweave transaction for the image
    const imageTransaction = await masa.arweave.createTransaction(
      {
        data: imageData,
      },
      JSON.parse(ARWEAVE_PRIVATE_KEY as string)
    );

    // make sure we store the image as png
    imageTransaction.addTag("Content-Type", "image/png");

    // sign the arweave transaction
    await masa.arweave.transactions.sign(
      imageTransaction,
      JSON.parse(ARWEAVE_PRIVATE_KEY as string)
    );
    const imageResponse = await masa.arweave.transactions.post(
      imageTransaction
    );

    if (imageResponse.status !== 200) {
      result.message = `Generating metadata image failed! ${imageResponse.statusText}`;
      result.errorCode = SoulNameErrorCodes.ArweaveError;
      console.error(result.message);
      return result;
    }

    if (!masa.config.network) {
      result.message = "Unable to evaluate current network!";
      result.errorCode = SoulNameErrorCodes.NetworkError;
      console.error(result.message);
      return result;
    }

    const attributes: Attribute[] = [
      {
        trait_type: "Base",
        value: "Starfish",
      },
      {
        trait_type: "Eyes",
        value: "Big",
      },
      {
        trait_type: "Mouth",
        value: "Surprised",
      },
      {
        trait_type: "Level",
        value: 5,
      },
      {
        trait_type: "Stamina",
        value: 1.4,
      },
      {
        trait_type: "Personality",
        value: "Sad",
      },
      {
        display_type: "boost_number",
        trait_type: "Aqua Power",
        value: 40,
      },
      {
        display_type: "boost_percentage",
        trait_type: "Stamina Increase",
        value: 10,
      },
      {
        display_type: "number",
        trait_type: "Generation",
        value: 2,
      },
    ];

    // create metadata
    const metadata: ISoulName = {
      description: "This is my 3rd Party soul name!" as any,
      external_url: "https://my-fancy-app.org" as any,
      name: soulname,
      image: `ar://${imageTransaction.id}`,
      imageHash,
      imageHashSignature,
      network: masa.config.networkName,
      chainId: masa.config.network.chainId.toString(),
      signature: "",
      attributes,
    };

    // sign metadata
    const metadataSignature = await signMessage(
      JSON.stringify(metadata, null, 2),
      masa.config.wallet
    );

    if (metadataSignature) {
      // place signature inside the metadata object
      metadata.signature = metadataSignature;

      // create arweave transaction for the metadata
      const metadataTransaction = await masa.arweave.createTransaction(
        {
          data: Buffer.from(JSON.stringify(metadata as never)),
        },
        JSON.parse(ARWEAVE_PRIVATE_KEY as string)
      );

      // make sure we store the metadata as json
      metadataTransaction.addTag("Content-Type", "application/json");

      // sign tx
      await masa.arweave.transactions.sign(
        metadataTransaction,
        JSON.parse(ARWEAVE_PRIVATE_KEY as string)
      );

      const metadataResponse = await masa.arweave.transactions.post(
        metadataTransaction
      );

      // evaluate arweave results
      if (metadataResponse.status !== 200) {
        result.message = `Generating metadata failed! ${imageResponse.statusText}`;
        result.errorCode = SoulNameErrorCodes.ArweaveError;
        console.error(result.message);
        return result;
      }

      return {
        success: true,
        errorCode: SoulNameErrorCodes.NoError,
        message: "",
        // image info
        imageTransaction,
        imageResponse,
        // metadata info
        metadataTransaction,
        metadataResponse,
      };
    }
  }

  return result;
};
