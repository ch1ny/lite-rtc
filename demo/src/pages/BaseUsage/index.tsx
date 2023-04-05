import { Button } from 'antd';
import { WebRtc, type TWebRtcStatus } from 'lite-rtc';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.module.less';

class SocketClient {
	static clients: Record<string, SocketClient> = {};

	constructor(private id: string) {
		SocketClient.clients[id] = this;
	}

	private listeners: Record<string, (...msg: any[]) => any> = {};

	call(clientId: string, msgType: string, ...msg: any[]) {
		if (clientId === this.id) return;
		const targetClient = SocketClient.clients[clientId];
		if (!targetClient) return;

		targetClient.trigger(msgType, ...msg);
	}

	trigger(msgType: string, ...msg: any[]) {
		this.listeners[msgType]?.(...msg);
	}

	listen(msgType: string, cb: (...msg: any[]) => any) {
		this.listeners[msgType] = cb;
	}
}

const RtcPeer = ({
	id,
	target,
	preConnection,
}: {
	id: string;
	target: string;
	preConnection: Parameters<WebRtc['createOffer']>[1];
}) => {
	const [status, setStatus] = useState<TWebRtcStatus>('free');
	const targetId = useMemo(() => target, []);
	const socketClient = useMemo(() => new SocketClient(id), []);
	const stream = useMemo(() => new MediaStream(), []);
	const videoRef = useRef<HTMLVideoElement>(null);
	const webRtc = useMemo(
		() =>
			new WebRtc({
				onIceCandidate(candidate) {
					socketClient.call(targetId, 'addIceCandidate', candidate.candidate, candidate.sdpMid);
				},
				onTrack(track) {
					stream.addTrack(track);
					videoRef.current!.srcObject = stream;
				},
				onConnectionStateChange: {
					onConnected() {
						setStatus('connected');
					},
				},
				onIceConnectionStateChange: {
					onDisconnected() {
						console.log('ice disconnected');
					},
				},
			}),
		[]
	);

	useEffect(() => {
		socketClient.listen('addIceCandidate', (candidate: string, sdpMid: string) => {
			const iceCandidate = new RTCIceCandidate({ candidate, sdpMid });
			webRtc.addIceCandidate(iceCandidate);
		});
		socketClient.listen('offerSdp', async (sdpOffer: string) => {
			if (webRtc.status !== 'free') return;

			setStatus('answering');
			try {
				const { sdp } = await webRtc.createAnswer(
					sdpOffer,
					{
						offerToReceiveAudio: true,
						offerToReceiveVideo: true,
					},
					preConnection
				);
				socketClient.call(targetId, 'answerSdp', sdp?.sdp || '');
			} catch (error) {
				setStatus('free');
			}
		});
		socketClient.listen('answerSdp', (sdp: string) => {
			if (webRtc.status !== 'offering') return;

			const result = webRtc.receiveAnswer(sdp);
			if (!!result) {
				setStatus('free');
				console.error(result);
			}
		});
	}, [preConnection]);

	const sendOffer = useCallback(async () => {
		setStatus('offering');
		try {
			const { sdp } = await webRtc.createOffer(
				{
					offerToReceiveAudio: true,
					offerToReceiveVideo: true,
				},
				preConnection
			);
			socketClient.call(targetId, 'offerSdp', sdp?.sdp || '');
		} catch (error) {
			setStatus('free');
		}
	}, [preConnection]);
	const disConnect = useCallback(() => {
		webRtc.disconnect();
	}, [status]);

	return (
		<div>
			<div>
				<video className={styles.video} ref={videoRef} autoPlay />
			</div>
			<div>
				<Button
					onClick={status === 'free' ? sendOffer : disConnect}
					loading={status === 'offering' || status === 'answering'}
				>
					{(() => {
						switch (status) {
							case 'free':
								return '发起连接';
							case 'offering':
								return '等待中';
							case 'answering':
								return '响应中';
							case 'connected':
								return '断开连接';
						}
					})()}
				</Button>
			</div>
		</div>
	);
};

export default function () {
	return (
		<div>
			<div className={styles.videoWrapper}>
				<RtcPeer
					id='A'
					target='B'
					preConnection={async (peer) => {
						const stream = await navigator.mediaDevices.getUserMedia({
							audio: {
								echoCancellation: true,
								noiseSuppression: true,
							},
						});
						for (const track of stream.getTracks()) {
							peer.addTrack(track);
						}
					}}
				/>
				<RtcPeer
					id='B'
					target='A'
					preConnection={async (peer) => {
						const stream = await navigator.mediaDevices.getDisplayMedia({
							video: true,
						});
						for (const track of stream.getTracks()) {
							peer.addTrack(track);
						}
					}}
				/>
			</div>
		</div>
	);
}
