const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const ProofSchema = new Schema({
  proofId: {
    type: Number,
    required: true
  },
  proofCreator: {
    type: String,
    required: true
  },
  proofTitle: {
    type: String,
    required: true
  },
  proofRemarks: {
    type: String,
    max: 100
  },
  proofTags: {
    type: [String]
  },
  proofIpfshash: {
    type: String,
    required: true
  },
  proofTimeStamp: {
    type: String,
    required: true
  }
});

module.exports = Proof = mongoose.model("proofs", ProofSchema);
