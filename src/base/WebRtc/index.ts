import { TWebRtcStatus } from '../../types';
import { UnexpectedWebRtcStatusError } from './errors';

const RTCPeerConnection =
	window.RTCPeerConnection ||
	(<any>window).webkitRTCPeerConnection ||
	(<any>window).mozRTCPeerConnection;
const RTCSessionDescription =
	window.RTCSessionDescription || (<any>window).mozRTCSessionDescription;

type TPreBuildRTCPeerConnection = (peer: RTCPeerConnection) => void;

interface IWebRtcConstructorProps {
	rtcConfiguration?: RTCConfiguration;
	onIceCandidate?: (candidate: RTCIceCandidate) => void;
	onTrack?: (track: MediaStreamTrack) => void;
	onConnectionStateChange?: {
		onNew?: () => void;
		onFailed?: () => void;
		onConnecting?: () => void;
		onConnected?: () => void;
		onDisconnected?: () => void;
		onClosed?: () => void;
	};
	onIceConnectionStateChange?: {
		onNew?: () => void;
		onFailed?: () => void;
		onChecking?: () => void;
		onConnected?: () => void;
		onDisconnected?: () => void;
		onCompleted?: () => void;
		onClosed?: () => void;
	};
}

export class WebRtc {
	private static _noWebRtc: WebRtc;

	private _rtc!: RTCPeerConnection;
	private _status: TWebRtcStatus = 'free';
	private _candidateQueue?: Array<RTCIceCandidateInit>;

	constructor(props: IWebRtcConstructorProps) {
		if (!RTCPeerConnection) return WebRtc.noWebRtc;

		this._rtc = this.buildPeer(props);
	}

	async createOffer(options?: RTCOfferOptions, preConnection?: TPreBuildRTCPeerConnection) {
		if (this.status !== 'free') {
			const error = new UnexpectedWebRtcStatusError(this.status, 'free');
			return { success: false, sdp: undefined, error, message: error.message };
		}

		this.setStatus('offering');

		preConnection?.(this.rtc);

		const result = await this.rtc
			.createOffer(options)
			.then((sdp) => ({
				success: true,
				sdp,
			}))
			.catch((error) => ({
				success: false,
				sdp: undefined,
				error,
				message: 'Failed to create offer.',
			}));

		if (result.success) {
			const { sdp } = result;
			this.rtc.setLocalDescription(sdp);
		} else {
			this.setStatus('free');
		}

		return result;
	}

	async createAnswer(
		remoteSdp: string,
		options?: RTCAnswerOptions,
		preConnection?: TPreBuildRTCPeerConnection
	) {
		if (this.status !== 'free') {
			const error = new UnexpectedWebRtcStatusError(this.status, 'free');
			return { success: false, sdp: undefined, error, message: error.message };
		}

		this.setStatus('answering');

		this.rtc.setRemoteDescription(
			new RTCSessionDescription({
				sdp: remoteSdp,
				type: 'offer',
			})
		);

		while (Array.isArray(this._candidateQueue) && this._candidateQueue.length > 0) {
			this.rtc.addIceCandidate(this._candidateQueue.shift());
		}
		this._candidateQueue = undefined;

		preConnection?.(this.rtc);

		const result = await this.rtc
			.createAnswer(options)
			.then((sdp) => ({
				success: true,
				sdp,
			}))
			.catch((error) => ({
				success: false,
				sdp: undefined,
				error,
				message: 'Failed to create offer.',
			}));

		if (result.success) {
			const { sdp } = result;
			this.rtc.setLocalDescription(sdp);
			this.setStatus('connected');
		} else {
			this.setStatus('free');
		}

		return result;
	}

	receiveAnswer(remoteSdp: string) {
		if (this.status !== 'offering') {
			const error = new UnexpectedWebRtcStatusError(this.status, 'offering');
			return { success: false, sdp: undefined, error, message: error.message };
		}

		this.rtc.setRemoteDescription(
			new RTCSessionDescription({
				sdp: remoteSdp,
				type: 'answer',
			})
		);

		this.setStatus('free');
	}

	disconnect() {
		if (this.status !== 'connected')
			throw new UnexpectedWebRtcStatusError(this.status, 'connected');

		this.rtc.close();
		this.setStatus('free');
		this._candidateQueue = undefined;
	}

	addIceCandidate(candidate: RTCIceCandidateInit) {
		this._candidateQueue = this._candidateQueue || [];
		if (candidate.candidate) {
			if (this.rtc.signalingState === 'stable') {
				this.rtc.addIceCandidate(candidate);
			} else {
				this._candidateQueue.push(candidate);
			}
		}
	}

	private buildPeer(props: IWebRtcConstructorProps): RTCPeerConnection {
		const {
			rtcConfiguration,
			onIceCandidate,
			onTrack,
			onConnectionStateChange,
			onIceConnectionStateChange,
		} = props;

		const peer = new RTCPeerConnection(rtcConfiguration);

		if (onIceCandidate)
			peer.onicecandidate = (evt) => {
				if (evt.candidate) {
					onIceCandidate(evt.candidate);
				}
			};

		if (onTrack)
			peer.ontrack = (evt) => {
				onTrack(evt.track);
			};

		if (onConnectionStateChange) {
			const { onNew, onFailed, onConnecting, onConnected, onDisconnected, onClosed } =
				onConnectionStateChange;

			peer.onconnectionstatechange = () => {
				const { connectionState } = peer;
				switch (connectionState) {
					case 'new':
						return onNew?.();
					case 'failed':
						return onFailed?.();
					case 'connecting':
						return onConnecting?.();
					case 'connected':
						return onConnected?.();
					case 'disconnected':
						return onDisconnected?.();
					case 'closed':
						return onClosed?.();
				}
			};
		}

		if (onIceConnectionStateChange) {
			const {
				onNew,
				onFailed,
				onChecking,
				onConnected,
				onDisconnected,
				onCompleted,
				onClosed,
			} = onIceConnectionStateChange;

			peer.oniceconnectionstatechange = () => {
				const { iceConnectionState } = peer;
				switch (iceConnectionState) {
					case 'new':
						return onNew?.();
					case 'failed':
						return onFailed?.();
					case 'checking':
						return onChecking?.();
					case 'connected':
						return onConnected?.();
					case 'disconnected':
						return onDisconnected?.();
					case 'completed':
						return onCompleted?.();
					case 'closed':
						return onClosed?.();
				}
			};
		}

		return peer;
	}

	get rtc() {
		return this._rtc;
	}

	private setStatus(status: TWebRtcStatus) {
		this._status = status;
	}

	get status() {
		return this._status;
	}

	private static get noWebRtc() {
		if (this._noWebRtc) return this._noWebRtc;
		const proxy = new Proxy(
			{},
			{
				get() {
					console.warn("Your browser dosen't support WebRTC");

					return undefined;
				},
			}
		) as any;
		this._noWebRtc = proxy;
		return proxy;
	}
}
