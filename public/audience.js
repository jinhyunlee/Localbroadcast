
let inter;
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
let heartbeatInterval = 7000; // 10 seconds
let audienceId = new Date().getTime();

window.onload = () => {
    const d = new Date();
    let month = months[d.getMonth()];
    let days = d.getDate();
    document.getElementById('readyToListen').style.visibility = "hidden";
    document.getElementById('title').textContent = `Seattle Hansarang Church ${month} ${days} Sermon`;
    inter = setInterval(getStatus, 1000);
}


function sendHeartbeat() {
    axios.post('/heartbeat', { audienceId: audienceId })
        .catch(e => {
            console.log("Error sending heartbeat: ", e);
            location.reload(true);
        });
}

async function init() {
    const peer = createPeer();
    peer.addTransceiver("audio", { direction: "recvonly" });
    setInterval(sendHeartbeat, heartbeatInterval);
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
        sdp: peer.localDescription,
        audienceId: audienceId
    };

    const { data } = await axios.post('/consumer', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
}

function handleTrackEvent(e) {
    document.getElementById("audio").srcObject = e.streams[0];
};