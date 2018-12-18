import Transaction from "./transaction";
import Block from "./block";
import uuid from "uuid/v1";
import sha256 from "sha256";

export default class Blockchain {
  chain: Block[];
  pendingTransactions: Transaction[];
  currentNodeUrl: string;
  networkNodes: string[];

  constructor(currentNodeUrl: string) {
    this.chain = [];
    this.pendingTransactions = [];

    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
  }

  getAddressData(address: any): any {
    const addressTransactions: Transaction[] = [];
    this.chain.forEach(block => {
      block.transactions.forEach(transaction => {
        if (
          transaction.sender === address ||
          transaction.recipient === address
        ) {
          addressTransactions.push(transaction);
        }
      });
    });

    let balance = 0;
    addressTransactions.forEach(transaction => {
      if (transaction.recipient === address) balance += transaction.amount;
      else if (transaction.sender === address) balance -= transaction.amount;
    });

    return {
      addressTransactions: addressTransactions,
      addressBalance: balance
    };
  }

  getTransaction(transactionId: any): any {
    let correctTransaction = null;
    let correctBlock = null;

    this.chain.forEach(block => {
      block.transactions.forEach(transaction => {
        if (transaction.transactionId === transactionId) {
          correctTransaction = transaction;
          correctBlock = block;
        }
      });
    });

    return {
      transaction: correctTransaction,
      block: correctBlock
    };
  }

  getBlock(blockHash: any): any {
    let correctBlock = null;
    this.chain.forEach(block => {
      if (block.hash === blockHash) correctBlock = block;
    });
    return correctBlock;
  }

  chainIsValid(blockchain: Block[]): any {
    let validChain = true;

    for (var i = 1; i < blockchain.length; i++) {
      const currentBlock = blockchain[i];
      const prevBlock = blockchain[i - 1];
      const blockHash = this.hashBlock(
        prevBlock["hash"],
        {
          transactions: currentBlock["transactions"],
          index: currentBlock["index"]
        },
        currentBlock["nonce"]
      );
      if (blockHash.substring(0, 4) !== "0000") validChain = false;
      if (currentBlock["previousBlockHash"] !== prevBlock["hash"])
        validChain = false;
    }

    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock["nonce"] === 100;
    const correctPreviousBlockHash = genesisBlock["previousBlockHash"] === "0";
    const correctHash = genesisBlock["hash"] === "0";
    const correctTransactions = genesisBlock["transactions"].length === 0;

    if (
      !correctNonce ||
      !correctPreviousBlockHash ||
      !correctHash ||
      !correctTransactions
    )
      validChain = false;

    return validChain;
  }

  createNewBlock(nonce: any, previousBlockHash: any, blockHash: any): any {
    const newBlock = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: this.pendingTransactions,
      nonce: nonce,
      hash: blockHash,
      previousBlockHash: previousBlockHash
    };

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
  }

  hashBlock(
    previousBlockHash: any,
    currentBlockData: { transactions: Transaction[]; index: any },
    nonce: any
  ): any {
    const dataAsString =
      previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
  }

  proofOfWork(
    previousBlockHash: any,
    currentBlockData: { transactions: Transaction[]; index: any }
  ): any {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== "0000") {
      nonce++;
      hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
  }

  getLastBlock(): any {
    return this.chain[this.chain.length - 1];
  }

  createNewTransaction(amount: any, sender: any, recipient: any): any {
    const newTransaction = {
      amount: amount,
      sender: sender,
      recipient: recipient,
      transactionId: uuid()
        .split("-")
        .join("")
    };

    return newTransaction;
  }

  addTransactionToPendingTransactions(newTransaction: Transaction): any {
    this.pendingTransactions.push(newTransaction);
    return this.getLastBlock()["index"] + 1;
  }
}
