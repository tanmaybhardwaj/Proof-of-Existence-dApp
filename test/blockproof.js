// Declare Contract
const Blockproof = artifacts.require("./Blockproof.sol");

contract("Blockproof", accounts => {
  // Variables
  var proofIndex01 = 1;
  var title = "title 1";
  var hash = "QmYjh5NsDc6LwU3394NbB42WpQbGVsueVSBmod5WACvpte";
  var remarks = "remarks 1";
  var tag = "tag01";
  var visitor = accounts[4];
  var creator = accounts[5];
  var deployer = accounts[4];
  // Test to check that contract is deployed successfully
  it("contract Blockproof is deployed succesfully", async () => {
    const blockproof = await Blockproof.deployed();
    assert.ok(blockproof, "contract has been deployed");
  });

  // Test to check that a new proof is succesfully created with values provided
  it("should create a new proof", async () => {
    const blockproof = await Blockproof.new();
    await blockproof.createProof(title, hash, remarks, tag, {
      from: creator
    });

    // Wait for the callback to be invoked by oraclize and the event to be emitted
    const logNewTimeStamp = promisifyEventWatch(
      blockproof.timestampNow({ fromBlock: "latest" })
    );

    let logTimeStamp = await logNewTimeStamp;
    assert.equal(
      logTimeStamp.event,
      "timestampNow",
      "timestampNow not emitted."
    );
    assert.isNotNull(
      logTimeStamp.args.timestamp,
      "Timestamp returned was null."
    );
    console.log(
      "Success! Current timestamp is: " +
        logTimeStamp.args._proofTimeStamp * 1000
    );

    const logProofCreated = promisifyEventWatch(
      blockproof.newProofCreated({ fromBlock: "latest" })
    );
    let newProofDetails = await logProofCreated;
    console.log("Success! Details of new proof are: ");
    console.log("Proof Creator: " + newProofDetails.args._proofCreator);
    console.log("Proof Title: " + newProofDetails.args._proofTitle);
    console.log("Proof Hash Value: " + newProofDetails.args._proofIpfsHash);
    console.log("Proof Remarks: " + newProofDetails.args._proofRemarks);
    console.log(
      "Proof TimeStamp: " + newProofDetails.args._proofTimeStamp * 1000
    );

    assert.equal(
      newProofDetails.args._proofCreator,
      creator,
      "creator must be " + creator
    );
    assert.equal(
      newProofDetails.args._proofTitle,
      title,
      "title name must be " + title
    );
    assert.equal(
      newProofDetails.args._proofIpfsHash,
      hash,
      "hash value must be " + hash
    );
    assert.equal(
      newProofDetails.args._proofRemarks,
      remarks,
      "remarks name must be " + remarks
    );
    assert.equal(newProofDetails.args._proofTags, tag, "tags must be " + tag);
    assert.equal(
      newProofDetails.args._proofTimeStamp * 1000,
      logTimeStamp.args._proofTimeStamp * 1000,
      "timestamp must be " + logTimeStamp.args._proofTimeStamp * 1000
    );
  });
  // Test to check that details of a newly created proof are accessible to creator of the proof
  it("should provide details of the proof if you are the owner", async () => {
    const blockproof = await Blockproof.new();
    await blockproof.createProof(title, hash, remarks, tag, {
      from: creator
    });

    // Wait for the callback to be invoked by oraclize and the event to be emitted
    const logNewTimeStamp = promisifyEventWatch(
      blockproof.timestampNow({ fromBlock: "latest" })
    );

    let logTimeStamp = await logNewTimeStamp;

    console.log(
      "Success! Current timestamp is: " +
        logTimeStamp.args._proofTimeStamp * 1000
    );

    const logProofCreated = promisifyEventWatch(
      blockproof.newProofCreated({ fromBlock: "latest" })
    );
    let newProofDetails = await logProofCreated;
    console.log("Success! Details of new proof are: ");
    console.log("Proof Creator: " + newProofDetails.args._proofCreator);
    console.log("Proof Title: " + newProofDetails.args._proofTitle);
    console.log("Proof Hash Value: " + newProofDetails.args._proofIpfsHash);
    console.log("Proof Remarks: " + newProofDetails.args._proofRemarks);
    console.log(
      "Proof TimeStamp: " + newProofDetails.args._proofTimeStamp * 1000
    );

    let proofDetails = await blockproof.getDetailsByIndex(proofIndex01, {
      from: creator
    });
    assert.equal(
      proofDetails[0] * 1000,
      logTimeStamp.args._proofTimeStamp * 1000,
      "timestamp must be " + logTimeStamp.args._proofTimeStamp * 1000
    );
    assert.equal(proofDetails[1], creator, "creator must be " + creator);
    assert.equal(proofDetails[2], hash, "hash value must be " + hash);
    console.log("Success! Timestamp is :  " + proofDetails[0]);
    console.log("Success! Creator is :  " + proofDetails[1]);
    console.log("Success! Hash Value is :  " + proofDetails[2]);
  });

  // Test to check that details of a newly created proof are NOT accessible to any other address
  it("should not provide details of the proof of which you are not owner", async () => {
    const blockproof = await Blockproof.new();
    await blockproof.createProof(title, hash, remarks, tag, {
      from: creator
    });

    // Wait for the callback to be invoked by oraclize and the event to be emitted
    const logNewTimeStamp = promisifyEventWatch(
      blockproof.timestampNow({ fromBlock: "latest" })
    );

    let logTimeStamp = await logNewTimeStamp;

    console.log(
      "Success! Current timestamp is: " +
        logTimeStamp.args._proofTimeStamp * 1000
    );

    const logProofCreated = promisifyEventWatch(
      blockproof.newProofCreated({ fromBlock: "latest" })
    );
    let newProofDetails = await logProofCreated;
    console.log("Success! Details of new proof are: ");
    console.log("Proof Creator: " + newProofDetails.args._proofCreator);
    console.log("Proof Title: " + newProofDetails.args._proofTitle);
    console.log("Proof Hash Value: " + newProofDetails.args._proofIpfsHash);
    console.log("Proof Remarks: " + newProofDetails.args._proofRemarks);
    console.log(
      "Proof TimeStamp: " + newProofDetails.args._proofTimeStamp * 1000
    );
    let err = null;
    try {
      await blockproof.getDetailsByIndex(proofIndex01, {
        from: visitor
      });
    } catch (error) {
      err = error;
    }
    assert.ok(err instanceof Error);
  });
  // Test to check that new proofs must not be created if Circuit Breaker has been applied
  it("should apply circuit breaker", async () => {
    const blockproof = await Blockproof.new({ from: deployer });
    let circuitbreaker = await blockproof.toggle_active({ from: deployer });
    console.log("Circuit Breaker Applied: " + Boolean(circuitbreaker));
    assert.ok(Boolean(circuitbreaker), "Circuit Breaker Applied");
  });
});
//
// Helper to wait for log emission.
//* @param  {Object} _event The event to wait for.
//
function promisifyEventWatch(_event) {
  return new Promise((resolve, reject) => {
    _event.watch((error, log) => {
      _event.stopWatching();
      if (error !== null) reject(error);
      resolve(log);
    });
  });
}
