const callbacks: {
  [name: string]: ((data: any) => void)[];
} = {};

function on(topic: string, callback: (data: any) => void) {
  if (!(topic in callbacks)) {
    callbacks[topic] = [];
  }
  callbacks[topic].push(callback);
}

function off(topic: string, callback?: (data: any) => void) {
  if (topic in callbacks) {
    if (typeof callback === "function") {
      const index = callbacks[topic].indexOf(callback);
      callbacks[topic].splice(index, 1);
    }

    if (typeof callback !== "function" || callbacks[topic].length === 0) {
      delete callbacks[topic];
    }
  }
}

function broadcast(topic: string, data: any) {
  if (topic in callbacks) {
    callbacks[topic].forEach((callback: (arg0: any) => any) => callback(data));
  }
}

function broadcastChannelApiFactory() {
  /*
   *  The BroadcastChannel API allows simple communication between
   *  browsing contexts (including tabs), sort of like a PubSub that
   *  works across different tabs. This is the ideal solution for
   *  messaging between different tabs, but it is relatively new.
   *
   *  Support table for BroadcastChannel: http://caniuse.com/#feat=broadcastchannel
   */

  const channel = new BroadcastChannel("hermes");
  channel.onmessage = (e) => broadcast(e.data.topic, e.data.data);

  function send(topic: any, data: any, includeSelf = false) {
    channel.postMessage({ topic, data });
    if (includeSelf) {
      broadcast(topic, data);
    }
  }

  return { on, off, send };
}

function sharedWorkerApiFactory() {
  /*
   *  A SharedWorker is a script that is run by the browser in the
   *  background. Different browsing contexts (including tabs) from the
   *  same origin have shared accesss to the SharedWorker instance and
   *  can communicate with it. We are taking advantage of these features
   *  to use it as a messaging channel which simply forwards messages it
   *  receives to the other connected tabs.
   *
   *  Support table for SharedWorker: http://caniuse.com/#feat=sharedworkers
   */

  //@ts-ignore
  const workerPath = require("./hermes-worker");

  const worker = new SharedWorker(workerPath, "hermes");

  worker.port.start();
  worker.port.onmessage = (e) => broadcast(e.data.topic, e.data.data);

  function send(topic: string, data: any, includeSelf = false) {
    worker.port.postMessage({ topic, data });
    if (includeSelf) {
      broadcast(topic, data);
    }
  }

  return { on, off, send };
}

function localStorageApiFactory() {
  /*
   *  The localStorage is a key-value pair storage, and browser tabs from
   *  the same origin have shared access to it. Whenever something
   *  changes in the localStorage, the window object emits the `storage`
   *  event in the other tabs letting them know about the change.
   *
   *  Support table for localStorage: http://caniuse.com/#search=webstorage
   */

  const storage = window.localStorage;
  const prefix = "__hermes:";
  const queue: { [topic: string]: any[] } = {};

  function send(topic: string, data: any, includeSelf = false) {
    const key = prefix + topic;
    if (storage.getItem(key) === null) {
      storage.setItem(key, JSON.stringify(data));
      storage.removeItem(key);
      if (includeSelf) {
        broadcast(topic, data);
      }
    } else {
      /*
       * The queueing system ensures that multiple calls to the send
       * function using the same name does not override each other's
       * values and makes sure that the next value is sent only when
       * the previous one has already been deleted from the storage.
       * NOTE: This could just be trying to solve a problem that is
       * very unlikely to occur.
       */
      if (!(key in queue)) {
        queue[key] = [];
      }
      queue[key].push(data);
    }
  }

  window.addEventListener("storage", (e) => {
    if (!e.key) {
      return;
    }
    if (e.key.indexOf(prefix) === 0 && e.oldValue === null) {
      const topic = e.key.replace(prefix, "");
      const data = e.newValue && JSON.parse(e.newValue);
      broadcast(topic, data);
    }
  });

  window.addEventListener("storage", (e) => {
    if (!e.key) {
      return;
    }
    if (e.key.indexOf(prefix) === 0 && e.newValue === null) {
      const topic = e.key.replace(prefix, "");
      if (topic in queue) {
        send(topic, queue[topic].shift());
        if (queue[topic].length === 0) {
          delete queue[topic];
        }
      }
    }
  });

  return { on, off, send };
}

function emptyApiFactory() {
  console.warn("Communication between browsing contexts is not supported.");

  function send(topic: string, data: any, includeSelf = false) {
    if (includeSelf) {
      broadcast(topic, data);
    }
  }

  return { on, off, send };
}

function apiFactory() {
  if ("BroadcastChannel" in window) {
    return broadcastChannelApiFactory();
  } else if ("SharedWorker" in window) {
    return sharedWorkerApiFactory();
  } else if ("localStorage" in window) {
    return localStorageApiFactory();
  } else {
    return emptyApiFactory();
  }
}

const hermes = apiFactory();

export default hermes;
