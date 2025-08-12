// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */
contract FunctionsConsumerExample is FunctionsClient,ERC721URIStorage {
    using FunctionsRequest for FunctionsRequest.Request;

    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    //  * @param donHostedSecretsSlotID Don hosted secrets slotId
    //  * @param donHostedSecretsVersion Don hosted secrets version
    uint8 private donHostedSecretsSlotID;
    uint64 private donHostedSecretsVersion;
    uint64 private subscriptionId;
    mapping(bytes32 reqId=>address player) reqIdToPlayer;
    uint256 tokenId=0;

    string constant META_DATA="ipfs://QmNZ1JEt9ArHn7htUNckjUnf69TaeDPNFLFRp6cttEAd2y";
    uint32 constant GAS_LIMIT=300_000;
    bytes32 constant DON_ID=0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000;
    address constant ROUTER=0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;
    //@param source JavaScript source code
    string constant SOURCE=
     'if(!secrets.apiKey) {throw Error("API key is not provided")};'
        "const apiKey = secrets.apiKey;"
        "const playerAddress = args[0];"
        "const apiResponse = await Functions.makeHttpRequest({"
            'url: "https://rvfoyxnry3a4v3xfe7pa7zltmy0yqmvm.lambda-url.ap-southeast-2.on.aws/",'
            'method: "GET",'
            "headers: {"
            '"api-key": apiKey,'
            '"player": playerAddress}});'

        'if (apiResponse.error) {console.error(apiResponse.error);throw Error("Request failed");};'
        "const { data } = apiResponse;"
        'if(!data.score) {console.error("the user does not exist");throw Error("Score does not exist, request failed");};'
        "return Functions.encodeInt256(data.score);";


    error UnexpectedRequestID(bytes32 requestId);

    event Response(bytes32 indexed requestId, bytes response, bytes err);

    constructor() FunctionsClient(ROUTER) ERC721("BlackJack","BJK") {}

    function setDonHostSecretConfig(uint8 _slotID, uint64 _version,uint64 _sub_id) public {
        donHostedSecretsSlotID=_slotID;
        donHostedSecretsVersion=_version;
        subscriptionId=_sub_id;
    }
    /**
     * @notice Send a simple request
     */
    function sendRequest(
        string[] memory args,
        address player
    ) external returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(SOURCE);

        req.addDONHostedSecrets(
            donHostedSecretsSlotID,
            donHostedSecretsVersion
        );
        
        if (args.length > 0) req.setArgs(args);
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            GAS_LIMIT,
            DON_ID
        );
        reqIdToPlayer[s_lastRequestId]=player;
        return s_lastRequestId;
    }

    /**
     * @notice Send a pre-encoded CBOR request
     * @param request CBOR-encoded request data
     * @param gasLimit The maximum amount of gas the request can consume
     * @param donID ID of the job to be invoked
     * @return requestId The ID of the sent request
     */
    function sendRequestCBOR(
        bytes memory request,
        uint32 gasLimit,
        bytes32 donID
    ) external  returns (bytes32 requestId) {
        s_lastRequestId = _sendRequest(
            request,
            subscriptionId,
            gasLimit,
            donID
        );
        return s_lastRequestId;
    }

    /**
     * @notice Store latest result/error
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the execution pipeline
     * Either response or error parameter will be set, but never both
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }
        s_lastResponse = response;
        s_lastError = err;

        //check if the player's score is greater than 1000
        int256 score=abi.decode(response, (int256));
        if (score>=1000){
            //mint a token for player address
            address player=reqIdToPlayer[requestId];
            _safeMint(player,tokenId);
            _setTokenURI(tokenId,META_DATA);
            tokenId++;
        }

        emit Response(requestId, s_lastResponse, s_lastError);
    }
}