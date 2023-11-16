// Module imports
const express = require('express'); // Node js module.
const bodyParser = require('body-parser'); // Middleware for express - handle incoming request
const webrtc = require("wrtc");

// Instance of express
const app = express();

// Setting up node server
app.use(express.static('public')); // uses the files from public directory
app.use(bodyParser.json()); // parse as json.
app.use(bodyParser.urlencoded({extended: true})); // parse URL encoded data - for content type application/x-www-form-urlencoded

// Broadcast app
let senderStream;
let audienceCount = 0;
let isBroadCasting = false;

let audienceHeartbeats = {}; 
let currentBroadcastStatus = 200;

// Broadcaster will call this function when they join.
app.post('/broadcast', async ({ body }, res) => {

    console.log("broadcast joined");

    // Only one broadcaster
    if (isBroadCasting) {
        console.log("Already broadcasting...");
        console.log("If you need to broadcast, close the server and run again");
        return;
    }

    /* 
       New instances of RTCPeerConnection, helps connect between local (this) computer and remote peers.
       iceServers overcome the complexities of real-world networking. 

       urls: "stun:..." specifies the URL of a STUN server. It is a type of server used to get external network 
       address. Discover public IP address if they are behind a NAT
    */
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });

    // Ontrack Event that gets raised when steam of remote (broadcast) sends it.
    peer.ontrack = (e) => handleTrackEvent(e, peer);

    
    const remoteDescription = new webrtc.RTCSessionDescription(body.sdp); // Body from the broadcaster client request, with an sdp = offer
    await peer.setRemoteDescription(remoteDescription); // describes media configuration (codecs, resolutions, ...)

    const answer = await peer.createAnswer(); 
    await peer.setLocalDescription(answer);

    const payload = { // Sent answer to the broadcaster client.
        sdp: peer.localDescription
    }

    isBroadCasting = true;
    res.json(payload);
});

function handleTrackEvent(e, peer) {
    senderStream = e.streams[0];
}

// Audience will listen.
app.post('/consumer', async ({ body }, res) => {
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });

    const audienceId = body.audienceId; // Implement this function to generate a unique ID for each audience member
    audienceHeartbeats[audienceId] = Date.now(); // Initialize heartbeat time

    audienceCount += 1;

    /*peer.onconnectionstatechange = () => {
        const connectionStatus = peer.connectionState;
        if (["disconnected", "failed", "closed"].includes(connectionStatus)) {
            console.log("disconnected");
            audienceCount -= 1;
            delete audienceHeartbeats[audienceId];
            
        }
    };*/

    console.log("audience joined");
    senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));


    const remoteDescription = new webrtc.RTCSessionDescription(body.sdp); // Body from the audience client request, with an sdp = offer
    await peer.setRemoteDescription(remoteDescription);

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    const payload = { // Sent answer to the broadcaster client.
        sdp: peer.localDescription
    }

    res.json(payload);
});

// Endpoint to receive heartbeat messages
app.post('/heartbeat', (req, res) => {
    const audienceId = req.body.audienceId; // Assume that client sends its unique ID
    if (audienceHeartbeats[audienceId]) {
        audienceHeartbeats[audienceId] = Date.now(); // Update the last heartbeat time
    }
    res.sendStatus(currentBroadcastStatus);

    // Reset the status to 200
    currentBroadcastStatus = 200;
});

// Periodically check for missing heartbeats
setInterval(() => {
    const now = Date.now();
    Object.keys(audienceHeartbeats).forEach(audienceId => {
        if (now - audienceHeartbeats[audienceId] > 20000) { // 1 minute threshold
            console.log(`Audience ${audienceId} disconnected due to missing heartbeat`);
            audienceCount -= 1;
            delete audienceHeartbeats[audienceId];
            console.log("Disconnected");
            if (audienceCount <= 0) {
                audienceCount == 0;
            }
        }
    });
}, 15000); // Check every 30 seconds

app.post('/refresh', (req, res) => {
    res.sendStatus(200);
    currentBroadcastStatus = 422;
    isBroadCasting = false;
});

app.get('/count', (req, res) => {
    res.status(200).send("" + audienceCount);
});

app.get('/ready', (req, res) => {
    res.status(200).send("" + isBroadCasting);
});


app.listen(4000, () => console.log('server started'));
