// Once laoded, you can set functions for the buttons. 
window.onload = () => {

    // Upon on button click.
    document.getElementById('my-button').onclick = () => {
        // Initialize and remove the button.
        init();
        document.getElementById('preBroadCasting').remove();
        document.getElementById('broadCasting').style.visibility = "visible";
    }
}

async function init() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const peer = createPeer();
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    setInterval(getCount, 4000);
}


function createPeer() {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);

    return peer;
}

async function getCount() {
    const {data} = await axios.get('/count');
    
    document.getElementById('countLabel').textContent = `Current listener: ${data}`;
    console.log("Audiences: " + data);
}

async function handleNegotiationNeededEvent(peer) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription
    };

    const { data } = await axios.post('/broadcast', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
}