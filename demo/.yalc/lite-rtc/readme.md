# Lite RTC

[![npm version](https://badgen.net/npm/v/lite-rtc)](https://www.npmjs.com/package/lite-rtc)
[![npm weekly download](https://badgen.net/npm/dw/lite-rtc)](https://www.npmjs.com/package/lite-rtc)
[![github stars](https://badgen.net/github/stars/ch1ny/lite-rtc)](https://github.com/ch1ny/lite-rtc/stargazers)


## 什么是 WebRTC

**WebRTC** 全称 **Web Real-Time-Communications**，是一种实时通信技术。它允许我们绕过中间媒介，在浏览器之间直接建立起点对点的、支持音视频流及其他任意数据的传输的通信。

## 什么是 Lite RTC
Lite RTC 是一款轻量级的 WebRTC 封装库，旨在为开发者提供更加快捷的 WebRTC 开发体验，且对支持 WebRTC 的主流浏览器做了兼容处理，使开发者可通过一套代码兼容三大主流浏览器内核。

## 如何使用

### 安装依赖

#### CDN 引入

```html
<script src="https://cdn.jsdelivr.net/npm/lite-rtc@latest/dist/index.umd.js"></script>
```

#### npm 包引入

我们更加推荐您使用 `npm` 等 Node 包管理器对依赖进行安装。

```bash
npm i --save lite-rtc
```

### WebRTC 基础

`lite-rtc` 旨在为开发者提供最基本的 API 封装使用，但我们后续也会开发一部分定制化场景下的一站式功能。但是现在我们还是先通过最基本的几个 API 来学习 `lite-rtc` 的用法吧。

首先我们来简单了解一下 WebRTC 的原生 API 如何使用，大部分 API 都可以在 `window.navigator.mediaDevices` 中获取。

#### 获取多媒体设备

首先我们可以通过 WebRTC 的几个基本 API 获取用户的音视频设备：

```js
navigator.mediaDevices.enumerateDevices().then((devices) => {
    console.log('音频输入设备:');
    console.log(devices.filter((device) => device.kind === 'audioinput'));
    console.log('视频输入设备:');
    console.log(devices.filter((device) => device.kind === 'videoinput'));
    console.log('音频输出设备:');
    console.log(devices.filter((device) => device.kind === 'audiooutput'));
});
```

通过上述 API 我们可以获得当前计算机连接的所有音视频设备的信息，其中包含了音频输入输出设备以及视频输入设备。

输入设备信息是一个 `InputDeviceInfo` 实例对象，输出设备信息是一个 `MediaDeviceInfo` 实例对象，每个对象都拥有自己的 `deviceId`，我们可以通过选定的 `deviceId` 抓取特定设备上的媒体流。

#### 获取音视频流

通过上面的 API ，我们得以获取用户计算机当前已连接的所有音视频设备的 deviceId。现在假设我们的计算机上存在一台 `deviceId` 为 `'2c6006c9d0c2c33cded89e68382dd262ca57400c58d14b3a387e576b3b1e04bf'` 的麦克风，和一台 `deviceId` 为 `'99c6820a0f709b80aec525bd7d59397ea023ec9d1ec6fc0b4b9019975f348953'` 的摄像头，下面我们通过另一个 API 来抓取这两个设备的音视频流。

```js
navigator.mediaDevices.getUserMedia({
    audio: {
        deviceId: {
            exact: '2c6006c9d0c2c33cded89e68382dd262ca57400c58d14b3a387e576b3b1e04bf',
        },
    },
    video: {
        deviceId: {
            exact: '99c6820a0f709b80aec525bd7d59397ea023ec9d1ec6fc0b4b9019975f348953',
        },
    },
}).then((stream) => {
    console.log(stream); // 获取到的多媒体流，包含了视频轨道和音频轨道
});
```

> 其他的 WebRTC 原生 API 还有很多，各位可以前往 [WebRTC Samples](https://webrtc.github.io/samples/) 学习一些简单用例，如果有意愿深入学习的，可以前往 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) 查阅相关文档。

### 使用 lite-rtc 进行点对点视频通信

在学习了上面的几个 API 后，我们就可以使用 lite-rtc 快速实现一个点对点的视频通话应用了。

[在 CodePen 上尝试](https://codepen.io/ch1ny/pen/bGMZrvd)

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lite RTC 点对点通信示例</title>
    <script src="https://cdn.jsdelivr.net/npm/lite-rtc@latest/dist/index.umd.js"></script>
</head>

<body>
    <div>
        <div>
            <video style="background: black" width="500" height="300" autoplay id="av"></video>
            <video style="background: black" width="500" height="300" autoplay id="bv"></video>
        </div>
        <button id="start">Start</button>
    </div>
    <script>
        window.onload = () => {
            const av = document.querySelector('#av');
            const bv = document.querySelector('#bv');

            const streamA = new MediaStream();
            const streamB = new MediaStream();

            const { WebRtc } = LiteRTC;

            document.querySelector('#start').addEventListener('click', async () => {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

                const preConnection = (peer) => {
                    for (const track of stream.getTracks()) {
                        peer.addTrack(track, stream);
                    }
                };

                const rtcA = new WebRtc({
                    onIceCandidate(candidate) {
                        rtcB.addIceCandidate(candidate);
                    },
                    onTrack(track) {
                        streamA.addTrack(track);
                        av.srcObject = streamA;
                    },
                });
                const rtcB = new WebRtc({
                    onIceCandidate(candidate) {
                        rtcA.addIceCandidate(candidate);
                    },
                    onTrack(track) {
                        streamB.addTrack(track);
                        bv.srcObject = streamB;
                    },
                });

                const { sdp: sdpA } = await rtcA.createOffer(
                    {
                        offerToReceiveVideo: true,
                        offerToReceiveAudio: true,
                    },
                    preConnection
                );
                const { sdp: sdpB } = await rtcB.createAnswer(
                    sdpA?.sdp || '',
                    {
                        offerToReceiveVideo: true,
                        offerToReceiveAudio: true,
                    },
                    preConnection
                );
                rtcA.receiveAnswer(sdpB?.sdp || '');
            });
        }
    </script>
</body>

</html>
```