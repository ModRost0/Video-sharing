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
  const peerConnectionRef = useRef(null)
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

  useEffect(() => {
    const getUserMedia = async () => {
      try {
        let localStream = await navigator.mediaDevices.getUserMedia(constraints)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }
        const pc = new RTCPeerConnection(configuration)
        peerConnectionRef.current = pc
        let streamTracks = localStream.getTracks()
        streamTracks.forEach(track => {
          pc.addTrack(track, localStream)
        })
        pc.onicecandidate = evt => {
          socket.emit('send-candidate', evt.candidate ? evt.candidate : null)
        }
        pc.ontrack = evt => {
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
    const peerConnection = peerConnectionRef.current
    if (peerConnection) {
      let offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      socket.emit('send-offer', offer)
    }
  }

  socket.on('recieve-offer', async (offer) => {
    const peerConnection = peerConnectionRef.current
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      let answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      socket.emit('send-answer', answer)
    }
  })

  socket.on('recieve-answer', async (answer) => {
    const peerConnection = peerConnectionRef.current
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
    }
  })

  socket.on('recieve-candidate', async (candidate) => {
    const peerConnection = peerConnectionRef.current
    if (peerConnection && candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    }
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
