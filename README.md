# smoothScrollTo() Function Concept

## What is it

I'm implementing my own vanilla JS alternative to the browser's `scroll-behavior: smooth` feature here. It's useful for cases when you need to combine this functionality with complex scroll JS behavior.

## Demo, HTML & CSS

You could check a [Full Demo on Codepen](https://codepen.io/nat-davydova/full/QWZwOdb/5db409195086b5b1631055fbcb6c94e5)

### HTML

The HTML structure here is simple: just a navigation with 3 links and 3 sections corresponding to them:

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

The styles are simple too. I've made the navigation fixed and added some decorative section styles to visually separate them:

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

## Event Listener

First, we need to grab the navigation element to add an event listener to it. We should not apply listeners directly to links in the navigation, as it's a bad practice (refer to the event delegation JS pattern)

```js
// I prefer to store all the DOM selector strings into a single object
const DOM = {
  nav: "navigation",
  navLink: "navigation__link",
};

const navigation = document.querySelector(`.${DOM.nav}`);
```
Next, we add an event listener to the navigation and prevent the default behavior of clicked link targets within it:

``` js
// we can't be sure that navigation element exists, so we need optional chaining
navigation?.addEventListener("click", (e) => {
  e.preventDefault();

});
```

Here, we implement the event delegation pattern: we check if the element is a navigation link or if it is a descendant of one. If it's not, we exit the function and do nothing

```js
navigation?.addEventListener("click", (e) => {
  e.preventDefault();

  const currentTarget = e.target;

  // we interested in a link we actually click
  const currentLink = currentTarget.closest(`.${DOM.navLink}`);
  
  // all the magic will be here on link click
});
```

## Get scrollTo target

The purpose of the smoothScrollTo() function is to scroll to a specific element on the page. Therefore, we need to determine the target of our scroll somehow. Let's create a function that will do this

```js
function getScrollTargetElem() {}
```

What should it do:

* get the link we've clicked;
* obtain the value of the href attribute, which can be the actual ID of the element we want to scroll to or can be an external link or simply a plain text;
* verify if it's a valid value to grab the element by:
  * if not, return null (clearly, we have no element);
  * if yes, grab the target element and return it;

### Get the clicked link

We captured a link we've clicked here:

```js
const currentLink = currentTarget.closest(`.${DOM.navLink}`);
```

We can't truly guarantee that JavaScript will 100% find this element in the DOM. That's why `currentLink` can be either `Element` or `null`.

So, we can pass it as an argument when `getScrollTargetElem` is called inside the event handler. Now, let's set it as a function parameter:

```js
function getScrollTargetElem(clickedLinkElem) {
  if (!clickedLinkElem) {
    return null;
  }
  
  ...
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
  // ... previous stuff
  
  let scrollTarget;
  
  try {
    scrollTarget = document.querySelector(clickedLinkElemHref);
  } catch (e) {
    console.log(e);
    return null;
  }

  return scrollTarget;
}
```

### Get actual scrollTo target

Let's get the element (or `null`) in the event handler:

```js
navigation?.addEventListener("click", (e) => {
  // ... previous stuff

  const currentLink = currentTarget.closest(`.${DOM.navLink}`);

  const scrollTargetElem = getScrollTargetElem(currentLink);

  smoothScrollTo(scrollTargetElem);
});
```
## smoothScrollTo() function and it's basic variables

The actual function that performs all the magic is a function that smoothly scrolls to the target. We call it in the event handler after target definition, as it should know the point to which it should actually scroll

```js
navigation?.addEventListener("click", (e) => {
  // ... previous stuff

  // getScrollTargetElem() returns either an Element or null, 
  // and we handle what to do in both cases within the smoothScrollTo() function
  const scrollTargetElem = getScrollTargetElem(currentLink);

  smoothScrollTo(scrollTargetElem);
});

function smoothScrollTo(scrollTargetElem) {
  if (!scrollTarget) {
    return;
  }
}
```

### Scroll Duration

The crucial thing we need to know is how long our animation should last. In our case, the user should be able to set it directly as a ` smoothScrollTo` parameter. Additionally, we will define a default value in case the user doesn't want to set any.

```js
const DEFAULT_SCROLL_ANIMATION_TIME = 500;

navigation?.addEventListener("click", (e) => {
  // ... previous stuff

  // the user can set any time in milliseconds here
  // I've also packed the arguments into objects for more convenient handling
  smoothScrollTo({scrollTargetElem, scrollDuration: some_time_in_ms});
});

function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME
}) {}
```

### Get actual user Y-coordinate

A crucial part of each custom scrolling is detecting the starting point. We can perform further calculations based on the coordinates of our current position on the page. In our case (vertical scrolling), we're interested in Y-coordinates only. The starting point is easy to obtain with `window.scrollY`:

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
[Untitled_ Apr 5, 2023 4_03 PM.webm](https://user-images.githubusercontent.com/52240221/230088691-7c632ad0-5dac-484b-8308-bb43ec1a0a1b.webm)

### Get Y-coordinate of target element

We know the starting point of scrolling, and we need one more point - the Y-coordinate of where to scroll. It's a bit more tricky: we have no methods to directly grab the absolute coordinate of the top-left corner of the target element. However, it's still possible, but we need two steps to obtain it.

#### Get the target element Y-coordinate relative to viewport

We need to grab the target element's Y-coordinate relative to the user's viewport. Our helper for this task is the `getBoundingClientRect()` method. Check this [img from MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)

<img width="459" alt="getBoundingClientRect schema" src="https://user-images.githubusercontent.com/52240221/230092703-4b91ad4f-2a24-4a99-bcca-3fa4c8490d38.png">

```js
function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME
}) {
  // ... previous stuff
  
  const scrollStartPositionY = Math.round(window.scrollY);
  
  const targetPositionYRelativeToViewport = Math.round(
    scrollTargetElem.getBoundingClientRect().top
  );
}
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

So now `smoothScrollTo()` function looks like that:

```js
function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME
}) {
  // ... previous stuff
  
  const scrollStartPositionY = Math.round(window.scrollY);
  
  const targetPositionYRelativeToViewport = Math.round(
    scrollTargetElem.getBoundingClientRect().top
  );
  
  const targetPositionY = targetPositionYRelativeToViewport + scrollStartPositionY;
}
```

### Get the scroll start timestamp

We need this value for animation settings which would be discussed later. 

There are 2 options to get a 'now'-timestamp:
* `Date.now()`
* `performance.now()`

Both of them return a timestamp, but `performance.now()` is a highly-resolution one, much more precise. So we should use this one to make the animation smooth and precise too.

```js
function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME
}) {
  // ... previous stuff
  
  const startScrollTime = performance.now();
}
```

## Animation per frame function

Essentially, each animation is an event that occurs over a duration, and we can break down this time-based event into separate frames. Something like this

![hand-drawn-animation-frames-element-collection_23-2149845068](https://user-images.githubusercontent.com/52240221/230394813-c214930d-7ae1-4fae-aaa1-7c87c2d1dc3b.jpg)

So, we need a function that handles single frame motion, and based on it, we will build the entire animation

Let's define it, call it in the `smoothScrollTo()` as a draft, and pass `startScrollTime` and `scrollDuration` to it:

```js
function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME
}) {
  // ... previous stuff
  
  const startScrollTime = performance.now();
  
  animateSingleScrollFrame({
    startScrollTime,
    scrollDuration
  })
}

