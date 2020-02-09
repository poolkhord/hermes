[![NPM](https://nodei.co/npm/hermes-channel.png)](https://nodei.co/npm/hermes-channel/)

[![install size](https://packagephobia.now.sh/badge?p=hermes-channel)](https://packagephobia.now.sh/result?p=hermes-channel) [![dependencies](https://david-dm.org/hosseinmd/hermes-channel.svg)](https://david-dm.org/hosseinmd/hermes-channel.svg)

# hermes-channel

Client-side messaging channel for sending data from one browser tab to another with the same origin. Think of it as a PubSub module that can send messages across multiple browser tabs.


## TOC

- [Install](#Install)
- [Import](#Import)
- [APIs](#API)

## Install

```npm
npm i hermes --save
```

```npm
yarn add hermes
```

## Import

```javascript
import hermes from "hermes-channel";
```

## API

- **`send(topic, data, [includeSelf=false])`**: Send data to other browser tabs subscribed to a specified topic.

  - `topic`: The name of the topic in which the data will be sent to.
  - `data`: The data to be sent. This needs to be a JSON-serializable object.
  - `includeSelf` (optional, default=false): A boolean indicating whether the data should also be sent to the current tab.

  ```js
  hermes.send('some-topic', 'hello world');
  hermes.send('some-topic', {title: 'awesome'});
  hermes.send('some-topic', {title: 'awesome'}, true);
  ```

- **`on(topic, callback)`**: Add a callback function for a specified topic.

  - `topic`: The name of the topic to subscribe to.
  - `callback`: The callback function, which accepts a single argument representing the data that was sent originally.

  ```js
  hermes.on('some-topic', function(data) {});
  ```

- **`off(topic, [callback])`**: Remove a callback function for a specified topic.

  - `topic`: The name of the topic to unsubscribe from.
  - `callback` (optional): The callback function to remove, or don't provide in order to remove all callback functions for the `topic` topic.

  ```js
  hermes.off('some-topic', callbackFunction);
  hermes.off('some-topic');
  ```
