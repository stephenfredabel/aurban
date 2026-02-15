import { supabase, isSupabaseConfigured } from './supabase.js';

/**
 * AurbanCall — WebRTC audio calls with Supabase Realtime Broadcast signaling
 *
 * Uses ephemeral Supabase channels (no DB writes) for SDP/ICE exchange.
 * Audio-only via getUserMedia({ audio: true, video: false }).
 *
 * Usage:
 *   const call = new AurbanCall({ conversationId, userId, onRemoteStream, onStateChange });
 *   await call.init();
 *   await call.startCall();    // caller
 *   await call.acceptPendingCall(); // callee
 *   call.endCall();
 */

const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export class AurbanCall {
  constructor({ conversationId, userId, onRemoteStream, onStateChange }) {
    this.conversationId = conversationId;
    this.userId = userId;
    this.onRemoteStream = onRemoteStream || (() => {});
    this.onStateChange = onStateChange || (() => {});

    this.pc = null;
    this.localStream = null;
    this.channel = null;
    this.state = 'idle'; // idle, connecting, ringing, active, ended
    this.pendingOffer = null;
    this.pendingCandidates = [];
  }

  _setState(s) {
    this.state = s;
    this.onStateChange(s);
  }

  /**
   * Initialize: acquire mic, create RTCPeerConnection, join signaling channel.
   */
  async init() {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured — calls unavailable');
    }

    // Acquire microphone
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    // Create peer connection
    this.pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });

    // Add local tracks
    this.localStream.getTracks().forEach(track => {
      this.pc.addTrack(track, this.localStream);
    });

    // Handle remote tracks
    this.pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.onRemoteStream(event.streams[0]);
      }
    };

    // ICE candidate handling — send via broadcast
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.channel) {
        this.channel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate, from: this.userId },
        });
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc.connectionState === 'connected') {
        this._setState('active');
      } else if (['disconnected', 'failed', 'closed'].includes(this.pc.connectionState)) {
        this._setState('ended');
      }
    };

    // Join signaling channel
    this.channel = supabase.channel(`call:${this.conversationId}`, {
      config: { broadcast: { self: false } },
    });

    this.channel
      .on('broadcast', { event: 'offer' }, ({ payload }) => {
        if (payload.from !== this.userId) {
          this.pendingOffer = payload.offer;
          this._setState('ringing');
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.from !== this.userId && this.pc.signalingState === 'have-local-offer') {
          await this.pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          // Apply any buffered ICE candidates
          for (const c of this.pendingCandidates) {
            await this.pc.addIceCandidate(new RTCIceCandidate(c));
          }
          this.pendingCandidates = [];
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.from !== this.userId) {
          if (this.pc.remoteDescription) {
            await this.pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            this.pendingCandidates.push(payload.candidate);
          }
        }
      })
      .on('broadcast', { event: 'hangup' }, ({ payload }) => {
        if (payload.from !== this.userId) {
          this.endCall();
        }
      });

    await this.channel.subscribe();
  }

  /**
   * Caller: create offer and broadcast it.
   */
  async startCall() {
    this._setState('connecting');
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    this.channel.send({
      type: 'broadcast',
      event: 'offer',
      payload: { offer, from: this.userId },
    });
    this._setState('ringing');
  }

  /**
   * Callee: accept the pending offer, create answer, broadcast it.
   */
  async acceptPendingCall() {
    if (!this.pendingOffer) throw new Error('No pending call to accept');

    this._setState('connecting');
    await this.pc.setRemoteDescription(new RTCSessionDescription(this.pendingOffer));

    // Apply any buffered ICE candidates
    for (const c of this.pendingCandidates) {
      await this.pc.addIceCandidate(new RTCIceCandidate(c));
    }
    this.pendingCandidates = [];

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    this.channel.send({
      type: 'broadcast',
      event: 'answer',
      payload: { answer, from: this.userId },
    });
  }

  /**
   * End the call: notify peer, close connection, release media.
   */
  endCall() {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'hangup',
        payload: { from: this.userId },
      });
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    this.pendingOffer = null;
    this.pendingCandidates = [];
    this._setState('ended');
  }

  /**
   * Toggle mute on the local audio track.
   */
  toggleMute() {
    if (!this.localStream) return false;
    const track = this.localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      return !track.enabled; // returns true if now muted
    }
    return false;
  }
}
