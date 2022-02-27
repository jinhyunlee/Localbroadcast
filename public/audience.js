let inter;
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

window.onload = () => {
    const d = new Date();
    let month = months[d.getMonth()];
    let days = d.getDate();
    document.getElementById('readyToListen').style.visibility = "hidden";
    document.getElementById('title').textContent = `Seattle Hansarang Church ${month} ${days} Sermon`;
    inter = setInterval(getStatus, 1000);
}

async function init() {
    const peer = createPeer();
    peer.addTransceiver("audio", { direction: "recvonly" })
}

function createPeer() {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    peer.ontrack = handleTrackEvent;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);

    return peer;
}

async function getStatus() {
    const {data} = await axios.get('/ready');

    if (data) {
        clearInterval(inter);
        document.getElementById('readyToListen').style.visibility = "visible";
        document.getElementById('preBroadCasting').remove();
        init();
    }
}


async function handleNegotiationNeededEvent(peer) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription
    };

    const { data } = await axios.post('/consumer', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
}

function handleTrackEvent(e) {
    document.getElementById("audio").srcObject = e.streams[0];
};