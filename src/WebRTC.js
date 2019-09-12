/* eslint-disable react/react-in-jsx-scope */
import React, { Component } from 'react'

import {
  RTCPeerConnection,
  mediaDevices,
  RTCView
} from 'react-native-webrtc'

const ENVIRONMENT = 'environment'

class WebRTC extends Component {
      state = {
        videoURL1: null
      }

      async componentDidMount () {
        const configuration = { iceServers: [{ url: 'stun:stun.l.google.com:19302' }] }
        const pc1 = new RTCPeerConnection(configuration)

        mediaDevices.enumerateDevices().then(sourceInfos => {
          const videoSourceId1 = sourceInfos.find(info => info.facing === ENVIRONMENT)

          mediaDevices.getUserMedia({
            audio: true,
            video: {
              facingMode: ENVIRONMENT,
              optional: (videoSourceId1 ? [{ sourceId: videoSourceId1 }] : [])
            }
          })
            .then(stream => {
              this.setState({ videoURL1: stream.toURL() }, () => {
                pc1.addStream(stream)
              })
            })
            .catch(error => {
              console.error(error)
            })
        })

        const pc1Desc = await pc1.createOffer()
        await pc1.setLocalDescription(pc1Desc)

        pc1.onicecandidate = function (event) { }
      }

      render () {
        return (
          <>
            <RTCView streamURL={this.state.videoURL1} style={styles.container} />
          </>
        )
      }
}

export default WebRTC

const styles = {
  container: {
    height: 400,
    width: 400
  }
}