function animateSingleScrollFrame({startScrollTime, scrollDuration }) {}
```

### Current Time Mock

For each frame, we want to check how much time has already been spent on the animation. We have a `startScrollTime` value and now need to know the current time to calculate the elapsed time

Technically, we would obtain a `currentTime` timestamp from `requestAnimationFrame()`, but we haven't implemented it yet. We will do so later. For now, we'll mock this value:

```js
function animateSingleScrollFrame({startScrollTime, scrollDuration }) {
  // The '100' here is a magic number, used for mock purposes only, 
  // and will be removed upon the implementation of requestAnimationFrame()
  const currentTime = performance.now() + 100;
}
```

### Elapsed Time

The elapsed time will be used to calculate the animation progress. When we implement `requestAnimationFrame()`, `currentTime` (and therefore, `elapsedTime`) will be updated on each Event Loop tick.

```js
function animateSingleScrollFrame({startScrollTime, scrollDuration }) {
  // ... previous stuff
  
  // It's currently equal to 100ms due to the mock value
  const elapsedTime = currentTime - startScrollTime;
}
```

### Animation Progress

The animation progress, which we calculate with the help of ёelapsedTimeё, shows how much of the animation is completed. We need an absolute progress ranging from 0 (beginning of the animation) to 1 (end of animation). This will help us calculate the scroll length in pixels per current frame later on

It will be updated on each Event Loop tick.

```js
function animateSingleScrollFrame({startScrollTime, scrollDuration }) {
  // ... previous stuff
  
  // If the progress exceeds 100% due to some browser lag, we'll stop at 1 and avoid errors here
  const absoluteAnimationProgress = Math.min(elapsedTime / scrollDuration, 1);
}
```

### Animation Progress normalization by Bezier Curve

#### Animation Easings

If you want a simple linear animation, you can skip this step. However, we often prefer non-linear animations that are a bit more intricate, featuring nice easing effects, such as starting slow, speeding up, and then slowing down again towards the end.

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

#### Animation Progress Normalization

Let's create a wrapper function that takes `animationProgress` as a parameter and returns normalized progress from `easeInOutQuadProgress()`. I'm adding this extra function because later, we may want to handle more than just a single easing mode

```js 
function animateSingleScrollFrame({startScrollTime, scrollDuration }) {
  // ... previous stuff
  
  const normalizedAnimationProgress = normalizeAnimationProgressByBezierCurve(
    absoluteAnimationProgress
  );
}

