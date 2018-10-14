/**
 * Created by shade on 10/10/18.
 */
const password = 'over4^Built^';
const slotsWallet = '3MzEwkDtwrdgyh3zBiBwnk98kaeqaF7uCGP';
const PORT = 3018;

const Koa = require('koa');
const Router = require('koa-router');
const app = new Koa();
const path = require('path');

const bs58 = require('bs58');
const sha256 = require('js-sha256');

const WavesAPI = require('@waves/waves-api');
const Waves = WavesAPI.create(WavesAPI.TESTNET_CONFIG);

const router = new Router();

let runPy = (wavesParams = []) => {
    return new Promise(function (success, nosuccess) {
        const {spawn} = require('child_process');
        const params = [path.resolve() + "/transaction.py"].concat(wavesParams);
        const pyProg = spawn('python', params);

        pyProg.stdout.on('data', function (data) {
            success(data);
        });

        pyProg.stderr.on('data', (data) => {
            console.log(`data`, data.toString());
            nosuccess(
                JSON.stringify({error: true})
            );
        });
    }).catch(e => {
        console.log(`e`, e.toString());
        return JSON.stringify({error: true});
    })
};

router.get('/wallet', async (ctx, next) => {
    try {
        const seed = Waves.Seed.create();
        const encrypted = seed.encrypt(password);

        console.log(`wallet`, encrypted);
        ctx.body = JSON.stringify({encrypted: encrypted, phrase: seed.phrase});
    } catch (e) {
        console.error(`wallet`, e);
        ctx.body = JSON.stringify({error: true});
    }

    return next();
});

router.get('/encrypt', async (ctx, next) => {
    try {
        const seed = Waves.Seed.fromExistingPhrase(ctx.request.query.seed);
        const encrypted = seed.encrypt(password);

        console.log(`encrypt`, encrypted);
        ctx.body = encrypted;
    } catch (e) {
        console.error(`encrypt`, e);
        ctx.body = JSON.stringify({error: true});
    }

    return next();
});

router.get('/balance', async (ctx, next) => {
    try {
        const restoredPhrase = Waves.Seed.decryptSeedPhrase(ctx.request.query.encrypted, password);
        const seed = Waves.Seed.fromExistingPhrase(restoredPhrase);
        let balance = await Waves.API.Node.addresses.balanceDetails(seed.address);

        console.log(`balance`, balance);
        ctx.body = JSON.stringify({balance: balance.available / Math.pow(10, 8)});
    } catch (e) {
        console.error(`balance`, e);
        ctx.body = JSON.stringify({error: true});
    }

    return next();
});

router.get('/bet', async (ctx, next) => {
    try {
        const restoredPhrase = Waves.Seed.decryptSeedPhrase(ctx.request.query.encrypted, password);
        const seed = Waves.Seed.fromExistingPhrase(restoredPhrase);

        // NodeJS Rest API unusable at this moment
        /*
        const transferData = {
            recipient: slotsWallet,
            amount: ctx.request.query.amount,
            assetId: 'WAVES',
            attachment: ctx.request.query.attachment,
        };

        responseData = await Waves.API.Node.transactions.broadcast('transfer', transferData, seed.keyPair);
        */

        // Use Python for communicate with Waves Rest API
        let responseData = await runPy([
            seed.keyPair.privateKey,
            slotsWallet,
            ctx.request.query.amount,
            ctx.request.query.attachment,
        ]);

        let bet = responseData.toString();
        console.log(`bet`, bet);
        ctx.body = bet;
    } catch (e) {
        console.error(`bet`, e);
        ctx.body = JSON.stringify({error: true});
    }
    return next();
});

app.use(router.routes());
app.listen(PORT);

console.log(`http://localhost:3018`);
/*

const spinResult = {
    posInSequence: [39, 6, 26, 61, 58],
    value:
        [
            [8, 11, 1],
            [12, 1, 9],
            [6, 9, 3],
            [4, 10, 6],
            [12, 1, 8]
        ]
};

console.log(JSON.stringify(spinResult));
console.log(sha256(JSON.stringify(spinResult)) + '/' + '11567390b7a7d88aad8df3fb1b6c04634c2a0dc6b6b680ab19c842ada7b9fccd');

const tx_descr = bs58.decode('oFDtB7jNGuiUYzMXiZqd5Hzx8gvY5ULqqE8kj7iGiX8Ap2F1EmMA3AXB4RyBLcsenm9Mi13uwQRvBSfVsaee27WjPFPCEh8kYtYdDPEdg5p8CtHiRorYr6A9EAPNYvpPFkmr8X1DrdCtPYus7qFUYwqvBm7R7dvdrKa8nXRtf4A2pSh9');
console.log(tx_descr.toString());*/
