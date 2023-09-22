import { useEffect, useState } from 'react'
import './App.css'
import {Xumm} from 'xumm'
import { submitTx, waitFinalizedTx } from './utils'
import { useProxxy } from './cmix/contexts/proxxy-context'
import { encoder } from './cmix/utils'
import { relayContact } from './assets/relay'

const nodeUrl = process.env.REACT_APP_XRPL_URL || 'https://xrplcluster.com/'

const xumm = new Xumm(process.env.REACT_APP_XUMM_API_KEY || '') // Some API Key

const relay = encoder.encode(relayContact);

function App() {
  const [account, setAccount] = useState('Friend')
  const [payloadUuid, setPayloadUuid] = useState('')
  const [appName, setAppName] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [signed, setSigned] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState('unknown')
  const [finalized, setFinalized] = useState(false)
  const { connect, supportedNetworks, request } = useProxxy();
  const [networks, setNetworks] = useState<string[]>([]);

  xumm.user.account.then(a => setAccount(a ?? ''))
  xumm.environment.jwt?.then(j => setAppName(j?.app_name ?? ''))

  const logout = () => {
    xumm.logout()
    setAccount('Friend')
  }

  useEffect( () => {
    async function initProxxy() {
        // Connect to proxxy
        console.log('Proxxy: Connecting...');
        await connect(relay);
        console.log('Proxxy: Connected!');
        // Get networks
        const nets = supportedNetworks();
        console.log('Proxxy: Networks', nets);
        setNetworks(nets);
    }
    initProxxy();
  }, [])

  const createPayload = async () => {
    const payload = await xumm.payload?.createAndSubscribe({
      txjson : {
        TransactionType: 'Payment',
        Destination: 'rfjxCC4Nkwo8jGn3NKk4y3ji3u35X1M8oE',
        Account: account,
        Amount: String(1337),
      },
      options: {
        submit: false,
      }
    }, event => {
      // Only return (websocket will live till non void)
      if (Object.keys(event.data).indexOf('signed') > -1) {
        // Get payload result
        setSigned(event.data.signed)
        return true
      }
    })

    if (payload) {
      setQrCode(payload.created.refs.qr_png)
      setPayloadUuid(payload.created.uuid)
    }

    return payload
  }

  const submit = async () => {
    if (signed) {
      const response = await xumm.payload?.get(payloadUuid)
      setSending(true);
      const txid = response?.response.txid || "";
      const resp = await submitTx(nodeUrl, response?.response.hex || "")
      if (resp) {
        if (resp.result.accepted || resp.result.applied || resp.result.broadcast) {
          setResult(resp.result.engine_result as string)
          await waitFinalizedTx(nodeUrl, txid);
          setFinalized(true);
        }
      }
      return response
    }
  };

  return (
    <div className="App">
      <h2>{ appName }</h2>
      <br />
      <div>
        Hi <b>{ account }</b>
      </div>
      <div>
        {account === 'Friend' && !xumm.runtime.xapp
          ? <button onClick={xumm.authorize}>Sign in</button>
          : ''}
          <br />
      </div>
      <div>
        {account !== 'Friend' && qrCode === '' &&
          <>
            <button onClick={createPayload}>Make a payment</button>
            &nbsp;- or -&nbsp;
            <button onClick={logout}>Sign Out</button>
          </>
        }
      </div>
      <div>
        {networks &&
          <>
          <br/>
            {networks}
          </>
        }
      </div>
      <div>
        {qrCode !== '' && !signed && <img src={qrCode} />}
      </div>
      <div>
        {signed && result === 'unknown' && !sending &&
          <>
            <button onClick={submit}>Submit Payment over cMix</button>
          </>
        }
      </div>
      <div>
        {result === 'unknown' && sending &&
          <>
            Sending payment ...
          </>
        }
      </div>
      <div>
        {result !== 'unknown' && !finalized &&
          <>
            Payment result: <b>{result}</b>
          </>
        }
      </div>
      <div>
        {finalized && <b>Payment finalized!</b>}
      </div>
    </div>
  )
}

export default App
