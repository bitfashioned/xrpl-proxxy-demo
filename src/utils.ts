import { encoder } from "./cmix/utils";

// Functions to interact with the XRPL via HTTP JSON-RPC

export type RequestFn = (req: Uint8Array) => Promise<any>;

export const fetchFunc = async (url: string, req: Uint8Array) => {
  try {
    const resp = await fetch(url, {
      method: "POST",
      body: req,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Request-Method": "POST",
      },
    });
    const json = await resp.json();
    return json;
  } catch (e) {
    return undefined;
  }
};

// Submit transaction
export const submitTx = async (reqFn: RequestFn, txblob: string) => {
  const req = buildSubmit(txblob);
  const resp = await reqFn(req);
  return resp;
};

const buildSubmit = (txblob: string): Uint8Array => {
  const req = {
    method: "submit",
    params: [
      {
        tx_blob: txblob,
      },
    ],
  };
  const reqStr = JSON.stringify(req);
  const reqBytes = encoder.encode(reqStr);
  return reqBytes;
};

// Wait for transaction to be finalized
export const waitFinalizedTx = async (reqFn: RequestFn, txid: string) => {
  let done = true;
  while (done) {
    await sleep(1);
    const res = await verifyTx(reqFn, txid);
    if (res) {
      if (res.result.validated) {
        done = false;
      }
    }
  }
};

// Verify a transaction
const verifyTx = async (reqFn: RequestFn, txid: string) => {
  const req = buildVerify(txid);
  const resp = await reqFn(req);
  return resp;
};

const buildVerify = (txid: string): Uint8Array => {
  const req = {
    method: "tx",
    params: [
      {
        transaction: txid,
      },
    ],
  };
  const reqStr = JSON.stringify(req);
  const reqBytes = encoder.encode(reqStr);
  return reqBytes;
};

// Sleep
const sleep = async (seconds: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
};
