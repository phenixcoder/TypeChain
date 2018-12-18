import Transaction from "./transaction";
import Block from "./block";

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
    throw new Error("Method not implemented.");
  }
  getTransaction(transactionId: any): any {
    throw new Error("Method not implemented.");
  }
  getBlock(blockHash: any): any {
    throw new Error("Method not implemented.");
  }
  chainIsValid(newLongestChain: never): any {
    throw new Error("Method not implemented.");
  }
  createNewBlock(nonce: any, previousBlockHash: any, blockHash: any): any {
    throw new Error("Method not implemented.");
  }
  hashBlock(
    previousBlockHash: any,
    currentBlockData: { transactions: Transaction[]; index: any },
    nonce: any
  ): any {
    throw new Error("Method not implemented.");
  }
  proofOfWork(
    previousBlockHash: any,
    currentBlockData: { transactions: Transaction[]; index: any }
  ): any {
    throw new Error("Method not implemented.");
  }
  getLastBlock(): any {
    throw new Error("Method not implemented.");
  }
  createNewTransaction(amount: any, sender: any, recipient: any): any {
    throw new Error("Method not implemented.");
  }
  addTransactionToPendingTransactions(newTransaction: any): any {
    throw new Error("Method not implemented.");
  }
}
