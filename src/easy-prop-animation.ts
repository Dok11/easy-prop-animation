// For beginAnimation
import '@babylonjs/core/Animations/animatable';
import { BaseTexture } from '@babylonjs/core';
import { Animation } from '@babylonjs/core/Animations/animation';
import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { IAnimationKey } from '@babylonjs/core/Animations/animationKey';
import { BezierCurveEase, CircleEase, EasingFunction, IEasingFunction } from '@babylonjs/core/Animations/easing';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Node } from '@babylonjs/core/node';
import { Scene } from '@babylonjs/core/scene';
import { Nullable } from '@babylonjs/core/types';


interface StyleData {
  [key: string]: unknown;
  transition: string;
}

type StyleDataWithKeys<T, K extends keyof T> = {
  [P in K]?: T[P] | number | number[];
} & StyleData;


interface StyleTransition {
  duration: number;
  easing: string;
}


interface Clonable {
  clone: () => unknown;
}

function isClonable(obj: unknown): obj is Clonable {
  return typeof obj === 'object' && obj !== null && 'clone' in obj;
}


/**
 * EasyPropAnimation class provides a static method to animate properties of Babylon.js objects.
 *
 * Use the `run` method to apply animations to properties specified in a StyleData object.
 *
 * @example
 * ```typescript
 * import { EasyPropAnimation } from './path/to/easy-prop-animation';
 *
 * const target = scene.getMeshByName('myMesh');
 * const style = {
 *   position: new Vector3(1, 2, 3),
 *   transition: 'position 1s ease-in-out',
 * };
 *
 * EasyPropAnimation.run(target, style);
 * ```
 */
export class EasyPropAnimation {
  /**
   * Takes a Node and a StyleData object, then applies animations
   * to the properties specified in the StyleData object.
   * The method clears any existing animations
   * on the node before applying new ones.
   *
   * @param target - The target to apply the animations to.
   * @param style - A StyleData object containing property values and transition data.
   * @returns An array of Animatable objects, each representing an animation applied to the node.
   */
  public static run<T extends Node | Camera | Scene | BaseTexture, K extends keyof T>(target: T, style: StyleDataWithKeys<T, K>): AnimationGroup {
    const scene = EasyPropAnimation.getScene(target);
    if (!scene) {
      throw new Error('Scene not found for the target');
    }

    const transitions = EasyPropAnimation.parseTransition(style.transition);
    const propertiesToAnimate = Object.keys(style).filter((key) => key !== 'transition');

    // Clear existing animations
    for (const item of propertiesToAnimate) {
      scene.stopAnimation(target, item);
    }
    target.animations = [];

    const engine = scene.getEngine();
    const frameRate = engine.getFps();

    const uniqueIdentifier = target instanceof Scene ? 'scene' + target.getUniqueId() : target.uniqueId;
    const animationGroup = new AnimationGroup(`PropertyAnimGroup-${uniqueIdentifier}`, scene);

    for (const property of propertiesToAnimate) {
      const transition = transitions[property] || transitions['all'];
      if (!transition) {
        console.warn('No transition for property', property, 'in style', style, 'for target', target);
        continue;
      }

      const duration = transition.duration;

      const initialValue = EasyPropAnimation.getInitialValue(target, property);
      const finalValue = EasyPropAnimation.getFinalValue(initialValue, style[property]);

      const keyFrames: IAnimationKey[] = [
        {
          frame: 0,
          value: initialValue,
        },
        {
          frame: Math.round(duration / 1000 * frameRate),
          value: finalValue,
        },
      ];

      const uniqueIdentifier = target instanceof Scene ? 'scene' + target.getUniqueId() : target.uniqueId;

      const animation = new Animation(
        `PropertyAnimTransition-${uniqueIdentifier}-${property}`,
        property,
        frameRate,
        EasyPropAnimation.getAnimationType(initialValue),
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      animation.setKeys(keyFrames);
      animation.setEasingFunction(EasyPropAnimation.getEasingFunction(transition.easing));

      animationGroup.addTargetedAnimation(animation, target);

      target.animations.push(animation);
    }

    animationGroup.play();

    return animationGroup;
  }


  /**
   * Returns the scene based on the target type.
   */
  private static getScene<T extends Node | Camera | Scene | BaseTexture>(target: T): Nullable<Scene> {
    if (target instanceof Node || target instanceof Camera || target instanceof BaseTexture) {
      return target.getScene();
    } else if (target instanceof Scene) {
      return target;
    }

    throw new Error('Unsupported target type');
  }


  /**
   * Parses the string with description of transition.
   * @param transitionString - string can contain some variants:
   * 1. 'all 500ms linear'
   * 2. 'all 2s linear'
   * 3. 'all 1.2s ease-out'
   * 4. 'position 1s ease-in-out, target 5s ease-in'
   * 5. 'all 1s cubic-bezier(0.42, 0, 0.58, 1)'
   */
  private static parseTransition(transitionString: string): Record<string, StyleTransition> {
    const regex = /(\w+)\s(\d+(?:\.\d+)?[ms]+)\s([\w-]+(?:\([^)]+\))?)/g;
    const parsedTransitions: Record<string, StyleTransition> = {};

    let match;
    while ((match = regex.exec(transitionString)) !== null) {
      const property = match[1];
      const duration = match[2];
      const easing = match[3];

      const durationInMs = duration.endsWith('ms') ? parseFloat(duration) : parseFloat(duration) * 1000;

      parsedTransitions[property] = {
        duration: durationInMs,
        easing: easing,
      };
    }

    return parsedTransitions;
  }


