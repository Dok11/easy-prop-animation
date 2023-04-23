# EasyPropAnimation

`EasyPropAnimation` is a simple and powerful utility class for BabylonJS that makes animating properties more intuitive and developer-friendly. It simplifies the process of creating animations using a syntax similar to CSS transitions. With `EasyPropAnimation`, you can quickly and easily animate various properties of your 3D objects.

## Features
- Animate multiple properties at once with a single function call
- Specify easing functions and durations similar to CSS transitions
- Use simple arrays instead of Vector3 when desired
- No need to manually create keyframes or animation functions

## Installation

```bash
npm install easy-prop-animation
```

## Usage

Here's an example of how to use EasyPropAnimation:

```ts
import { EasyPropAnimation } from 'easy-prop-animation';

// Run the animation
EasyPropAnimation.run(camera, {
  position: new Vector3(0, 4, 2),
  transition: 'all 1s ease-in-out',
});
```

You can animate multiple properties at once:

```ts
EasyPropAnimation.run(camera, {
  position: new Vector3(0, 4, 2),
  target: new Vector3(1, 4, 6),
  transition: 'all 500ms linear',
});
```

And split them by transition property as in CSS:

```ts
EasyPropAnimation.run(camera, {
  position: new Vector3(0, 4, 2),
  target: new Vector3(1, 4, 6),
  transition: 'position 1s ease-in-out, target 5s ease-in',
});
```

And you don't need to use `Vector3` class, if you want to use a simple array

```ts
EasyPropAnimation.run(camera, {
  position: [-1, 4, 3],
  target: [1.2, 1.47, 5.8],
  transition: 'all 500ms linear',
});
```

And also you can the only specified property of a vector:

```ts
EasyPropAnimation.run(camera, {
  'position.y': 10,
  transition: 'all 300ms ease-in-out',
});
```

And you can use Bézier curve for easing function:

```ts
EasyPropAnimation.run(camera, {
  position: [-1, 4, 3],
  transition: 'all 1s cubic-bezier(0.42, 0, 0.58, 1)',
});
```

For manual control of created animation you can use returned `AnimationGroup`:

```ts
const animationGroup = EasyPropAnimation.run(camera, {
  'position.y': 10,
  transition: 'all 300ms ease-in-out',
});
animationGroup.onAnimationGroupEndObservable.add(() => {
  EasyPropAnimation.run(camera, {
    'position.y': 0,
    transition: 'all 300ms ease-in-out',
  });
});
```

With this library we can animate Nodes, Cameras and even Scene, here is an example:

```ts
scene.imageProcessingConfiguration.exposure = 0;

function onSceneReady() {
  EasyPropAnimation.run(this.scene, {
    'imageProcessingConfiguration.exposure': 1,
    transition: 'all 1s ease-in-out',
  });
}
```

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please follow the standard Gitflow workflow and submit a pull request.

## Relative resources

- [Babylon.js](https://www.babylonjs.com/)
- [Native animations in Babylon.js](https://doc.babylonjs.com/features/featuresDeepDive/animation/animation_design)
