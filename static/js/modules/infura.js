const config = require('../../../config.json');
const IPFS = require('ipfs-api');
const ipfs = new IPFS({
  host: config.infura.ipfs.host,
  port: config.infura.ipfs.port,
  protocol: config.infura.ipfs.protocol,
});

const Infura = {
  uploadFileToIPFS: (file) => {
    return new Promise((resolve, reject) => {
      let reader = new window.FileReader();
      reader.onloadend = async () => {
        const buffer = await Buffer.from(reader.result);

        await ipfs.add(buffer, (err, ipfsHash) => {
          if (err) {
            reject(err);
          } else {
            resolve(ipfsHash[0].hash);
          }
        });
      }
      reader.readAsArrayBuffer(file);
    });
  },
};

module.exports = Infura;
