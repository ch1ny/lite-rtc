import { IWebRtcConstructorProps, TPreBuildRTCPeerConnection, WebRtc } from '../WebRtc';

type TMultiRtcSendOnlyConstructorProps = {
	type: 'sendonly';
	senderProps?: Omit<IWebRtcConstructorProps, 'onTrack'>;
};

type TMultiRtcReceiveOnlyConstructorProps = {
	type: 'recvonly';
};

type TMultiRtcSendReceiveConstructorProps = {
	type: 'sendrecv';
	senderProps?: Omit<IWebRtcConstructorProps, 'onTrack'>;
};

export type TMultiRtcConstructorProps =
	| TMultiRtcSendOnlyConstructorProps
	| TMultiRtcReceiveOnlyConstructorProps
	| TMultiRtcSendReceiveConstructorProps;

export class MultiRtc {
	private _sender?: WebRtc;
	private _receivers?: Map<string, WebRtc>;

	constructor(props: TMultiRtcConstructorProps) {
		const { type } = props;

		switch (type) {
			case 'sendrecv':
				this.createSender(props.senderProps);
				this._receivers = new Map<string, WebRtc>();
				break;
			case 'sendonly':
				this.createSender(props.senderProps);
				break;
			case 'recvonly':
				this._receivers = new Map<string, WebRtc>();
				break;
		}
	}

	private createSender(senderProps?: IWebRtcConstructorProps) {
		const sender = new WebRtc(senderProps);

		sender.createOffer({
			offerToReceiveAudio: false,
			offerToReceiveVideo: false,
		});

		this._sender = sender;
	}

	createReceiver(
		id: string,
		receiverProps?: IWebRtcConstructorProps,
		receiverOptions?: RTCOfferOptions,
		preConnection?: TPreBuildRTCPeerConnection
	) {
		if (!this._receivers) return null;

		// 阻止重复建立接收器
		const _receiver = this._receivers.get(id);
		if (_receiver) return _receiver;

		const receiver = new WebRtc(receiverProps);

		// 仅接收
		const { offerToReceiveAudio, offerToReceiveVideo } = receiverOptions || {};
		!!offerToReceiveAudio && receiver.rtc.addTransceiver('audio', { direction: 'recvonly' });
		!!offerToReceiveVideo && receiver.rtc.addTransceiver('video', { direction: 'recvonly' });

		receiver.createOffer(receiverOptions, preConnection);

		this._receivers.set(id, receiver);
		return receiver;
	}

	deleteReceiver(id: string) {
		const receiver = this._receivers?.get(id);
		if (!receiver) return;

		receiver.disconnect();
		this._receivers!.delete(id);
	}

	getReceiverById(id: string) {
		this._receivers?.get(id);
	}

	get sender() {
		return this._sender;
	}

	get receivers() {
		return this._receivers;
	}
}
