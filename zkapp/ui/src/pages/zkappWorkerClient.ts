import { fetchAccount, PublicKey, Field, CircuitString } from 'o1js';


import type {
  ZkappWorkerRequest,
  ZkappWorkerReponse,
  WorkerFunctions,
} from './zkappWorker';

export default class ZkappWorkerClient {
  // ---------------------------------------------------------------------------------------

  setActiveInstanceToDevnet() {
    return this._call('setActiveInstanceToDevnet', {});
  }

  loadContract() {
    return this._call('loadContract', {});
  }

  compileZkProgram() {
    return this._call('compileZkProgram', {});
  }
  
  compileContract() {
    return this._call('compileContract', {});
  }

  fetchAccount({
    publicKey,
  }: {
    publicKey: PublicKey;
  }): ReturnType<typeof fetchAccount> {
    const result = this._call('fetchAccount', {
      publicKey58: publicKey.toBase58(),
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  initZkappInstance(publicKey: PublicKey) {
    return this._call('initZkappInstance', {
      publicKey58: publicKey.toBase58(),
    });
  }
/*
  async getCommitment(): Promise<Field> {
    const result = await this._call('getCommitment', {});
    return Field.fromJSON(JSON.parse(result as string));
  }
*/
  createRegisterTransaction(subdomain: string, mina_adress: string, eth_address: Field) {
    return this._call('createRegisterTransaction', {
      subdomain: subdomain, mina_adress: mina_adress, eth_address: eth_address
    });
  }
  proveRegisterTransaction() {
    return this._call('proveRegisterTransaction', {});
  }

  createCheckTransaction(subdomain: string){
    return this._call('createCheckTransaction', {
      subdomain: subdomain
    });
  }
  proveCheckTransaction() {
    return this._call('proveCheckTransaction', {});
  }
  async getTransactionJSON() {
    const result = await this._call('getTransactionJSON', {});
    return result;
  }

  // ---------------------------------------------------------------------------------------

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL('./zkappWorker.ts', import.meta.url));
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      this.promises[event.data.id].resolve(event.data.data);
      delete this.promises[event.data.id];
    };
  }

  _call(fn: WorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }
}