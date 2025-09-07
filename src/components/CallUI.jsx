import React, { useState, useEffect, useRef } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

const CallUI = ({ call, user, onEndCall }) => {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(call.type === 'audio')
  const [callStatus, setCallStatus] = useState(call.is_caller ? 'calling' : 'connecting')
  const [callDuration, setCallDuration] = useState(0)
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const callStartTimeRef = useRef(null)
  const callTimerRef = useRef(null)

  // WebRTC configuration
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  useEffect(() => {
    initializeCall()
    
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (callStatus === 'connected' && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now()
      callTimerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000))
      }, 1000)
    }
  }, [callStatus])

  const initializeCall = async () => {
    try {
      // Get user media
      const constraints = {
        audio: true,
        video: call.type === 'video'
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setLocalStream(stream)
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection(rtcConfiguration)
      peerConnectionRef.current = peerConnection

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams
        setRemoteStream(remoteStream)
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
        setCallStatus('connected')
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate via Supabase Realtime
          supabase
            .channel('calls')
            .send({
              type: 'broadcast',
              event: 'ice_candidate',
              payload: {
                from_user: user.id,
                to_user: call.with_user,
                candidate: event.candidate
              }
            })
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState)
        if (peerConnection.connectionState === 'connected') {
          setCallStatus('connected')
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          handleCallEnd()
        }
      }

      if (call.is_caller) {
        // Create offer
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        
        // Send offer via Supabase Realtime
        await supabase
          .channel('calls')
          .send({
            type: 'broadcast',
            event: 'call_offer',
            payload: {
              from_user: user.id,
              to_user: call.with_user,
              call_type: call.type,
              offer: offer
            }
          })
      }

      // Subscribe to call events
      const callSubscription = supabase
        .channel('calls')
        .on('broadcast', { event: 'call_answer' }, async (payload) => {
          const { from_user, to_user, answer } = payload.payload
          if (to_user === user.id && call.is_caller) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
          }
        })
        .on('broadcast', { event: 'call_offer' }, async (payload) => {
          const { from_user, to_user, offer } = payload.payload
          if (to_user === user.id && !call.is_caller) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
            
            // Create answer
            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)
            
            // Send answer
            await supabase
              .channel('calls')
              .send({
                type: 'broadcast',
                event: 'call_answer',
                payload: {
                  from_user: user.id,
                  to_user: from_user,
                  answer: answer
                }
              })
          }
        })
        .on('broadcast', { event: 'ice_candidate' }, async (payload) => {
          const { from_user, to_user, candidate } = payload.payload
          if (to_user === user.id) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
          }
        })
        .on('broadcast', { event: 'call_end' }, () => {
          handleCallEnd()
        })
        .subscribe()

      return () => {
        callSubscription.unsubscribe()
      }

    } catch (error) {
      console.error('Error initializing call:', error)
      toast.error('Failed to initialize call')
      onEndCall()
    }
  }

  const cleanup = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }

    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
    }
  }

  const handleCallEnd = () => {
    cleanup()
    onEndCall()
  }

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCallStatusText = () => {
    switch (callStatus) {
      case 'calling':
        return 'Calling...'
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return formatCallDuration(callDuration)
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Call Header */}
      <div className="bg-sidebar-bg p-4 text-center">
        <h2 className="text-xl font-semibold text-text-primary mb-1">
          {call.type === 'video' ? 'Video Call' : 'Audio Call'}
        </h2>
        <p className="text-text-secondary">{getCallStatusText()}</p>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black">
        {call.type === 'video' ? (
          <>
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="video-remote"
            />
            
            {/* Local Video */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="video-local"
            />
            
            {/* No video placeholder */}
            {(isVideoOff || !remoteStream) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">👤</span>
                  </div>
                  <p className="text-text-primary text-xl">
                    {callStatus === 'connected' ? 'Camera is off' : 'Connecting...'}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Audio Call UI */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-40 h-40 bg-neon-green rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-6xl">🎵</span>
              </div>
              <h3 className="text-2xl font-semibold text-text-primary mb-2">
                Audio Call
              </h3>
              <p className="text-text-secondary text-lg">
                {getCallStatusText()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="call-controls">
        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`call-button ${isMuted ? 'mute' : 'unmute'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {/* Video Toggle (only for video calls) */}
        {call.type === 'video' && (
          <button
            onClick={toggleVideo}
            className={`call-button ${isVideoOff ? 'mute' : 'unmute'}`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
        )}

        {/* Speaker Button (placeholder) */}
        <button
          className="call-button unmute"
          title="Speaker"
        >
          <Volume2 size={24} />
        </button>

        {/* End Call Button */}
        <button
          onClick={handleCallEnd}
          className="call-button end"
          title="End call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  )
}

export default CallUI

