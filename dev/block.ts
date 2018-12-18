import { Transaction } from "./transaction";

export class Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  nonce: number;
  hash: string;
  previousBlockHash: string;

  constructor(
    nonce: number,
    previousBlockHash: string,
    hash: string,
    index: number,
    transactions: Transaction[]
  ) {
    this.index = index;
    this.timestamp = Date.now();
    this.transactions = transactions;
    this.nonce = nonce;
    this.hash = hash;
    this.previousBlockHash = previousBlockHash;
  }
}
