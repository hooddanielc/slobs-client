import {SlobsClient} from './index';

const main = async () => {
  if (!process.env.SLOBS_TOKEN) {
    throw new Error('Please define SLOBS_TOKEN environment variable for authentication');
  }

  const client = await SlobsClient.connect('http://127.0.0.1:59650/api', process.env.SLOBS_TOKEN);

  await client.request('ScenesService', 'getScenes').then(async (scenes: any) => {
    console.log('scenes', scenes);

    await client.request('ScenesService', 'activeSceneId').then(async (id: any) => {
      console.log('id', id);
      const activeSceneModel = scenes.find((scene: any) => scene.id === id);
      let activeScene: any = null;

      scenes.forEach((scene: any) => {
        scene.isActive = scene.id === activeSceneModel.id;
        if (scene.isActive) activeScene = scene;
      });

      const audioSources = await client.request('AudioService', 'getSourcesForCurrentScene');

      for (let i = 0; i < audioSources.length; ++i) {
        // set the deflection (volume) to half
        console.log('setting deflection', audioSources[i]);
        const deflectionResult = await client.request(audioSources[i].resourceId, 'setDeflection', 1.0);
        console.log('The deflection result is ', deflectionResult);
      }

      const currentSceneItems = await client.request(activeScene.resourceId, 'getItems');
      console.log('Here are the scene items', currentSceneItems);
    });

    const sources = await client.request('SourcesService', 'getSources');
    console.log('Here are the sources', sources);

    for (let i = 0; i < sources.length; ++i) {
      const source = sources[i];
      const sourceSettings = await client.request(source.resourceId, 'getSettings');
      console.log('SOURCE SETTINGS', source.resourceId, sourceSettings);
    }

    await client.subscribe('ScenesService', 'sceneSwitched', (activeScene: any) => {
      console.log('activeScene', activeScene);
    });

    await client.subscribe('ScenesService', 'sceneAdded', (scene: any) => {
      console.log('scene', scene);
    });

    await client.subscribe('ScenesService', 'sceneRemoved', (scene: any) => {
      console.log('scene', scene);
    });

    await client.subscribe('SourcesService', 'sourceUpdated', (source: any) => {
      console.log('source', source);
    });

    await client.subscribe('ScenesService', 'itemAdded', (scenItem: any) => {
      console.log('scenItem', scenItem);
    });

    await client.subscribe('ScenesService', 'itemUpdated', (scenItem: any) => {
      console.log('scenItem', scenItem);
    });

    const sceneCollectionsSchema = await client.request('SceneCollectionsService', 'fetchSceneCollectionsSchema');
    console.log('THE SCENE COLLECTIONS SCHEMA', sceneCollectionsSchema);
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
    console.log(await client.request('SceneCollectionsService', 'fetchSceneCollectionsSchema'));
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
    console.log('again');
    console.log(await client.request('SceneCollectionsService', 'fetchSceneCollectionsSchema'));
  });

}

main().catch((err) => console.error(err));
