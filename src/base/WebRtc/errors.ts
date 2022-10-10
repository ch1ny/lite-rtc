import { TWebRtcStatus } from '../../types';

export class UnexpectedWebRtcStatusError extends Error {
	constructor(currentStatus: TWebRtcStatus, expectedStatus: TWebRtcStatus) {
		super(`The status of this WebRtc is ${currentStatus}, not ${expectedStatus}!`);
	}
}
