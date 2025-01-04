import { useRef, useEffect } from 'react'
import './App.css'
import io from 'socket.io-client'

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
}

function App() {
  const remoteVideoRef = useRef(null)
  const localVideoRef = useRef(null)
  const socket = io('https://video-sharing-tzao.onrender.com', {
    transports: ['websocket'],
    withCredentials: true,
    extraHeaders: {
      "my-custom-header": "abcd"
    }
  });

  socket.on('connect', () => {
    console.log('connected to server')
  });

  const constraints = {
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: true
  };

  let peerConnection;

  useEffect(() => {
    const getUserMedia = async () => {
      try {
        let localStream = await navigator.mediaDevices.getUserMedia(constraints)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }
        peerConnection = new RTCPeerConnection(configuration)
        let streamTracks = localStream.getTracks()
        streamTracks.forEach(track => {
          peerConnection.addTrack(track, localStream)
        })
        peerConnection.onicecandidate = evt => {
          socket.emit('send-candidate', evt.candidate ? evt.candidate : null)
        }
        peerConnection.ontrack = evt => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = evt.streams[0]
          }
        }
      } catch (error) {
        console.error('Error accessing media devices.', error)
      }
    }

    getUserMedia()
  }, [])

  const sendOffer = async () => {
    let offer = await peerConnection.createOffer()
    peerConnection.setLocalDescription(offer)
    socket.emit('send-offer', offer)
  }

  socket.on('recieve-offer', async (offer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    let answer = await peerConnection.createAnswer()
    peerConnection.setLocalDescription(answer)
    socket.emit('send-answer', answer)
  })

  socket.on('recieve-answer', (answer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
  })

  socket.on('recieve-candidate', (candidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
  })

  return (
    <>
      <button onClick={sendOffer}>Start</button>
      <video width={600} autoPlay muted ref={localVideoRef}></video>
      <video width={600} autoPlay ref={remoteVideoRef}></video>
    </>
  )
}

export default App
