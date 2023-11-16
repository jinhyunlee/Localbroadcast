#!/usr/bin/env bash

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# Get IP Address
ip_address=$(ifconfig | grep "inet " | grep -Fv 127.0.0.1 | awk '{print $2}')


# Define your expected IP address
expected_ip="10.0.0.222"

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color



echo "going to folder: ${DIR}"
echo ""
cd "${DIR}" 




echo "=================================================="
echo "your expected ip address is $expected_ip"
echo "If you need to print QR code: $expected_ip:4000/audience.html"

# Check if the IP address matches the expected IP
if [ "$ip_address" = "$expected_ip" ]; then
    echo -e "${GREEN}The IP Address is as expected: $ip_address${NC}"
else
    echo -e "${RED}The IP Address is not as expected: $ip_address${NC}."
    echo -e "${RED}Make sure you update the QR Code. ${NC}."
fi

echo "=================================================="
echo ""
echo ""




pkill node
echo "=================================================="
echo "please close this window when done with broadcast"
echo "=================================================="
echo ""
node server.js 
#sleep 2
#open -a Safari http://localhost:4000 &
# open -a Safari http://localhost:4000/audience.html
