import useCmix, { NetworkStatus } from '../hooks/useCmix';
import type { WithChildren } from '../types';
import React, { FC, useCallback, useState } from 'react';
import { useUtils } from './utils-context';
import { encoder, decoder } from '../utils';

export type ProxxyClient = {
    connect: (relay: Uint8Array) => Promise<void>;
    supportedNetworks: () => string[];
    request: (network: string, data: Uint8Array) => Promise<any>;
}

export const ProxxyContext = React.createContext<ProxxyClient>(
    {} as ProxxyClient
);

type ProxxyRequest = {
    recipient: Uint8Array;
    uri: string;
    method: number;
    data: Uint8Array;
}

export const ProxxyProvider: FC<WithChildren> = ({ children }) => {
    const [networks, setNetworks] = useState<string[]>([]);
    const {
        cmix,
        e2eId,
        status: cmixStatus
    } = useCmix();
    const { utils } = useUtils();
    const [ recipient, setRecipient ] = useState<Uint8Array>();

    // Internal
    const proxxyRequest = useCallback(async (req: ProxxyRequest): Promise<any> => {
        console.log('Proxxy: proxxyRequest');
        if (
            cmix &&
            utils &&
            e2eId &&
            cmixStatus === NetworkStatus.CONNECTED
        ) {
            // Build request
            console.log('Proxxy: Building request');
            const request = {
                Version: 1,
                Headers: new Uint8Array(),
                Content: req.data,
                Method: req.method,
                URI: req.uri,
                Error: "",
            };
            const reqStr = JSON.stringify(request);
            const reqBytes = encoder.encode(reqStr);

            // Send request
            console.log('Proxxy: Sending request');
            const params = utils.GetDefaultSingleUseParams();
            const response = await utils.RequestRestLike(e2eId, req.recipient, reqBytes, params);

            // Parse response
            console.log('Proxxy: Parsing response');
            const respStr = decoder.decode(response);
            const resp = JSON.parse(respStr);
            const contentBytes = utils.Base64ToUint8Array(resp.content);
            const contentStr = decoder.decode(contentBytes);
            const content = JSON.parse(contentStr);
            return content;
        } else {
            console.log('Proxxy: Not ready');
            return null;
        }
    }, [cmix, utils, e2eId, cmixStatus]);

    // Connect
    const connect = useCallback(async (relay: Uint8Array) => {
        // Connect to relay and get networks
        console.log('Proxxy: Connecting');
        const req: ProxxyRequest = {
            recipient: relay,
            uri: '/networks',
            method: 1, // GET
            data: new Uint8Array(),
        }
        const networks = await proxxyRequest(req);
        setNetworks(networks as string[]);
        setRecipient(relay);
    }, [proxxyRequest, setNetworks, setRecipient]);

    // Networks
    const supportedNetworks = useCallback(() => {
        return networks;
    }, [networks]);

    // Request
    const request = useCallback(async (network: string, data: Uint8Array): Promise<any> => {
        console.log('Proxxy: request');
        if (recipient) {
            console.log('Proxxy: Sending request');
            return proxxyRequest({
                recipient,
                uri: network,
                method: 2, // POST
                data,
            });
        } else {
            console.log('Proxxy: Recipient not set yet');
            return null;
        }
    }, [proxxyRequest, setNetworks, recipient]);

    return (
        <ProxxyContext.Provider
        value={{
            connect,
            supportedNetworks,
            request,
        }}
        >
        {children}
        </ProxxyContext.Provider>
    );
};

export const useProxxy = () => {
    const context = React.useContext(ProxxyContext);

    if (context === undefined) {
        throw new Error('useProxxy must be used within a ProxxyProvider');
    }

    return context;
};
  