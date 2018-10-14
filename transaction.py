import sys
import json
import pywaves as pw

pw.setNode(node = 'https://testnode1.wavesnodes.com',chain = 'testnet')
myAddress = pw.Address(privateKey=sys.argv[1])
otherAddress = pw.Address(sys.argv[2])

print json.dumps(myAddress.sendWaves(otherAddress, float(sys.argv[3]), attachment=sys.argv[4]));
