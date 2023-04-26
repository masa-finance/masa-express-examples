<!-- TOC -->
  * [Setup](#setup)
    * [Configure](#configure)
    * [Start Service](#start-service)
  * [Usage with the Masa CLI](#usage-with-the-masa-cli)
    * [Set endpoint](#set-endpoint)
    * [Login](#login)
    * [Create Soulname](#create-soulname)
<!-- TOC -->

## Setup

### Configure

Copy the env file and add your keys.

```bash
cp .env.dist .env
```

### Start Service

```bash
$ source .env && yarn start

yarn run v1.22.19
$ nodemon ./src/server.ts
[nodemon] 2.0.22
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: ts,json
[nodemon] starting `ts-node ./src/server.ts`
Express app listening at 'http://localhost:4000'
```

## Usage with the Masa CLI

### Set endpoint

```shell
$ masa settings set api-url http://localhost:4000/
  __  __                            ____   _       ___
 |  \/  |   __ _   ___    __ _     / ___| | |     |_ _|
 | |\/| |  / _` | / __|  / _` |   | |     | |      | |
 | |  | | | (_| | \__ \ | (_| |   | |___  | |___   | |
 |_|  |_|  \__,_| |___/  \__,_|    \____| |_____| |___|

Key 'api-url' successfully set!
```

### Login

```bash
$ masa login
  __  __                            ____   _       ___
 |  \/  |   __ _   ___    __ _     / ___| | |     |_ _|
 | |\/| |  / _` | / __|  / _` |   | |     | |      | |
 | |  | | | (_| | \__ \ | (_| |   | |___  | |___   | |
 |_|  |_|  \__,_| |___/  \__,_|    \____| |_____| |___|

Logging in
Signing:
'Welcome to 🌽Masa Finance!

Login with your soulbound web3 identity to unleash the power of DeFi.

Your signature is valid till: Thu, 18 May 2023 10:00:11 GMT.
Challenge: uxOJz9en7y6tWoaqC9wWJpmSab6ALcxA'

Signature: '0x3ad1a93d68f3abffc841a768d0ed3df9f5335c0cab0263e7d9d944473b5c813402c75c0944534ebe3a40edd20a88c715332c4564e1ff4f65fbdb68a8641d48df1b'

Logged in as:
Address: '0x8ba2D360323e3cA85b94c6F7720B70aAc8D37a7a'
```

output on the service side:

```bash
Express app listening at 'http://localhost:4000'
has challenge undefined
Session: {
  "cookie": {
    "originalMaxAge": 2592000000,
    "expires": "2023-05-18T10:00:11.834Z",
    "secure": false,
    "httpOnly": false,
    "domain": "localhost",
    "path": "/",
    "sameSite": "lax"
  }
} has no challenge, rejected!
generated challenge! uxOJz9en7y6tWoaqC9wWJpmSab6ALcxA
has challenge uxOJz9en7y6tWoaqC9wWJpmSab6ALcxA
```

### Create Soulname

```bash
$ masa --network goerli soul-name create test 1

  __  __                            ____   _       ___
 |  \/  |   __ _   ___    __ _     / ___| | |     |_ _|
 | |\/| |  / _` | / __|  / _` |   | |     | |      | |
 | |  | | | (_| | \__ \ | (_| |   | |___  | |___   | |
 |_|  |_|  \__,_| |___/  \__,_|    \____| |_____| |___|

User ID: '3b89ad7d-9977-5a47-b101-a58fb9f712ae'
Signer Address: '0x8ba2D360323e3cA85b94c6F7720B70aAc8D37a7a'
Network: 'goerli'


Writing metadata for 'test.soul'
Soul Name Metadata URL: 'ar://32Fo69-V04rc0lQ5D5S5zYRG66MVtxh5nMYysts8ZmE'
Waiting for transaction '0xb14d252ff20b1870509486508c1218fd3b02d152f9b524884e008f234d230f91' to finalize!
SoulName with ID: '29987' created.
```