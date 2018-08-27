const blockproof_artifacts = require("./build/contracts/Blockproof.json");
// Get Web3
const Web3 = require("web3");
const provider = new Web3.providers.HttpProvider("HTTP://127.0.0.1:8545");
// Get Contract
const contract = require("truffle-contract");
const Blockproof = contract(blockproof_artifacts);

// Get Database
const mongoose = require("mongoose");
// Express server which the frontend will interact with
const express = require("express");
// Express server which the frontend will interact with
const app = express();

Blockproof.setProvider(provider);
// Mongoose setup to interact with the mongodb database
mongoose.Promise = global.Promise;
var ProofModel = require("./models/Proofs");

// DB Config
const db = require("./config/keys").mongoURI;

// Connect to MongoDB
mongoose
  .connect(db)
  .then(() => console.log("Blockproof MongoDB Connected"))
  .catch(err => console.log(err));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.listen(3000, function() {
  console.log("Blockproof server listening on port 3000!");
});

// Call function that listen to 'New Document Created' event on the smart contract
setupProofEventListner();

// Function to listen to 'New Document Created' event on the smart contract
function setupProofEventListner() {
  let proofEvent;
  Blockproof.deployed().then(function(i) {
    proofEvent = i.newProofCreated({ fromBlock: 0, toBlock: "latest" });
    proofEvent.watch(function(err, result) {
      if (err) {
        console.log(err);
        return;
      }
      saveTheProof(result.args);
    });
  });
}

function saveTheProof(proof) {
  ProofModel.findOne(
    { blockchainId: proof._proofId.toLocaleString() },
    function(err, dbProof) {
      if (dbProof != null) {
        return;
      }
      var p = new ProofModel({
        proofId: proof._proofId,
        proofCreator: proof._proofCreator,
        proofTitle: proof._proofTitle,
        proofRemarks: proof._proofRemarks,
        proofTags: proof._proofTags,
        proofIpfshash: proof._proofIpfsHash,
        proofTimeStamp: proof._proofTimeStamp * 1000
      });
      p.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          ProofModel.count({}, function(err, count) {
            console.log("total count of Proofs is " + count);
          });
        }
      });
    }
  );
}

app.get("/proofs", function(req, res) {
  query = { proofCreator: { $eq: req.query.creator } };
  if (req.query.tag !== undefined && req.query.tag != "") {
    query["proofTags"] = { $regex: req.query.tag };
  }
  ProofModel.find(query, null, function(err, proofs) {
    res.send(proofs);
  });
});

app.get("/proof/id", function(req, res) {
  query = { proofId: { $eq: req.query.proofId } };
  ProofModel.find(query, null, function(err, proofdetails) {
    res.send(proofdetails);
  });
});
