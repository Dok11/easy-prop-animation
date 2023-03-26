import { Animatable } from '@babylonjs/core/Animations/animatable';
import { Animation } from '@babylonjs/core/Animations/animation';
import { CircleEase, EasingFunction, IEasingFunction } from '@babylonjs/core/Animations/easing';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Node } from '@babylonjs/core/node';
import { Nullable } from '@babylonjs/core/types';


interface StyleData<T> {
  [key: string]: unknown;
  transition: string;
}

type StyleDataWithKeys<T, K extends keyof T> = {
  [P in K]?: T[P] | number | number[];
} & StyleData<T>;


interface StyleTransition {
  duration: number;
  easing: string;
}


export class EasyPropAnimation {
  /**
   * Takes a Node and a StyleData object, then applies animations
   * to the properties specified in the StyleData object.
   * The method clears any existing animations
   * on the node before applying new ones.
   *
   * @param node - The Node to apply the animations to.
   * @param style - A StyleData object containing property values and transition data.
   * @returns An array of Animatable objects, each representing an animation applied to the node.
   */
  public static run<T extends Node, K extends keyof T>(node: T, style: StyleDataWithKeys<T, K>): Animatable[] {
    const scene = node.getScene();

    const transitions = EasyPropAnimation.parseTransition(style.transition);
    const propertiesToAnimate = Object.keys(style).filter(key => key !== 'transition');

    // Clear existing animations
    for (const item of propertiesToAnimate) {
      scene.stopAnimation(node, item);
    }
    node.animations = [];

    const frameRate = node.getEngine().getFps();

    const animates: Animatable[] = [];

    for (const property of propertiesToAnimate) {
      const transition = transitions[property] || transitions['all'];
      if (!transition) {
        console.warn('No transition for property', property, 'in style', style, 'for node', node);
        continue;
      }

      const duration = transition.duration;

      const initialValue = EasyPropAnimation.getInitialValue(node, property);
      const finalValue = EasyPropAnimation.getFinalValue(initialValue, style[property]);

      const keyFrames = [{
        frame: 0,
        value: initialValue,
      }, {
        frame: Math.round((duration / 1000) * frameRate),
        value: finalValue,
      }];

      const animation = new Animation(
        `PropertyAnimTransition-${node.uniqueId}-${property}`,
        property,
        frameRate,
        EasyPropAnimation.getAnimationType(initialValue),
        Animation.ANIMATIONLOOPMODE_CONSTANT,
      );
      animation.setKeys(keyFrames);
      animation.setEasingFunction(EasyPropAnimation.getEasingFunction(transition.easing));

      node.animations.push(animation);

      animates.push(scene.beginAnimation(node, 0, keyFrames[1].frame, false, 1));
    }

    return animates;
  }


  /**
   * Parses the string with description of transition.
   * @param transitionString - string can contain some variants:
   * 1. 'all 500ms linear'
   * 2. 'all 2s linear'
   * 3. 'all 1.2s ease-out'
   * 4. 'position 1s ease-in-out, target 5s ease-in'
   */
  private static parseTransition(transitionString: string): Record<string, StyleTransition> {
    const transitions = transitionString.split(',').map((s) => s.trim());
    const parsedTransitions: Record<string, StyleTransition> = {};

    for (const t of transitions) {
      const [property, duration, transition] = t.split(/\s+/);
      const durationInMs = duration.endsWith('ms') ? parseFloat(duration) : parseFloat(duration) * 1000;

      parsedTransitions[property] = {
        duration: durationInMs,
        easing: transition,
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

    return null;
  }


  /**
   * Returns the initial value of the node[property].
   */
  private static getInitialValue(node: Node, property: string): unknown {
    const nodeProperty = (node as any)[property];

    if (typeof nodeProperty === 'number') {
      return nodeProperty;
    }

    if (typeof nodeProperty === 'object' && nodeProperty.clone) {
      return nodeProperty.clone();
    }

    const propertyPath = property.split('.');

    if (propertyPath.length > 1) {
      return (node as any)[propertyPath[0]]?.[propertyPath[1]];

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
    if (!value?.constructor) {
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
