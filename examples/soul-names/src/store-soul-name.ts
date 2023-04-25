import {
  ISoulName,
  Masa,
  NetworkName,
  signMessage,
  SoulNameErrorCodes,
  SoulNameMetadataStoreResult,
  SoulNameResultBase,
  SupportedNetworks,
} from "@masa-finance/masa-sdk";
import { providers, utils, Wallet } from "ethers";
import { generateImage } from "./image-generator";
import { initArweave } from "./arweave-client";

const { ARWEAVE_PRIVATE_KEY, WEB3_PRIVATE_KEY } = process.env;

export const storeSoulName = async (
  soulName: string,
  receiver: string,
  duration: number,
  network: NetworkName
): Promise<SoulNameMetadataStoreResult | SoulNameResultBase> => {
  // generate default result
  const result: SoulNameResultBase = {
    success: false,
    message: "Unknown Error",
    errorCode: SoulNameErrorCodes.UnknownError,
  };

  // create a new masa instance and connect to the requested network
  // make sure you use the private key of the authority account that has rights on the soulname contract
  const masa = new Masa({
    wallet: new Wallet(WEB3_PRIVATE_KEY as string).connect(
      new providers.JsonRpcProvider(SupportedNetworks[network]?.rpcUrls[0])
    ),
    networkName: network,
  });

  // query the extension from the given contract
  const extension = await masa.contracts.instances.SoulNameContract.extension();

  // ensure name extension for metaData image
  const soulNameWithExtension = `${soulName.replace(
    extension,
    ""
  )}${extension}`;
  // scrub the soul name so we have it without extension as well
  const soulNameWithoutExtension = soulName.replace(extension, "");

  const {
    isValid,
    message,
    length: soulNameLength,
  } = masa.soulName.validate(soulNameWithoutExtension);

  // check if valid soul name
  if (!isValid) {
    result.message = `Soulname ${soulNameWithExtension} is not valid: ${message}!`;
    result.errorCode = SoulNameErrorCodes.SoulNameError;
    console.error(result.message);
    return result;
  }

  const isAvailable = masa.contracts.soulName.isAvailable(
    soulNameWithoutExtension
  );

  // check if available
  if (!isAvailable) {
    result.message = `Soulname ${soulNameWithExtension} is not available!`;
    result.errorCode = SoulNameErrorCodes.SoulNameError;
    console.error(result.message);
    return result;
  }

  const imageData: Buffer = await generateImage(soulNameWithExtension);

  const imageHash: string = utils.keccak256(imageData);
  const imageHashSignature = await signMessage(imageHash, masa.config.wallet);

  if (imageHashSignature) {
    // load arweave lazy
    const arweave = initArweave();

    // create arweave transaction for the image
    const imageTransaction = await arweave.createTransaction(
      {
        data: imageData,
      },
      JSON.parse(ARWEAVE_PRIVATE_KEY as string)
    );

    imageTransaction.addTag("Content-Type", "image/png");

    // sign tx
    await arweave.transactions.sign(
      imageTransaction,
      JSON.parse(ARWEAVE_PRIVATE_KEY as string)
    );
    const imageResponse = await arweave.transactions.post(imageTransaction);

    if (imageResponse.status !== 200) {
      result.message = `Generating metadata image failed! ${imageResponse.statusText}`;
      result.errorCode = SoulNameErrorCodes.ArweaveError;
      console.error(result.message);
      return result;
    }

    // get current network
    const currentNetwork = await masa.config.wallet.provider?.getNetwork();

    if (!currentNetwork) {
      result.message = "Unable to evaluate current network!";
      result.errorCode = SoulNameErrorCodes.NetworkError;
      console.error(result.message);
      return result;
    }

    // create metadata
    const metadata: ISoulName = {
      description: "This is my 3rd Party soul name!" as any,
      external_url: "https://my-fancy-app.org" as any,
      name: soulNameWithExtension,
      image: `${masa.soulName.getSoulNameMetadataPrefix()}${
        imageTransaction.id
      }`,
      imageHash,
      imageHashSignature,
      network: masa.config.networkName,
      chainId: currentNetwork.chainId.toString(),
      signature: "",
      attributes: [
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
      ],
    };

    // sign metadata
    const metadataSignature = await signMessage(
      JSON.stringify(metadata, null, 2),
      masa.config.wallet
    );

    if (metadataSignature) {
      // place signature inside the metadata object
      metadata.signature = metadataSignature;

      {
        // create arweave transaction for the metadata
        const metadataTransaction = await arweave.createTransaction(
          {
            data: Buffer.from(JSON.stringify(metadata as never)),
          },
          JSON.parse(ARWEAVE_PRIVATE_KEY as string)
        );

        metadataTransaction.addTag("Content-Type", "application/json");

        // sign tx
        await arweave.transactions.sign(
          metadataTransaction,
          JSON.parse(ARWEAVE_PRIVATE_KEY as string)
        );

        const metadataResponse = await arweave.transactions.post(
          metadataTransaction
        );

        if (metadataResponse.status !== 200) {
          result.message = `Generating metadata failed! ${imageResponse.statusText}`;
          result.errorCode = SoulNameErrorCodes.ArweaveError;
          console.error(result.message);
          return result;
        }

        const soulNameMetaDataUrl = `${masa.soulName.getSoulNameMetadataPrefix()}${
          metadataTransaction.id
        }`;

        const signResult = await masa.contracts.soulName.sign(
          soulNameWithoutExtension,
          soulNameLength,
          duration,
          soulNameMetaDataUrl,
          receiver
        );

        if (!signResult) {
          result.message = "Signing soul name failed!";
          result.errorCode = SoulNameErrorCodes.CryptoError;
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
          // signature
          signature: signResult.signature,
          authorityAddress: signResult.authorityAddress,
        };
      }
    }
  }
  return result;
};