  /**
   * Parses the string with description of easing function in css-like format
   * and converts it to BabylonJS easing function.
   */
  private static getEasingFunction(easing: string): Nullable<IEasingFunction> {
    const easingFunctions: Record<string, null | number> = {
      linear: null,
      'ease-in': EasingFunction.EASINGMODE_EASEIN,
      'ease-out': EasingFunction.EASINGMODE_EASEOUT,
      'ease-in-out': EasingFunction.EASINGMODE_EASEINOUT,
    };

    const mode = easingFunctions[easing];

    if (mode) {
      const easingFunction = new CircleEase();
      easingFunction.setEasingMode(mode);

      return easingFunction;
    }

    // Check for Bézier curve syntax
    const bezierRegex = /cubic-bezier\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/;
    const match = easing.match(bezierRegex);

    if (match) {
      const p0 = parseFloat(match[1]);
      const p1 = parseFloat(match[2]);
      const p2 = parseFloat(match[3]);
      const p3 = parseFloat(match[4]);

      return new BezierCurveEase(p0, p1, p2, p3);
    }

    return null;
  }


  /**
   * Returns the initial value of the node[property].
   */
  private static getInitialValue<Target = Node>(node: Target, property: keyof Target | string): unknown {
    const nodeProperty = node[property as keyof Target];

    if (typeof nodeProperty === 'number') {
      return nodeProperty;
    }

    if (isClonable(nodeProperty)) {
      return nodeProperty.clone();
    }

    const propertyPath = property.toString().split('.');

    if (propertyPath.length > 1) {
      // return (node as any)[propertyPath[0]]?.[propertyPath[1]];
      // fix `ESLint: Unexpected any. Specify a different type.(@typescript-eslint/no-explicit-any)`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (node as any)[propertyPath[0]][propertyPath[1]];

    } else {
      return nodeProperty;
    }
  }


  /**
   * Returns the final value in the correct type.
   * If the initial value is a number, then the final value will be a number.
   * If the initial value is a Vector3, then the final value will be a Vector3.
   * If the initial value is a Color3, then the final value will be a Color3.
   * etc.
   */
  private static getFinalValue(initialValue: unknown, value: unknown): unknown {
    if (typeof initialValue === 'number') {
      if (typeof value === 'number') {
        return value;
      }

      if (typeof value === 'string') {
        return parseFloat(value);
      }
    }

    if (initialValue instanceof Vector3 && Array.isArray(value)) {
      return Vector3.FromArray(value);
    }

    // Handle the Color3 case
    if (initialValue instanceof Color3 && Array.isArray(value)) {
      return Color3.FromArray(value);
    }

    return value;
  }


  private static getAnimationType(value: unknown): number {
    const valueHasConstructor = value && typeof value === 'object' && value.constructor;

    if (!valueHasConstructor) {
      return Animation.ANIMATIONTYPE_FLOAT;
    }

    const instanceToType: Record<string, number> = {
      [Vector3.name]: Animation.ANIMATIONTYPE_VECTOR3,
      [Quaternion.name]: Animation.ANIMATIONTYPE_QUATERNION,
      [Matrix.name]: Animation.ANIMATIONTYPE_MATRIX,
      [Color3.name]: Animation.ANIMATIONTYPE_COLOR3,
      [Color4.name]: Animation.ANIMATIONTYPE_COLOR4,
    };

    return instanceToType[value.constructor.name] || Animation.ANIMATIONTYPE_FLOAT;
  }
}
