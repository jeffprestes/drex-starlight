const fs = require("fs");

function saveMetadata (
  contractDeployedAddress,
  contractName,
  networkId,
  blockNumber
  ) {
  // console.log("__dirname", __dirname);
  const parentDirectory = __dirname.substring(0, __dirname.lastIndexOf("/"));
  // console.log("parentDirectory", parentDirectory);
  
  const hardhatArtifactContractPath = parentDirectory + "/artifacts/contracts";
  // console.log("hardhatArtifactContractPath: ", hardhatArtifactContractPath);
  const hardhatArtifactPath = hardhatArtifactContractPath + "/" + contractName + ".sol/" + contractName +".json";
  // console.log("hardhatArtifactPath: ", hardhatArtifactPath);
  
  const compilationData = fs.readFileSync(hardhatArtifactPath, "utf-8");
  const abi = JSON.parse(compilationData).abi;
  const tmpData = {
    abi: abi,
    networks: {
      [networkId] : {
        address: contractDeployedAddress,
        blockNumber: blockNumber
      }
    }
  };
  // console.log("tmpData: ", tmpData);
  const buildFolder = __dirname.substring(0, __dirname.lastIndexOf("Escrow")) + "Escrow/build/contracts/";
  // console.log("buildFolder: ", buildFolder);
  const deployedFileName = buildFolder + contractName + "-metadata.json";
  // console.log("Writing", deployedFileName, "...");
  fs.writeFileSync(deployedFileName, JSON.stringify(tmpData));
  // console.log(deployedFileName, " written with this content: ", JSON.stringify(tmpData));
}

module.exports = {
  saveMetadata
}