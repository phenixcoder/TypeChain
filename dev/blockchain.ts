import { Transaction } from "./transaction";
import { Block } from "./block";

export class Blockchain {
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
}
