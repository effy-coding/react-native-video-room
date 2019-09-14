/* eslint-disable react/react-in-jsx-scope */
import _ from 'lodash'
import io from 'socket.io-client'

import React, { Component } from 'react'
import { Button, Text } from 'react-native'
import {
  RTCPeerConnection,
  mediaDevices,
  RTCView,
  RTCIceCandidate
} from 'react-native-webrtc'

const ENVIRONMENT = 'user'
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

class WebRTC extends Component {
      state = {
        peers: {},
        streamURLs: [],
        iceConnectionState: ''
      }

      async startCall () {
        const socket = io('http://172.30.1.48:5000')

        socket.emit('join', 'meet')

        socket.emit('ready')

        socket.on('ready', (id) => {
          const { peers, streamURLs } = this.state
          const peer = new RTCPeerConnection(configuration)

          peer.onicecandidate = (event) => {
            event.candidate && socket.emit('candidate', id, event.candidate)
          }

          peer.oniceconnectionstatechange = (event) => {
            console.log('oniceconnectionstatechange', event)
            this.setState({ iceConnectionState: event.target.iceConnectionState })
          }

          peers[id] = peer

          mediaDevices.enumerateDevices().then(sourceInfos => {
            const videoSourceId = sourceInfos.find(info => info.facing === ENVIRONMENT)

            mediaDevices.getUserMedia({
              audio: true,
              video: {
                mandatory: {
                  minFrameRate: 30,
                  minHeight: 100,
                  minWidth: 100
                },
                facingMode: ENVIRONMENT,
                optional: (videoSourceId ? [{ sourceId: videoSourceId }] : [])
              }
            })
              .then(async stream => {
                peer.addStream(stream)

                const streamURL = stream.toURL()
                streamURLs.push(streamURL)

                const desc = await peer.createOffer()
                await peer.setLocalDescription(desc)

                socket.emit('offer', id, peer.localDescription, streamURL)

                this.setState({ peers, streamURLs })
              })
              .catch(error => {
                console.error('error on peer: ', peer.uuid, error)
              })
          })
        })

        socket.on('offer', async (id, desc, streamURL) => {
          const { peers, streamURLs } = this.state
          const peer = new RTCPeerConnection(configuration)

          peer.onicecandidate = (event) => {
            event.candidate && socket.emit('candidate', id, event.candidate)
          }

          peer.oniceconnectionstatechange = (event) => {
            console.log('oniceconnectionstatechange', event)
            this.setState({ iceConnectionState: event.target.iceConnectionState })
          }

          peers[id] = peer
          streamURLs.push(streamURL)

          mediaDevices.enumerateDevices().then(sourceInfos => {
            const videoSourceId = sourceInfos.find(info => info.facing === ENVIRONMENT)

            mediaDevices.getUserMedia({
              audio: true,
              video: {
                mandatory: {
                  minFrameRate: 30,
                  minHeight: 100,
                  minWidth: 100
                },
                facingMode: ENVIRONMENT,
                optional: (videoSourceId ? [{ sourceId: videoSourceId }] : [])
              }
            })
              .then(async stream => {
                peer.addStream(stream)

                const streamURL = stream.toURL()
                streamURLs.push(streamURL)

                await peer.setRemoteDescription(desc)

                const answer = await peer.createAnswer()
                await peer.setLocalDescription(answer)

                this.setState({ peers, streamURLs })

                socket.emit('answer', id, peer.localDescription, streamURL)

                console.log(peer.getLocalStreams())
                console.log(peer.getRemoteStreams())
              })
              .catch(error => {
                console.error('error on peer: ', peer.uuid, error)
              })
          })
        })

        socket.on('candidate', async (id, candidate) => {
          const { peers } = this.state

          await peers[id].addIceCandidate(new RTCIceCandidate(candidate))
        })

        socket.on('answer', async (id, description, streamURL) => {
          const { peers, streamURLs } = this.state

          streamURLs.push(streamURL)

          this.setState({ peers, streamURLs })

          await peers[id].setRemoteDescription(description)
        })
      }

      componentDidMount () {

      }

      render () {
        const { streamURLs, iceConnectionState } = this.state

        console.log(streamURLs)
        return (
          <>
            <Button title='Start Call' onPress={() => { this.startCall() }}>Start Call</Button>
            <Text>haha</Text>

            {_.map(streamURLs, (streamURL, key) => {
              return <RTCView key={key} streamURL={streamURL} style={styles.container} />
            })}

            <Text>{iceConnectionState}</Text>

          </>
        )
      }
}

export default WebRTC

const styles = {
  container: {
    height: 200,
    width: 200,
    padding: 10
  }
}
