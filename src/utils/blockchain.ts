import CryptoJS from 'crypto-js';
import { BlockchainBlock } from '../types';

class Blockchain {
  private chain: BlockchainBlock[];
  private difficulty: number;

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
  }

  createGenesisBlock(): BlockchainBlock {
    return {
      index: 0,
      timestamp: new Date(),
      data: {
        applicationId: 'genesis',
        studentId: 'genesis',
        action: 'genesis',
        dataHash: 'genesis',
        status: 'genesis'
      },
      hash: this.calculateHash(0, new Date(), 'genesis', '0', 0),
      previousHash: '0',
      nonce: 0
    };
  }

  getLatestBlock(): BlockchainBlock {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data: BlockchainBlock['data']): string {
    const previousBlock = this.getLatestBlock();
    const newBlock: BlockchainBlock = {
      index: previousBlock.index + 1,
      timestamp: new Date(),
      data,
      hash: '',
      previousHash: previousBlock.hash,
      nonce: 0
    };

    newBlock.hash = this.mineBlock(newBlock);
    this.chain.push(newBlock);
    this.saveToStorage();
    return newBlock.hash;
  }

  calculateHash(index: number, timestamp: Date, data: string, previousHash: string, nonce: number): string {
    return CryptoJS.SHA256(index + timestamp + JSON.stringify(data) + previousHash + nonce).toString();
  }

  mineBlock(block: BlockchainBlock): string {
    const target = Array(this.difficulty + 1).join('0');
    
    while (block.hash.substring(0, this.difficulty) !== target) {
      block.nonce++;
      block.hash = this.calculateHash(block.index, block.timestamp, JSON.stringify(block.data), block.previousHash, block.nonce);
    }
    
    return block.hash;
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== this.calculateHash(
        currentBlock.index,
        currentBlock.timestamp,
        JSON.stringify(currentBlock.data),
        currentBlock.previousHash,
        currentBlock.nonce
      )) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  getChain(): BlockchainBlock[] {
    return this.chain;
  }

  private saveToStorage(): void {
    localStorage.setItem('blockchain', JSON.stringify(this.chain));
  }

  loadFromStorage(): void {
    const stored = localStorage.getItem('blockchain');
    if (stored) {
      this.chain = JSON.parse(stored);
    }
  }
}

export const blockchain = new Blockchain();
blockchain.loadFromStorage();