function normalizeAnimationProgressByBezierCurve(animationProgress: number) {
  return easeInOutQuadProgress(animationProgress);
}
```

### Scroll length per frame

The next step is to calculate how many pixels we should scroll during this animation frame, based on normalized animation progress and two coordinates: start position and target position. 

We've already calculated the start position and target position in the `smoothScrollTo()` function, so now we should pass them to the `animateSingleScrollFrame()` function:

```js
function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME,
}) {
  if (!scrollTargetElem) {
    return;
  }

  const scrollStartPositionY = Math.round(window.scrollY);

  const targetPositionYRelativeToViewport = Math.round(
    scrollTargetElem.getBoundingClientRect().top
  );

  const targetPositionY =
    targetPositionYRelativeToViewport + scrollStartPositionY;

  const startScrollTime = performance.now();

  animateSingleScrollFrame({
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
  });
}
```

This dimension is absolute; we should know the length of the scroll path from the very start to the current frame point. The sign is for direction (we scroll up or down):

```js
function animateSingleScrollFrame({
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
  }) {
  // ... previous stuff
  
  const currentScrollLength =
    (targetPositionY - scrollStartPositionY) * normalizedAnimationProgress;
}
```

#### Example #1

<img width="1099" alt="image" src="https://user-images.githubusercontent.com/52240221/231742994-553bdd15-b4a4-4b77-bd1b-21400a554ccc.png">

#### Example #2

<img width="1201" alt="image" src="https://user-images.githubusercontent.com/52240221/231743105-942e395b-67f8-4b57-9e56-7e2576c4e60a.png">

### New position Y-coordinate

Alright, the purpose of the `animateSingleScrollFrame()` function is to actually scroll. We need to know the actual Y-coordinate of the point we're scrolling to, and since we've done all the preliminary calculations, we're ready to calculate the stopping scroll point for the current frame:

```js
function animateSingleScrollFrame({
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
  }) {
  // ... previous stuff
  
  const currentScrollLength =
    (targetPositionY - scrollStartPositionY) * normalizedAnimationProgress;
    
  const newPositionY = scrollStartPositionY + currentScrollLength;
}
```

#### Example #1
<img width="1236" alt="image" src="https://user-images.githubusercontent.com/52240221/231743505-4cab3f9e-c27c-4b80-b3e3-dc4e54165f4b.png">

#### Example #2
<img width="1272" alt="image" src="https://user-images.githubusercontent.com/52240221/231743608-d3a185eb-998e-437f-b124-c211e3d05f2d.png">

### Let's Scroll!

Now it's time to scroll the page! Although it's not smooth at the moment, it works!

```js
function animateSingleScrollFrame({
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
  }) {
  // ... previous stuff
    
  const newPositionY = scrollStartPositionY + currentScrollLength;
  
  window.scrollTo({
    top: newPositionY,
  });
}
```

In the video, you can see the difference in scroll length based on the dimension between `scrollStartPositionY` and `targetPositionY`:

[Untitled_ Apr 6, 2023 8_58 PM.webm](https://user-images.githubusercontent.com/52240221/230458661-7885e840-09f2-49c5-8182-4ea6ee071e65.webm)

## Separate Frames -> Animation

We have a function that handles a single frame, but an animation is a sequence of frames, and we need to call this function repeatedly until `the scrollDuration` is finished and the time is up to complete the animation.

The recursive `requestAnimationFrame()` will help us here. Fortunately, it's not as complicated as it might seem.

### What is `requestAnimationFrame()`?

`requestAnimationFrame()` (aka RAF) is a function that takes a callback with some animation as an argument, and then on each Event Loop tick, it nudges the browser to call this callback right before the repaint stage. 1 Event Loop tick -> 1 frame -> 1 `requestAnimationFrame()`. That's why we need to call it repeatedly until the animation is completed.

### Add a recursion into our code

Each recursion is based on 2 main points:
* a place for the first function call;
* a condition, in which if it is `true` we call the function again and again, and if it is `false` we stop the recursive function calls;

#### A place for the first function call

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

#### ⚠️ A Pitfall

By design, `requestAnimationFrame()` passes a `currentTime` timestamp as an argument to the callback. Do you remember when we mocked the `currentTime` earlier? We can't simply call RAF like this:

```js
requestAnimationFrame(animateSingleScrollFrame) 
```

... because the `animateSingleScrollFrame()` function should accept not only the currentTime argument, but also an object with the animation settings we've passed in it earlier.

We need to use an arrow function here:

```js
function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME,
}) {
  // ... previous stuff

  // all the things we've passed into `animateSingleScrollFrame` earlier
  const animationFrameSettings = {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY
  };
  
  // an actual RAF call
  requestAnimationFrame((currentTime) =>
    animateSingleScrollFrame(animationFrameSettings, currentTime)
  );
```

```js
function animateSingleScrollFrame(
  {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
  },
  currentTime: number
) {
  // ... a function inner content
}
```
#### Add a recursion repeating condition

This is a pretty straightforward thing. If our duration time is greater than the elapsed time, we have time for a new animation frame, so we should continue the recursive RAF:

```js
function animateSingleScrollFrame(
  {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY
  },
  currentTime: number
) {
 
  // ... previuos stuff

  const animationFrameSettings = {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
  };

  if (elapsedTime < scrollDuration) {
    requestAnimationFrame((currentTime) =>
      animateSingleScrollFrame(animationFrameSettings, currentTime)
    );
  }
}
```

### Remove `currentTime` mocks

Now we have a working recursion and an actual `currentTime` we have received from RAF. There could be a case when, on the first RAF call, `currentTime` is somehow smaller than `startScrollTime`. We should support this case and, if `elapsedTime < 0`, we return `0` there

```js
function animateSingleScrollFrame(
  {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
  },
  currentTime: number
) {
  
  // here, we remove the currentTime mocks and apply a Math.max to support the case when elapsedTime < 0
  const elapsedTime = Math.max(currentTime - startScrollTime, 0);
  
  // ... next stuff
  
}
```

## 🎉 It animates now!

[Untitled_ Apr 8, 2023 2_34 PM.webm](https://user-images.githubusercontent.com/52240221/230718929-876dd79e-8d6d-446b-80ee-bddb1ef22870.webm)

## The last thing: a callback on animation end

It's not a critical feature, just a nice small cherry on the cake. Let's add a callback that will be executed when the animation is fully completed.

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
  
  // ... next stuff
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
    // add it as a new setting to the settings object
    onAnimationEnd,
  };

  if (elapsedTime < scrollDuration) {
    requestAnimationFrame((currentTime) =>
      animateSingleScrollFrame(animationFrameSettings, currentTime)
    );
  // check if a callback is passed to the function
  } else if (onAnimationEnd) {
    onAnimationEnd();
  }
}
```

[Untitled_ Apr 8, 2023 2_56 PM.webm](https://user-images.githubusercontent.com/52240221/230719801-3186ccbf-8623-445b-837b-a1588bf487dc.webm)

## A final word

We've built a fully complete Smooth Scroll concept. You can use it in your projects as is, or extend it with additional easing animations, end-of-animation callbacks, or other features! Feel free to use the code however you like!

I would be really glad to receive your feedback!
