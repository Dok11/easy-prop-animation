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

And also you can the obly specified property of a vector:

```ts
EasyPropAnimation.run(camera, {
  'position.y': 10,
  transition: 'all 300ms ease-in-out',
});
```

For manual control of created animation you can use returned `Animatable[]` array:

```ts
const animations = EasyPropAnimation.run(camera, {
  'position.y': 10,
  transition: 'all 300ms ease-in-out',
});
animations.forEach((anim) => {
  // For example you can use events of Animatable object
  anim.onAnimationEnd = () => {
    // To make any that you want, event for call another animation
    EasyPropAnimation.run(camera, {
      'position.y': 0,
      transition: 'all 300ms ease-in-out',
    });
  };
});
```

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please follow the standard Gitflow workflow and submit a pull request.

## Relative resources

- [Babylon.js](https://www.babylonjs.com/)
- [Native animations in Babylon.js](https://doc.babylonjs.com/features/featuresDeepDive/animation/animation_design)
