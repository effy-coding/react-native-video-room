/* eslint-disable react/react-in-jsx-scope */
import React, { Component } from 'react'

import {
  RTCPeerConnection,
  mediaDevices,
  RTCView
} from 'react-native-webrtc'

class WebRTC extends Component {
      state = {
        videoURL: null,
        isFront: true
      }

      componentDidMount () {
        const configuration = { iceServers: [{ url: 'stun:stun.l.google.com:19302' }] }
        const pc = new RTCPeerConnection(configuration)

        const { isFront } = this.state

        mediaDevices.enumerateDevices().then(sourceInfos => {
          let videoSourceId

          for (let i = 0; i < sourceInfos.length; i++) {
            const sourceInfo = sourceInfos[i]
            if (sourceInfo.kind === 'videoinput' && sourceInfo.facing === (isFront ? 'front' : 'back')) {
              videoSourceId = sourceInfo.deviceId
            }
          }
          mediaDevices.getUserMedia({
            audio: true,
            video: {
              mandatory: {
                minWidth: 500, // Provide your own width, height and frame rate here
                minHeight: 300,
                minFrameRate: 30
              },
              facingMode: (isFront ? 'user' : 'environment'),
              optional: (videoSourceId ? [{ sourceId: videoSourceId }] : [])
            }
          })
            .then(stream => {
              console.log('Got stream', stream)

              this.setState({ videoURL: stream.toURL() }, () => {
                pc.addStream(stream)
              })
            })
            .catch(error => {
              console.error(error)
            })
        })

        pc.createOffer().then(desc => {
          pc.setLocalDescription(desc).then(() => {
            console.log('onSDP', desc)
          })
        })

        pc.onicecandidate = function (event) {
          console.log('onIce', event)
        }
      }

      render () {
        return (
          <RTCView streamURL={this.state.videoURL} style={styles.container} />
        )
      }
}

export default WebRTC

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#ccc',
    borderWidth: 1,
    borderColor: '#000'
  }
}
