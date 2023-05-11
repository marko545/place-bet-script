const axios = require('axios');
const ethers = require('ethers');
const abi = require('./abi.json');
require('dotenv').config();


const defaultAxios = axios.create({
  timeout: 1000000, 
});

async function createAndUpdateBetSlip(index) {

  const contractAddress = process.env.CONTRACT_ADDRESS;
  const provider = new ethers.providers.WebSocketProvider(process.env.PROVIDER_URL);

  const privateKey = process.env.PRIVATE_KEY;
  const signer = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, abi, signer);
  const signature = process.env.SIGNATURE

  try {
    const tx = await contract.placeBet(index, 100, signature);
    console.log(`Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    const txHash = receipt.transactionHash;

    const loginPostData = {
      "publicAddress":process.env.PUBLIC_ADDRESS
    };

    const response = await defaultAxios.post(`${process.env.API_BASE_URL}/auth/login`, loginPostData);
    const token = response.data.auth.accessToken;
    //console.log(`Logged in with token: ${token}`);

    const postData = {
      betAmount: 0.01,
      players: [
        {
          id: 6733,
          type: 'OVER'
        }
      ]
    };

    const config = {
      headers: {
        'Authorization': 'Bearer ' + token
      },
      timeout: 60 * 60 * 1000 
    };

    const betSlipResponse = await defaultAxios.post(`${process.env.API_BASE_URL}/betslips/`, postData, config);
    const betSlipId = betSlipResponse.data.betSlipId;
    console.log(`Bet slip created with ID: ${betSlipId}`);

    const putData = {
      transactionHash: txHash
    };

    const betSlipUpdateResponse = await defaultAxios.put(`${process.env.API_BASE_URL}/betslips/${betSlipId}`, putData, config);
    console.log(`Bet slip updated with transaction hash: ${putData.transactionHash}`);
    console.log(`Updated betslip: ${betSlipId}`);
    
  } catch (error) {
    console.error(error);
  }
}

for (let i = 0; i < 5; i++) {
  setTimeout(() => {
    createAndUpdateBetSlip(i);
  }, i * 1800);
}