var Blockproof = artifacts.require("./Blockproof.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Blockproof, {
    from: accounts[8],
    gas: 6721975,
    value: 10000000000000000000
  });
};
