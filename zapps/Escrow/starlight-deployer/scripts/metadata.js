const fs = require('fs');

function saveMetadata(
  contractDeployedAddress,
  contractName,
  networkId,
  blockNumber,
) {
  // console.log("__dirname", __dirname);

  const buildFolder =
    __dirname.substring(0, __dirname.lastIndexOf('Escrow')) +
    'Escrow/build/contracts/';
  // console.log("buildFolder: ", buildFolder);

  const deployedFileName = buildFolder + contractName + '-metadata.json';

  let deployedMetadata;
  let deployedPositionMetadata = {
    address: "",
    blockNumber: 0,
  }

  // check if deployedFileName exists
  if (fs.existsSync(deployedFileName)) {
    const fileData = fs.readFileSync(deployedFileName, 'utf-8');
    deployedMetadata = JSON.parse(fileData)
  } else {
    deployedMetadata = {
      abi: {},
      networks: {},
    };
  }
  
  const parentDirectory = __dirname.substring(0, __dirname.lastIndexOf('/'));
  // console.log("parentDirectory", parentDirectory);

  const hardhatArtifactContractPath = parentDirectory + '/artifacts/contracts';
  // console.log("hardhatArtifactContractPath: ", hardhatArtifactContractPath);
  const hardhatArtifactPath =
    hardhatArtifactContractPath +
    '/' +
    contractName +
    '.sol/' +
    contractName +
    '.json';
  // console.log("hardhatArtifactPath: ", hardhatArtifactPath);

  const compilationData = fs.readFileSync(hardhatArtifactPath, 'utf-8');
  const abi = JSON.parse(compilationData).abi;

  deployedMetadata.abi = abi;
  deployedPositionMetadata.address = contractDeployedAddress;
  deployedPositionMetadata.blockNumber = blockNumber;
  deployedMetadata.networks[networkId] = deployedPositionMetadata;

  console.log("Writing: ...");
  fs.writeFileSync(deployedFileName, JSON.stringify(deployedMetadata));
  console.log(deployedFileNameTest, " written with this content: ", JSON.stringify(deployedMetadata));
}

module.exports = {
  saveMetadata,
};
