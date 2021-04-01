slobs-client
============

# Installing

```
npm install --save obs-streamlabs-client
```

# Building

```
npm install
npm run build
```

# Example

Obtain an address where streamlabs is running, and a token from streamlabs remote settings.

```
import {SlobsClient} from 'slobs-client';

const main = async () => {
  // connect and authenticate
  const client = await SlobsClient.connect('http://127.0.0.1:59650/api', '********');

  // get a list of scenes
  const scenes = await client.request('ScenesService', 'getScenes');
  console.log('list of scenes', scenes);

  // set volume of all current scene audio sources
  const audioSources = await client.request('AudioService', 'getSourcesForCurrentScene');

  for (let i = 0; i < audioSources.length; ++i) {
    // set the deflection (volume) to half
    await client.request(audioSources[i].resourceId, 'setDeflection', 1.0);
  }

  // subscribe to events
  await client.subscribe('ScenesService', 'sceneSwitched', (activeScene: any) => {
    console.log('scene switch event', activeScene);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

# API Documentation

This client will work with anything defined in [streamlabs-obs-api-docs](https://github.com/stream-labs/streamlabs-obs-api-docs). Refer to those docs for more comprehensive documentation.
