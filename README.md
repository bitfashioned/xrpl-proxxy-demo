# xrpl-proxxy-demo

This repo started as a fork of the Xumm SDK React Demo, found [here](https://github.com/XRPL-Labs/XummSDK-React-Demo/).

## Introduction

This is a demo of using the Xumm wallet to sign a XRP payment and submitting it to the XPRL over the cMix mixnet from xx network.

Currently, this requires running the proxxy client locally, i.e., requests are not sent directly from the webapp over cMix.

## Usage

The XUMM API key and XRPL URL are set as enviromental variables set in the `.env` file. See the [example](.env.example) file.

The XRPL_URL will default to a public HTTPS endpoint operated by XRP Ledger Foundation.

In order to use it with the proxxy CLI client, set the variable to `http://localhost:9296/ripple/mainnet`.