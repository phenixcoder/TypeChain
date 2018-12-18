import express from "express";
import bodyParser from "body-parser";
import Blockchain from "./dev/blockchain";
import uuid from "uuid/v1";

const PORT = process.argv[2];
const URL = process.argv[3];
const app = express();
import * as rp from "request-promise";
import Transaction from "./dev/transaction";

const NODE_ADDRESS = uuid()
  .split("-")
  .join("");

const CHAIN = new Blockchain(URL);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// get entire blockchain
app.get("/blockchain", function(req, res) {
  res.send(CHAIN);
});

// create a new transaction
app.post("/transaction", function(req, res) {
  const newTransaction = req.body;
  const blockIndex = CHAIN.addTransactionToPendingTransactions(newTransaction);
  res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});

// broadcast transaction
app.post("/transaction/broadcast", function(req, res) {
  const newTransaction = CHAIN.createNewTransaction(
    req.body.amount,
    req.body.sender,
    req.body.recipient
  );
  CHAIN.addTransactionToPendingTransactions(newTransaction);

  const requestPromises: any[] = [];
  CHAIN.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + "/transaction",
      method: "POST",
      body: newTransaction,
      json: true
    };

    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises).then(data => {
    res.json({ note: "Transaction created and broadcast successfully." });
  });
});

// mine a block
app.get("/mine", function(req, res) {
  const lastBlock = CHAIN.getLastBlock();
  const previousBlockHash = lastBlock["hash"];
  const currentBlockData = {
    transactions: CHAIN.pendingTransactions,
    index: lastBlock["index"] + 1
  };
  const nonce = CHAIN.proofOfWork(previousBlockHash, currentBlockData);
  const blockHash = CHAIN.hashBlock(previousBlockHash, currentBlockData, nonce);
  const newBlock = CHAIN.createNewBlock(nonce, previousBlockHash, blockHash);

  const requestPromises: any[] = [];
  CHAIN.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + "/receive-new-block",
      method: "POST",
      body: { newBlock: newBlock },
      json: true
    };

    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises)
    .then(data => {
      const requestOptions = {
        uri: CHAIN.currentNodeUrl + "/transaction/broadcast",
        method: "POST",
        body: {
          amount: 12.5,
          sender: "00",
          recipient: NODE_ADDRESS
        },
        json: true
      };

      return rp(requestOptions);
    })
    .then(data => {
      res.json({
        note: "New block mined & broadcast successfully",
        block: newBlock
      });
    });
});

// receive new block
app.post("/receive-new-block", function(req, res) {
  const newBlock = req.body.newBlock;
  const lastBlock = CHAIN.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock["index"] + 1 === newBlock["index"];

  if (correctHash && correctIndex) {
    CHAIN.chain.push(newBlock);
    CHAIN.pendingTransactions = [];
    res.json({
      note: "New block received and accepted.",
      newBlock: newBlock
    });
  } else {
    res.json({
      note: "New block rejected.",
      newBlock: newBlock
    });
  }
});

// register a node and broadcast it the network
app.post("/register-and-broadcast-node", function(req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  if (CHAIN.networkNodes.indexOf(newNodeUrl) == -1)
    CHAIN.networkNodes.push(newNodeUrl);

  const regNodesPromises: any[] = [];
  CHAIN.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + "/register-node",
      method: "POST",
      body: { newNodeUrl: newNodeUrl },
      json: true
    };

    regNodesPromises.push(rp(requestOptions));
  });

  Promise.all(regNodesPromises)
    .then(data => {
      const bulkRegisterOptions = {
        uri: newNodeUrl + "/register-nodes-bulk",
        method: "POST",
        body: {
          allNetworkNodes: [...CHAIN.networkNodes, CHAIN.currentNodeUrl]
        },
        json: true
      };

      return rp(bulkRegisterOptions);
    })
    .then(data => {
      res.json({ note: "New node registered with network successfully." });
    });
});

// register a node with the network
app.post("/register-node", function(req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  const nodeNotAlreadyPresent = CHAIN.networkNodes.indexOf(newNodeUrl) == -1;
  const notCurrentNode = CHAIN.currentNodeUrl !== newNodeUrl;
  if (nodeNotAlreadyPresent && notCurrentNode)
    CHAIN.networkNodes.push(newNodeUrl);
  res.json({ note: "New node registered successfully." });
});

// register multiple nodes at once
app.post("/register-nodes-bulk", function(req, res) {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach((networkNodeUrl: string) => {
    const nodeNotAlreadyPresent =
      CHAIN.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = CHAIN.currentNodeUrl !== networkNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode)
      CHAIN.networkNodes.push(networkNodeUrl);
  });

  res.json({ note: "Bulk registration successful." });
});

// consensus
app.get("/consensus", function(req, res) {
  const requestPromises: any[] = [];
  CHAIN.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + "/blockchain",
      method: "GET",
      json: true
    };

    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises).then(blockchains => {
    const currentChainLength = CHAIN.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain = null;
    let newPendingTransactions: Transaction[] = [];

    blockchains.forEach(blockchain => {
      if (blockchain.chain.length > maxChainLength) {
        maxChainLength = blockchain.chain.length;
        newLongestChain = blockchain.chain;
        newPendingTransactions = blockchain.pendingTransactions;
      }
    });

    if (
      !newLongestChain ||
      (newLongestChain && !CHAIN.chainIsValid(newLongestChain))
    ) {
      res.json({
        note: "Current chain has not been replaced.",
        chain: CHAIN.chain
      });
    } else {
      CHAIN.chain = newLongestChain;
      CHAIN.pendingTransactions = newPendingTransactions;
      res.json({
        note: "This chain has been replaced.",
        chain: CHAIN.chain
      });
    }
  });
});

// get block by blockHash
app.get("/block/:blockHash", function(req, res) {
  const blockHash = req.params.blockHash;
  const correctBlock = CHAIN.getBlock(blockHash);
  res.json({
    block: correctBlock
  });
});

// get transaction by transactionId
app.get("/transaction/:transactionId", function(req, res) {
  const transactionId = req.params.transactionId;
  const trasactionData = CHAIN.getTransaction(transactionId);
  res.json({
    transaction: trasactionData.transaction,
    block: trasactionData.block
  });
});

// get address by address
app.get("/address/:address", function(req, res) {
  const address = req.params.address;
  const addressData = CHAIN.getAddressData(address);
  res.json({
    addressData: addressData
  });
});

app.listen(PORT, function() {
  console.log(`Blockchain Live.\n\nListening on port ${PORT}...`);
});
