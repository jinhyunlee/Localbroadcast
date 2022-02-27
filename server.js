const express = require('express');
const bodyParser = require('body-parser');
const webrtc = require("wrtc");

// Instance of express
const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

let senderStream;
let audienceCount = 0;
let isBroadCasting = false;

// Broadcaster will call this function.
app.post('/broadcast', async ({ body }, res) => {

    console.log("broadcast joined");
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
    await peer.setRemoteDescription(remoteDescription);

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

    audienceCount += 1;

    peer.onconnectionstatechange = () => {
        const connectionStatus = peer.connectionState;
        if (["disconnected", "failed", "closed"].includes(connectionStatus)) {
            console.log("disconnected");
            audienceCount -= 1;
            if (audienceCount < 0) {
                audienceCount == 0;
            }
        }
    };

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

app.get('/count', (req, res) => {
    res.status(200).send("" + audienceCount);
});

app.get('/ready', (req, res) => {
    res.status(200).send("" + isBroadCasting);
});


app.listen(4000, () => console.log('server started'));
