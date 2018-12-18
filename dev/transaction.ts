import uuid from "uuid/v1";

export class Transaction {
  amount: number;
  sender: string;
  recipient: string;
  transactionId: string;

  constructor(amount: number, sender: string, recipient: string) {
    this.amount = amount;
    this.sender = sender;
    this.recipient = recipient;
    this.transactionId = uuid()
      .split("-")
      .join("");
  }
}
