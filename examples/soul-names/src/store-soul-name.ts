import {
  Masa,
  NetworkName,
  SoulNameErrorCodes,
  SoulNameMetadataStoreResult,
  SoulNameResultBase,
  SupportedNetworks,
} from "@masa-finance/masa-sdk";
import { providers, Wallet } from "ethers";
import { generateMetadata } from "./generate-metadata";

const { WEB3_PRIVATE_KEY } = process.env;

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
    verbose: true,
  });

  // query the extension from the given contract
  const extension = await masa.contracts.instances.SoulNameContract.extension();

  // ensure name extension for metaData image
  const soulNameWithExtension = `${soulName.replace(
    extension,
    ""
  )}${extension}`;
  // scrub the soul name, so we have it without extension as well
  const soulNameWithoutExtension = soulName.replace(extension, "");

  // validate soul name and get the length
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

  const generateMetadataResult = await generateMetadata({
    masa,
    soulname: soulNameWithExtension,
  });

  if (generateMetadataResult?.success) {
    // sign the soul name request
    const signResult = await masa.contracts.soulName.sign(
      soulNameWithoutExtension,
      soulNameLength,
      duration,
      // build metadataUrl
      `ar://${generateMetadataResult.metadataTransaction?.id}`,
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
      imageTransaction: generateMetadataResult.imageTransaction,
      imageResponse: generateMetadataResult.imageResponse,
      // metadata info
      metadataTransaction: generateMetadataResult.metadataTransaction,
      metadataResponse: generateMetadataResult.metadataResponse,
      // signature
      signature: signResult.signature,
      authorityAddress: signResult.authorityAddress,
    };
  }

  return generateMetadataResult;
};
