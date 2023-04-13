# smoothScrollTo() Function Concept

## Contents
* [Main idea](#main-idea-table-of-contents)
* [Demo](#demo-table-of-contents) 
* [Prerequisites](#prerequisites-table-of-contents)
* [Basic layout](#basic-layout-table-of-contents)
* [Adding event listener to the navigation](#adding-event-listener-to-the-navigation-table-of-contents)
* [Function `getScrollTargetElem()` get target to which it needs to scroll](#function-getscrolltargetelem-get-target-to-which-it-needs-to-scroll-table-of-contents)
  * [Obtain and validate link `href` value](#obtain-and-validate-link-href-value)
* [Function `smoothScrollTo()` and it's basic variables](#function-smoothscrollto-and-its-basic-variables-table-of-contents)
  * [Get the scroll start position](#get-the-scroll-start-position)
  * [Get the scroll end position](#get-the-scroll-end-position)
  * [Get the scroll start timestamp](#get-the-scroll-start-timestamp)
* [Function `animateSingleScrollFrame()` gives the progress of the animation](#function-animatesinglescrollframe-gives-the-progress-of-the-animation-table-of-contents)
  * [Set the current time mock](#set-the-current-time-mock)
  * [Calculate the elapsed time](#calculate-the-elapsed-time)
  * [Get the absolute animation progress](#get-the-absolute-animation-progress)
  * [Get the animation progress normalization by Bezier Curve](#get-the-animation-progress-normalization-by-bezier-curve)
  * [Calculate scroll length per frame](#calculate-scroll-length-per-frame)
  * [Calculate new position Y-coordinate](#calculate-new-position-y-coordinate)
* [Separate Frames -> Animation](#separate-frames---animation-table-of-contents)
  * [Use `requestAnimationFrame()` to start the browser animation](#use-requestanimationframe-to-start-the-browser-animation)
  * [️⚠️ A Pitfall with `requestAnimationFrame()` and recursion](#a-pitfall-with-requestanimationframe-and-recursion)
  * [Finish creating animation with recursive `requestAnimationFrame()`](#finish-creating-animation-with-recursive-requestanimationframe)
* [The last thing: a callback on an animation end](#the-last-thing-a-callback-on-an-animation-end-table-of-contents)   
* [A final word](#a-final-word-table-of-contents)

## Main idea ([Table of Contents](#contents))

I'm implementing my own vanilla JS alternative to the browser's `scroll-behavior: smooth` feature here. It's useful for cases when you need to combine this functionality with complex scroll JS behavior.

## Demo ([Table of Contents](#contents))

You could check a [Full Demo on Codepen](https://codepen.io/nat-davydova/full/QWZwOdb/5db409195086b5b1631055fbcb6c94e5)

## Prerequisites ([Table of Contents](#contents))

For a good understanding of the article, the following are necessary:
* basic layout knowledge: lists, positioning, basics of the Flex model;
* basic JavaScript knowledge: searching DOM elements, events basics, function declarations, arrow functions, callbacks;
* your good mood 😊

## Basic layout ([Table of Contents](#contents))

### HTML

The HTML structure here is simple: just a navigation with 3 links and 3 sections corresponding to them.

Yes, the navigation already works through the combination of `href` and `id` attributes. However, the transition is immediate. Our task is to make it smooth

```html
<body>
  <nav class="navigation">
    <a class="navigation__link" href="#section1">Section 1</a>
    <a class="navigation__link" href="#section2">Section 2</a>
    <a class="navigation__link" href="#section3">Section 3</a>
  </nav>
  <section id="section1">Section 1</section>
  <section id="section2">Section 2</section>
  <section id="section3">Section 3</section>
</body>
```

### CSS

The styles are simple as well. I've made the navigation fixed and added some decorative section styles to visually separate them by using alternating background colors
<details>
<summary>CSS code</summary>

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Arial';
}

nav {
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    gap: 30px;
    width: 100%;
    padding: 20px 0;
    background-color: #fff;
}

nav a {
    color: black;
    text-decoration: none;
    transition: color .2s linear 0s;
}

nav a:hover {
    color: green;
}

section {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100vh;
    font-size: 40px;
    color: #fff;
    background-color: black;
}

section:nth-of-type(2n) {
    background-color: gray;
}
```
</details>

## Adding event listener to the navigation ([Table of Contents](#contents))

First, we need to grab the navigation element to add an event listener to it. We should not apply listeners directly to links in the navigation, as it's a bad practice (refer to the event delegation JS pattern).

Next, we should add an event listener to the navigation and prevent the default behavior of clicked link targets within it.

```js
// I prefer to store all the DOM selector strings into a single object
const DOM = {
  nav: "navigation",
  navLink: "navigation__link",
};

const navigation = document.querySelector(`.${DOM.nav}`);

// we can't be sure that navigation element exists, so we need optional chaining
navigation?.addEventListener("click", (e) => {
  e.preventDefault();

  const currentTarget = e.target;

  // Here, we implement the event delegation pattern: we check if the element is a navigation link or if it is a descendant of one
  // If it is a navigation link or a descendant of one, the navigation link element will be stored in currentLink
  // If not, null will be stored in the currentLink
  const currentLink = currentTarget.closest(`.${DOM.navLink}`);

  // ... more stuff will be there later
});
```

## Function `getScrollTargetElem()` get target to which it needs to scroll ([Table of Contents](#contents))

The purpose of the [`smoothScrollTo()`](#function-smoothscrollto-and-its-basic-variables-table-of-contents) function is to scroll to a specific element on the page. Therefore, we need to determine the target of our scroll somehow. Let's create a function `getScrollTargetElem()` that will do this.

What should the `getScrollTargetElem()` function do:

* get the link we've clicked;
* obtain the value of the href attribute, which can be the actual ID of the element we want to scroll to or can be an external link or simply a plain text;
* verify if it's a valid value to grab the element by:
  * if not, return null (clearly, we have no element);
  * if yes, grab the target element and return it;

We call it into the event listener and pass the stored link element (or null) into it:

```js
navigation?.addEventListener("click", (e) => {
  e.preventDefault();

  const currentTarget = e.target;

  // We can't truly guarantee that JavaScript will 100% find this element in the DOM. 
  // That's why currentLink can be either Element or null.
  const currentLink = currentTarget.closest(`.${DOM.navLink}`);

  const scrollTargetElem = getScrollTargetElem(currentLink);
});

function getScrollTargetElem(clickedLinkElem) {
   // Notice that after the following unsuccessful checks, we will return null as a signal that 
   // the getScrollTargetElem() function has failed to find the target to which the scroll should be performed
   if (!clickedLinkElem) {
      return null;
    }
}
```

### Obtain and validate link `href` value

The simplest part is grabbing the link's `href` value (and if there isn't any, we can't proceed further):

```js
function getScrollTargetElem(clickedLinkElem) {
  if (!clickedLinkElem) {
    return null;
  }

  const clickedLinkElemHref = clickedLinkElem.getAttribute("href");

  // The href attribute may be left undefined or empty by the user
  if (!clickedLinkElemHref) {
    return null;
  }
  
  const scrollTarget = document.querySelector(clickedLinkElemHref);
}
```
The desired result is a scroll target element ID, like `#section1`. We should use it to find the target element itself. But what if the `href` contains a link to an external resource or some other invalid value? Let's check what happens if we pass not an element ID, but an external resource link:

```html
 <nav class="navigation">
   ...
   <a class="navigation__link" href="https://www.youtube.com/" target="_blank">Section 3</a>
</nav>
```

... an Error is thrown at us:

<img width="459" alt="Снимок экрана 2023-04-04 224856" src="https://user-images.githubusercontent.com/52240221/229903871-64d07466-1530-47d3-a439-fadc2c5086cf.png">

So, we need to validate the `clickedLinkElemHref` value somehow before passing it to `querySelector()`.

There are 2 ways:

* implement some kind of RegEx to check if the value is valid;
* we can use a `try/catch`-block to handle the thrown `Error` case if the value is invalid;

I've preferred the 2nd way, it's simplier than any RegEx solution:

```js
function getScrollTargetElem(clickedLinkElem) {
  if (!clickedLinkElem) {
    return null;
  }

  const clickedLinkElemHref = clickedLinkElem.getAttribute("href");

  if (!clickedLinkElemHref) {
    return null;
  }
  
  let scrollTarget;
  
  // here we check if there is any Error thrown
  try {
    scrollTarget = document.querySelector(clickedLinkElemHref);
  } catch (e) {
    console.log(e);
    // if there is an error we can't perform scroll therefore return null
    return null;
  }

  return scrollTarget;
}
```

## Function `smoothScrollTo()` and it's basic variables ([Table of Contents](#contents))

The actual function that performs all the magic is a function that smoothly scrolls to the target. We call it in the event handler after target definition, as it should know the point to which it should actually scroll.

The crucial thing we need to know is how long our animation should last. In our case, the user should be able to set it directly as a ` smoothScrollTo` parameter. Additionally, we will define a default value in case the user doesn't want to set any.

```js
// ... get navigation ...

const DEFAULT_SCROLL_ANIMATION_TIME = 500;

navigation?.addEventListener("click", (e) => {
  e.preventDefault();

  const currentTarget = e.target;
  
  const currentLink = currentTarget.closest(`.${DOM.navLink}`);

  // getScrollTargetElem() returns either an Element or null, 
  // and we handle what to do in both cases within the smoothScrollTo() function
  const scrollTargetElem = getScrollTargetElem(currentLink);

  // the user can set any time in milliseconds here
  // I've also packed the arguments into objects for more convenient handling
  smoothScrollTo({
   scrollTargetElem, 
   scrollDuration: some_time_in_ms || default value
  });
});

function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME
}) {
  // if there is no scroll target we can't perform any scroll and just return here
  if (!scrollTarget) {
    return;
  }
}
```

### Get the scroll start position

A crucial part of each custom scrolling is detecting the starting point. We can perform further calculations based on the coordinates of our current position on the page. In our case (vertical scrolling), we're interested in Y-coordinates only. 

The starting point is easy to obtain with `window.scrollY`. Its returned value is a double-precision floating-point value. In our example, such high precision for pixels is not needed. Therefore, to simplify the final value, we will round it using the `Math.round()` function.

```js
function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME
}) {
  if (!scrollTargetElem) {
    return;
  }

  const scrollStartPositionY = Math.round(window.scrollY);
}
```
[Untitled_ Apr 13, 2023 2_27 PM.webm](https://user-images.githubusercontent.com/52240221/231745174-a0ac1350-356c-4d52-aa19-6b69faee527a.webm)

### Get the scroll end position

We know the starting point of scrolling, and we need one more point - the Y-coordinate of where to scroll. It's a bit more tricky: we have no methods to directly grab the absolute document coordinate of the top-left corner of the target element. However, it's still possible, but we need two steps to obtain it:

* get the target element Y-coordinate relative to viewport
* calculate document absolute Y-coordinate for the target element

#### Get the target element Y-coordinate relative to viewport

We need to grab the target element's Y-coordinate relative to the user's viewport. Our helper for this task is the `getBoundingClientRect()` method. Check this [img from MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)

<img width="459" alt="getBoundingClientRect schema" src="https://user-images.githubusercontent.com/52240221/230092703-4b91ad4f-2a24-4a99-bcca-3fa4c8490d38.png">

```js
 const targetPositionYRelativeToViewport = Math.round(
    scrollTargetElem.getBoundingClientRect().top
  );
```

<img width="1140" alt="image" src="https://user-images.githubusercontent.com/52240221/231481714-8b7c2a80-e045-4009-996f-4d260550e494.png">

#### Calc absolute target element Y-coordinate

The absolute target element Y-coordinate can be calc based on the start scroll position and the relative coordinate. The formula is:

```js
targetPositionYRelativeToViewport + scrollStartPositionY;
```

Check the schemes below.

##### Example #1

<img width="1363" alt="image" src="https://user-images.githubusercontent.com/52240221/231742185-e5afaf0b-509d-4c76-a533-89736e71d1c0.png">

##### Example #2

<img width="1372" alt="image" src="https://user-images.githubusercontent.com/52240221/231742417-f2240a7c-5af8-4150-ad81-4e8ac5b59184.png">

##### Example #3

<img width="1378" alt="image" src="https://user-images.githubusercontent.com/52240221/231742620-0bc153fa-b5a7-4f17-9d3c-37cc19dd8218.png">

### Get the scroll start timestamp

We calculated the start and end position of the scroll. However, this is not enough to implement our plan. Animation is a change of some parameter in time. Therefore, we also need to get the start time of the animation, relative to which `scrollDuration` will tick.

There are 2 options to get a 'now'-timestamp:
* `Date.now()`
* `performance.now()`

Both of them return a timestamp, but `performance.now()` is a highly-resolution one, much more precise. It's important to understand that the time used in the browser's internal scheduler is more important to animation than the number of scrolled pixels on the screen. Therefore, here we will not round the values, as in the case of pixels above. We should use this origin one to make the animation smooth and precise too.


```js
const startScrollTime = performance.now();
```

So now `smoothScrollTo()` function looks like that:

```js
function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME
}) {
  if (!scrollTargetElem) {
    return;
  }
  
  const scrollStartPositionY = Math.round(window.scrollY);
  
  const targetPositionYRelativeToViewport = Math.round(
    scrollTargetElem.getBoundingClientRect().top
  );
  
  const targetPositionY = targetPositionYRelativeToViewport + scrollStartPositionY;
  
  const startScrollTime = performance.now();
}
```

## Function `animateSingleScrollFrame()` gives the progress of the animation ([Table of Contents](#contents))

Essentially, each animation is an event that occurs over a duration, and we can break down this time-based event into separate frames. Something like this

![hand-drawn-animation-frames-element-collection_23-2149845068](https://user-images.githubusercontent.com/52240221/230394813-c214930d-7ae1-4fae-aaa1-7c87c2d1dc3b.jpg)

So, we need a function that handles single frame motion, and based on it, we will build the entire animation

```js
function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME
}) {
  if (!scrollTargetElem) {
    return;
  }
  
  const scrollStartPositionY = Math.round(window.scrollY);
  
  const targetPositionYRelativeToViewport = Math.round(
    scrollTargetElem.getBoundingClientRect().top
  );
  
  const targetPositionY = targetPositionYRelativeToViewport + scrollStartPositionY;
  
  const startScrollTime = performance.now();
 
  // here, we collect all the necessary information for the future playback 
  // of our animation into a single animationFrameSettings object
  const animationFrameSettings = {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
  };
  
  // and we pass this object into animateSingleScrollFrame() function
  animateSingleScrollFrame(animationFrameSettings)
}

function animateSingleScrollFrame({
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
  }) {}
```

### Set the current time mock

For each frame, we want to check how much time has already been spent on the animation. We have a `startScrollTime` value and now need to know the current time to calculate the elapsed time

Technically, we would obtain a `currentTime` timestamp from `requestAnimationFrame()`, but we haven't implemented it yet. We will do so later. For now, we'll mock this value:

```js
const currentTime = performance.now() + 100;
```

### Calculate the elapsed time

The elapsed time will be used to calculate the animation progress. When we implement `requestAnimationFrame()`, `currentTime` (and therefore, `elapsedTime`) will be updated on each Event Loop tick.

```js
// it's 100ms now because of the mock, but will be recalculate later
const elapsedTime = currentTime - startScrollTime;
```

### Get the absolute animation progress

The animation progress, which we calculate with the help of `elapsedTime`, shows how much of the animation is completed. We need an absolute progress ranging from 0 (beginning of the animation) to 1 (end of animation). This will help us calculate the scroll length in pixels per current frame later on.

It will be updated on each Event Loop tick. We use `Math.min()` here because in real life a frame can be calculated in time that is already longer than the given `scrollDuration`. However, the animation progress end position must not exceed 1.

```js
const absoluteAnimationProgress = Math.min(elapsedTime / scrollDuration, 1);
```

### Get the animation progress normalization by Bezier Curve

Now we have a linear animation progress. However, we often prefer non-linear animations that are a bit more intricate, featuring nice easing effects, such as starting slow, speeding up, and then slowing down again towards the end.

You can explore the most popular animation easing types based on Bezier Curves at [easings.net](https://easings.net/#). I've chosen the [easeInOutQuad](https://easings.net/#easeInOutQuad) mode for this project. On this page, you can find a function that calculates this easing effect:

```js
function easeInOutQuadProgress(animationProgress: number) {
  return animationProgress < 0.5
    ? 2 * animationProgress * animationProgress
    : -1 + (4 - 2 * animationProgress) * animationProgress;
}
```

This easing function takes the absolute animation progress, ranging between 0 and 1, and returns a corrected animation progress based on the easing calculation

If our animation progress is less than `50%`, it will increase this progress, so the animation starts slowly and then speeds up. If the progress is more than `50%`, the animation will smoothly slow down.

Let's create a wrapper function that takes `animationProgress` as a parameter and returns normalized progress from `easeInOutQuadProgress()`. I'm adding this extra function because later, we may want to handle more than just a single easing mode

```js
function animateSingleScrollFrame({
  startScrollTime,
  scrollDuration,
  scrollStartPositionY,
  targetPositionY,
}) {
  const currentTime = performance.now() + 100;
 
  const elapsedTime = currentTime - startScrollTime;
 
  const absoluteAnimationProgress = Math.min(elapsedTime / scrollDuration, 1);
  
  const normalizedAnimationProgress = normalizeAnimationProgressByBezierCurve(
    absoluteAnimationProgress
  );
}

function normalizeAnimationProgressByBezierCurve(animationProgress: number) {
  return easeInOutQuadProgress(animationProgress);
}

function easeInOutQuadProgress(animationProgress: number) {
  return animationProgress < 0.5
    ? 2 * animationProgress * animationProgress
    : -1 + (4 - 2 * animationProgress) * animationProgress;
}
```

### Calculate scroll length per frame

The next step is to calculate how many pixels we should scroll during this animation frame, based on normalized animation progress and two coordinates: start position and target position. 

We've already calculated the start position and target position in the [`smoothScrollTo()`](#function-smoothscrollto-and-its-basic-variables-table-of-contents) function. We've even collected all the necessary information for the animation in a single object `animationFrameSettings`, which we pass to the [`animateSingleScrollFrame()`](#function-animatesinglescrollframe-gives-the-progress-of-the-animation-table-of-contents) function. Let's use this information.

This dimension is absolute; we should know the length of the scroll path from the very start to the current frame point. The sign indicates the direction (whether we scroll up or down)

```js
const currentScrollLength = (targetPositionY - scrollStartPositionY) * normalizedAnimationProgress;
```

#### Example #1

<img width="1099" alt="image" src="https://user-images.githubusercontent.com/52240221/231742994-553bdd15-b4a4-4b77-bd1b-21400a554ccc.png">

#### Example #2

<img width="1201" alt="image" src="https://user-images.githubusercontent.com/52240221/231743105-942e395b-67f8-4b57-9e56-7e2576c4e60a.png">

### Calculate new position Y-coordinate

Alright, the purpose of the `animateSingleScrollFrame()` function is to actually scroll. We need to know the actual Y-coordinate of the point we're scrolling to, and since we've done all the preliminary calculations, we're ready to calculate the stopping scroll point for the current frame:

```js
const currentScrollLength = (targetPositionY - scrollStartPositionY) * normalizedAnimationProgress;

const newPositionY = scrollStartPositionY + currentScrollLength;
```

#### Example #1
<img width="1236" alt="image" src="https://user-images.githubusercontent.com/52240221/231743505-4cab3f9e-c27c-4b80-b3e3-dc4e54165f4b.png">

#### Example #2
<img width="1272" alt="image" src="https://user-images.githubusercontent.com/52240221/231743608-d3a185eb-998e-437f-b124-c211e3d05f2d.png">

### Let's put it together and scroll!

Now it's time to scroll the page! Although it's not smooth at the moment, it works!

```js
function animateSingleScrollFrame({
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
  }) {
  const currentTime = performance.now() + 100;
 
  const elapsedTime = currentTime - startScrollTime;
 
  const absoluteAnimationProgress = Math.min(elapsedTime / scrollDuration, 1);
  
  const normalizedAnimationProgress = normalizeAnimationProgressByBezierCurve(
    absoluteAnimationProgress
  );
  
  const currentScrollLength = (targetPositionY - scrollStartPositionY) * normalizedAnimationProgress;
    
  const newPositionY = scrollStartPositionY + currentScrollLength;
  
  window.scrollTo({
    top: newPositionY,
  });
}
```

In the video, you can see the difference in scroll length based on the dimension between `scrollStartPositionY` and `targetPositionY`:

[Untitled_ Apr 13, 2023 2_35 PM.webm](https://user-images.githubusercontent.com/52240221/231746886-18d64d3b-a626-4c2e-bc9a-452ae82b0d09.webm)

## Separate Frames -> Animation ([Table of Contents](#contents))

We have a function that handles a single frame, but an animation is a sequence of frames, and we need to call this function repeatedly until `the scrollDuration` is finished and the time is up to complete the animation.

The recursive `requestAnimationFrame()` will help us here. Fortunately, it's not as complicated as it might seem.

[`requestAnimationFrame()`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) (aka RAF) is a function that takes a callback with some animation as an argument, and then on each Event Loop tick, it nudges the browser to call this callback right before the repaint stage. 1 Event Loop tick -> 1 frame -> 1 `requestAnimationFrame()`. That's why we need to call it repeatedly until the animation is completed.

### Use `requestAnimationFrame()` to start the browser animation

Each recursion is based on 2 main points:
* a place for the first function call;
* a condition, in which if it is `true` we call the function again and again, and if it is `false` we stop the recursive function calls;

The first function call will be inside the `smoothScrollTo()` function as a starting animation point.

```js
function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME,
}) {
  // ... previous stuff

  // This is how we want to initially call RAF and pass an animation function as a callback
  requestAnimationFrame(animateSingleScrollFrame)
}
```

### A Pitfall with `requestAnimationFrame()` and recursion 

⚠️ By design, `requestAnimationFrame()` passes a `currentTime` timestamp as an argument to the callback. Do you remember when we mocked the `currentTime` earlier? We can't simply call RAF like this:

```js
requestAnimationFrame(animateSingleScrollFrame) 
```

... because the `animateSingleScrollFrame()` function should accept not only the currentTime argument, but also an object with the animation settings we've passed in it earlier. We should use an arrow function to deal with the obstacle:

```js
function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME,
}) {
  // ... previous stuff

  // all animation info we pass into `animateSingleScrollFrame()`
  const animationFrameSettings = {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
    onAnimationEnd
  };
  
  // an actual RAF call for continuous animation
  requestAnimationFrame((currentTime) =>
    animateSingleScrollFrame(animationFrameSettings, currentTime)
  );
}

function animateSingleScrollFrame(
  animationFrameSettings, currentTime
) { /* ... */ }
```
### Finish creating animation with recursive `requestAnimationFrame()`

This is a pretty straightforward thing. If our duration time is greater than the elapsed time, we have time for a new animation frame, so we should continue the recursive RAF:

```js
function animateSingleScrollFrame(
  {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
    onAnimationEnd
  },
  currentTime
) {

  // here, we remove the currentTime mocks and apply a 
  // Math.max to support the case when elapsedTime < 0
  const elapsedTime = Math.max(currentTime - startScrollTime, 0);

  // ...

  // yes, `animationFrameSettings` are the same as 
  // in the `animateSingleScrollFrame()` parameters
  const animationFrameSettings = {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
    onAnimationEnd
  };

  if (elapsedTime < scrollDuration) {
    requestAnimationFrame((currentTime) =>
      animateSingleScrollFrame(animationFrameSettings, currentTime)
    );
  }
}
```

Did you notice how we replaced the mock value with the current frame time? Now we have a working recursion and an actual `currentTime` we have received from RAF. There could be a case when, on the first RAF call, `currentTime` is somehow smaller than `startScrollTime`. We should support this case and, if `elapsedTime < 0`, we return `0` there.

## 🎉 It animates now!

My congratulations to you!

[Untitled_ Apr 8, 2023 2_34 PM.webm](https://user-images.githubusercontent.com/52240221/230718929-876dd79e-8d6d-446b-80ee-bddb1ef22870.webm)

## The last thing: a callback on an animation end ([Table of Contents](#contents))

It's not a crucial feature, just a nice small cherry on the cake. Let's add a callback that will be executed when the animation is fully completed.

We will pass it in the `smoothScrollTo()` function, as it is our entry point. Let's pass a small `console.log()` callback:

```js
navigation?.addEventListener("click", (e) => {
  // ... previous stuff

  smoothScrollTo({
    scrollTargetElem,
    // a simple on animation end callback
    onAnimationEnd: () => console.log("animation ends"),
  });
});
```

We do not use it directly in the `smoothScrollTo()`. Actually, it can be executed in the `animateSingleScrollFrame()`. We have a condition there to check if we have time to continue the animation or not. If we have no more time, it means that our animation ends, and we could call the callback:

```js
function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME,
  onAnimationEnd
}) {
  // ... previous stuff

  const animationFrameSettings = {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
    // add it as a new setting to the settings object
    onAnimationEnd
  };
  
  requestAnimationFrame((currentTime) =>
    animateSingleScrollFrame(animationFrameSettings, currentTime)
  );
}
```

```js
function animateSingleScrollFrame(
  {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
    // we get it here as a setting
    onAnimationEnd,
  }: IAnimateSingleScrollFrame,
  currentTime: number
) {
  // ... previous stuff

  const animationFrameSettings = {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
    // don't forget to save the on animation end callback link
    onAnimationEnd,
  };

  if (elapsedTime < scrollDuration) {
    requestAnimationFrame((currentTime) =>
      animateSingleScrollFrame(animationFrameSettings, currentTime)
    );
  // check if a on animation end callback is passed  
  // to the `animateSingleScrollFrame` function
  } else if (onAnimationEnd) {
    onAnimationEnd();
  }
}
```

[Untitled_ Apr 13, 2023 10_55 PM.webm](https://user-images.githubusercontent.com/52240221/231869150-2cd6ca18-a145-4ec1-a146-3efc41c6e719.webm)

## A final word ([Table of Contents](#contents))

We've built a fully complete Smooth Scroll concept. You can use it in your projects as is, or extend it with additional easing animations, end-of-animation callbacks, or other features! Feel free to use the code however you like!

Let me remind you that you can watch [Full Demo on Codepen](https://codepen.io/nat-davydova/full/QWZwOdb/5db409195086b5b1631055fbcb6c94e5)

I would be really glad to receive your feedback!

My social links: [codepen](https://codepen.io/nat-davydova/), [twitter](https://twitter.com/nat_davydova_en) 

I co-authored this article and developed the project alongside Dmitry Barabanov: [github](https://github.com/xfides), [twitter (ru-lang)](https://twitter.com/xfides), [youtube (ru-lang)](https://www.youtube.com/@InSimpleWords_WebDev). 
