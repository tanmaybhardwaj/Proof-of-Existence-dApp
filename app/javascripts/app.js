import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3 } from "web3";
import { default as contract } from "truffle-contract";
import blockproof_artifacts from "../../build/contracts/Blockproof.json";
const Blockproof = contract(blockproof_artifacts);

//using the infura.io node, otherwise ipfs requires you to run a daemon on your own computer/server.
const IPFS = require("ipfs-api");
const ipfs = new IPFS({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https"
});

const offchainServer = "http://localhost:3000";

window.App = {
  start: function() {
    var self = this;

    Blockproof.setProvider(web3.currentProvider);

    // Keep Checking Metamask Status, if user is logged in or not
    setInterval(detectWeb3, 15000);

    // Store buffer array of the file uploaded
    var reader;
    var tags;

    // Display proofs created using the logged in metamask account
    renderUserProofs();

    // Display all proofs uploaded by User Account (in Metamask or Truffle)
    if ($("#proof-details").length > 0) {
      let proofId = new URLSearchParams(window.location.search).get("id");
      renderProofDetails(proofId);
    }

    // Compute Array Buffer of the file when uploaded by user
    $("#proof-file").change(function(event) {
      const file = event.target.files[0];
      reader = new window.FileReader();
      reader.readAsArrayBuffer(file);
    });

    // Add file to Blockchain
    $("#add-proof-to-proofs").submit(function(event) {
      $("#fail").hide();
      $("#msg").hide();
      $("#createproofbutton").attr("disabled", true);
      $("#loader").show();
      const req = $("#add-proof-to-proofs").serialize();
      let params = JSON.parse(
        '{"' +
          req
            .replace(/"/g, '\\"')
            .replace(/&/g, '","')
            .replace(/=/g, '":"') +
          '"}'
      );
      let decodedParams = {};
      Object.keys(params).forEach(function(v) {
        decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
      });
      saveProof(reader, decodedParams);
      event.preventDefault();
    });

    // Display file details stored on IPFS when its Hash is clicked
    $("#proof-ipfshash").click(function() {
      var results = "";
      $("a").each(function() {
        results = $(this).text();
      });
      let url = "https://ipfs.infura.io/ipfs/" + results;
      window.open(url, "_blank");
    });

    // Display all proofs which have Tag attached as entered by User in Search Option
    $("#tagsearchbutton").click(function(event) {
      tags = $("#tagvalue").val();
      $("#proof-list").empty();
      renderProofs("proof-list", {
        creator: web3.eth.accounts[0],
        tag: tags
      });
    });
  }
};

window.addEventListener("load", function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== "undefined") {
    console.warn("Using web3 detected from external source.");
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545.");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:9545")
    );
  }
  App.start();
});

// Detect if metamask is installed and user has logged in
function detectWeb3() {
  web3.eth.getAccounts(function(err, accs) {
    if (err != null) {
      alert(
        "There was an error fetching your ethereum accounts. Please check if Metamask is installed."
      );
      return;
    }
    if (accs.length == 0) {
      alert(
        "Couldn't retrieve accounts! Make sure you have logged in to Metamask."
      );
      return;
    }
  });
}

// Display all proofs uploaded by the user
function renderUserProofs() {
  $("#owner-address").html(web3.eth.accounts[0]);
  renderProofs("proof-list", {
    creator: web3.eth.accounts[0]
  });
}

function renderProofs(div, filters) {
  $.ajax({
    url: offchainServer + "/proofs",
    type: "get",
    contentType: "application/json; charset=utf-8",
    data: filters
  }).done(function(data) {
    if (typeof web3.eth.accounts[0] == "undefined") {
      $("#proofs-status").html(
        "Please ensure that Metamask is installed and logged in!"
      );
    } else if (data.length == 0) {
      $("#proofs-status").html("No proofs found for the account");
    } else {
      $("#" + div).html("");
      $("#proofs-status").html("Below are proofs created by the account");
    }
    while (data.length > 0) {
      let chunks = data.splice(0, 4);
      let row = $("<div/>");
      row.addClass("row");
      chunks.forEach(function(value) {
        let node = buildProofs(value);
        row.append(node);
      });
      $("#" + div).append(row);
    }
  });
}

// Display all proofss created by a user account (Metamask or Truffle)
function buildProofs(proof) {
  let node = $("<div/>");
  node.addClass("col-sm-3 text-center col-margin-bottom-1");
  node.append(
    "<img src= 'https://ipfs.infura.io/ipfs/" +
      proof.proofIpfshash +
      "' width='150px' />"
  );
  node.append("<div>" + proof.proofTitle + "</div>");
  node.append("<a href=proof.html?id=" + proof.proofId + ">Details</a>");
  return node;
}

// Display details of a single proof
function renderProofDetails(proofId) {
  Blockproof.deployed().then(function(i) {
    i.getDetailsByIndex
      .call(proofId, {
        from: web3.eth.accounts[0]
      })
      .then(function(p) {
        $("#proof-ipfshash").html(p[2]);
        let proofTimeStamp = new Date(p[0] * 1000);
        $("#proof-prooftimestamp").html(proofTimeStamp);
      });
  });

  $.ajax({
    url: offchainServer + "/proof/id",
    type: "get",
    contentType: "application/json; charset=utf-8",
    data: { proofId: proofId }
  }).done(function(data) {
    while (data.length > 0) {
      let chunks = data.splice(0, 4);
      chunks.forEach(function(value) {
        $("#proof-name").html(value.proofTitle);
        $("#proof-remarks").html(value.proofRemarks);
        $("#proof-tags").html(value.proofTags);
      });
    }
  });
}

// Create proof
function saveProof(reader, decodedParams) {
  let fileId;
  saveFileOnIpfs(reader).then(function(id) {
    fileId = id;
    saveProofToBlockchain(decodedParams, fileId);
  });
}

// Create proof on IPFS
function saveFileOnIpfs(reader) {
  return new Promise(function(resolve, reject) {
    const buffer = Buffer.from(reader.result);
    ipfs
      .add(buffer)
      .then(response => {
        resolve(response[0].hash);
      })
      .catch(err => {
        console.error(err);
        reject(err);
      });
  });
}

function saveProofToBlockchain(params, fileId) {
  Blockproof.deployed().then(function(i) {
    i.createProof(params["title"], fileId, params["remarks"], params["tags"], {
      from: web3.eth.accounts[0]
    })
      .then(proofCreated)
      .catch(function(e) {
        $("#loader").hide();
        $("#fail").show();
        $("#fail").html(e.message);
        $("#createproofbutton").attr("disabled", false);
      });
  });
}

function proofCreated() {
  let proofEvent;
  Blockproof.deployed().then(function(i) {
    proofEvent = i.newProofCreated({ fromBlock: 0, toBlock: "latest" });
    proofEvent.watch(function(err, result) {
      if (err) {
        $("#loader").hide();
        $("#fail").show();
        $("#fail").html("Error while creating the proof!");
        return;
      } else {
        $("#loader").hide();
        $("#msg").show();
        $("#msg").html("Proof of Existence successfully created!");
      }
    });
  });
}
