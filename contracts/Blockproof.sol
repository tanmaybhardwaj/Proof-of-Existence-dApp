pragma solidity ^0.4.20;
import "installed_contracts/oraclize-api/contracts/usingOraclize.sol";

/// @title A contract to save time-stamped hash of images and documents on IPFS to prove existence of an entity
/// at that point in time
/// @author Tanmay Bhardwaj
/// @notice This contract can only be used to create proof of existence of an entity and may not be suitable to
/// prove its legal ownership 
/// @dev All function calls are currently implement without side effects

contract Blockproof  is usingOraclize {
    /*=================================
    =            MODIFIERS            =
    =================================*/
    modifier onlyOwner() {
        require(msg.sender == contractOwner);
        _;
    }

    modifier stopInEmergency {
        if (!stopped) _; 
    }
    
    modifier onlyInEmergency { 
        if (stopped) _; 
    }

    /*=================================
    =            CONFIGURABLES            =
    ===================================*/
    address contractOwner;
    address proofCreator;  
    uint16  proofId;
    uint    proofTimeStamp;
    string  proofTitle;  
    string  proofIpfsHash;
    string  proofRemarks;
    string  proofTags; 
    bool    private  stopped;
    uint    constant proofTitleLength       = 15;
    uint    constant proofIpfsHashLength    = 46;
    uint    constant proofRemarksLength     = 40;
    uint    constant proofTagsLength        = 10;
    
    /*=================================
    =            EVENTS               =
    ==================================*/
    
    event timestampNow(uint _proofTimeStamp);
    event newProofCreated(uint _proofId, address _proofCreator, string _proofTitle, 
        string _proofIpfsHash, string _proofRemarks, string _proofTags, uint _proofTimeStamp);    

    /*================================
    =            DATASETS            =
    ==================================*/
/// @notice mapping of document hash and user address
    mapping (uint => Proof) idToProof;

    // Struct to store document details
    struct Proof {
        uint16   id;
        uint     timestamp;
        address  creator; 
        string   ipfshash;          
    }
    
    /*================================
    =            FUNCTIONS           =
    ==================================*/
/// @notice This is the constructor function
/// @dev 
    function Blockproof () public payable {
        contractOwner = msg.sender;
        proofId = 0;
        stopped = false;
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
    }
    
/// @notice This is the fallback function in case someone sends ether to the contract
    function() public payable {}
    
/// @notice This function is to send ether to this contract    
    function deposit() payable public {
        // nothing to do!
    }

/// @notice This function is to get ether balance of this contract    
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

/// @notice This function is used to withdraw balance of this contract, it can be invoked only by contract owner
    function withdraw() public onlyOwner {
            msg.sender.transfer(address(this).balance);
        }
        
/// @notice This function will destroy this contract and can be invoked only by contract owner 
    function kill() public onlyOwner {
        selfdestruct(contractOwner);
   }

/// @notice This function will work as circuit breaker to enable or disable a function is case of any 
/// any emergency. It can be invoked only by contract owner.
/// @return  Bool status of emergency circuit breaker
    function toggle_active() onlyOwner public returns(bool){
      stopped = !stopped;
      return stopped;
    }
   
/// @notice This function received ipfs hash and title of the document from front end and calls another function 
/// to Oraclize 'WolframAlpha' Service to get current timestamp
/// @dev It is necessary to pass document hash and ipfs hash to this function    
/// @param  _title : title of the document sent from front end   
/// @param _ipfshash : ipfs hash of the document sent from front end
/// @param _proofremarks : remarks given to the document sent from front end
/// @param _prooftags : tags given to the document sent from front end
/// @return  None return parameters
    function createProof (string _title, string _ipfshash, string _proofremarks, string _prooftags)
        payable public stopInEmergency {        
    assert ((bytes(_title).length > 0) && (bytes(_title).length <= proofTitleLength));
    assert ((bytes(_ipfshash).length > 0) && (bytes(_ipfshash).length == proofIpfsHashLength));
    assert (bytes(_proofremarks).length <= proofRemarksLength);
    assert (bytes(_prooftags).length <= proofTagsLength); 
    proofId += 1;
    proofTitle = _title;
    proofCreator = msg.sender;
    proofIpfsHash = _ipfshash;
    proofRemarks = _proofremarks; 
    proofTags = _prooftags; 
    
/// Call Oraclize to get current timestamp
    update();
    }

/// @notice This function returns details of the proof saved. For a given proof ID, it will return data only if the sender is 
/// creator of the proof
/// @param _proofId : Unique Id associated with the proof
/// @return existingProof.timestamp : Timestamp 
/// @return existingProof.creator : Address of the creator
/// @return existingProof.ipfshash : Hash of the document
    function getDetailsByIndex (uint _proofId) view public stopInEmergency
        returns (uint, address, string)
    {
        Proof memory existingProof = idToProof[_proofId];
        if (msg.sender != existingProof.creator)
         {throw;}
        else {
        return 
        (existingProof.timestamp, existingProof.creator, existingProof.ipfshash); 
        }
    }
    
/// @notice This function will send Oraclize request to get current time stamp 
    function update() payable stopInEmergency{
        var gasLimit = 200000;
        oraclize_query("WolframAlpha", "timestamp now", gasLimit);
    }
    
/// @notice This function is callback from Oraclize and returns current timestamp. From this function, we call another function which 
/// will execute logic to store the information related to the proof
/// @return myid : unique id of the Oraclize transaction
/// @return result : current timestamp
    function __callback(bytes32 myid, string result) {
        proofTimeStamp = parseInt(result);
        timestampNow(proofTimeStamp);
        _saveTheProof(proofTimeStamp);
    }
    
/// @notice This function will store proof related details in the 'Proof' mapping 
/// @param _proofTimeStamp : Timestamp 
    function _saveTheProof(uint _proofTimeStamp) private stopInEmergency  {    
    Proof memory newProof = Proof(proofId, _proofTimeStamp, proofCreator, proofIpfsHash); 
    idToProof[proofId]=newProof;
    newProofCreated(proofId, proofCreator, proofTitle, proofIpfsHash, proofRemarks, proofTags, _proofTimeStamp);
    }     
}
