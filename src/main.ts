import { DOM, DEFAULT_SCROLL_ANIMATION_TIME } from "./consts";
import {
  ISmoothScrollToProps,
  IAnimateSingleScrollFrame,
  IAnimateSingleScrollFrameProps,
} from "./types";

const navigation = document.querySelector(`.${DOM.nav}`);

navigation?.addEventListener("click", (e) => {
  e.preventDefault();

  const currentTarget = e.target;

  if (!(currentTarget instanceof Element)) {
    return;
  }

  const currentLink = currentTarget.closest(`.${DOM.navLink}`);

  const scrollTargetElem = getScrollTargetElem(currentLink);

  smoothScrollTo({ scrollTargetElem });
});

export function smoothScrollTo({
  scrollTargetElem,
  scrollDuration = DEFAULT_SCROLL_ANIMATION_TIME,
}: ISmoothScrollToProps) {
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

  const animationFrameSettings = {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
  };

  animateSingleScrollFrame.animationFrameSettings = {
    ...animationFrameSettings,
  };

  // requestAnimationFrame(boundFrameAnimation);
  requestAnimationFrame(animateSingleScrollFrame);
}

// найти target
function getScrollTargetElem(clickedLinkElem: Element | null) {
  if (!clickedLinkElem) {
    return null;
  }

  const clickedLinkElemHref = clickedLinkElem.getAttribute("href");

  if (!clickedLinkElemHref) {
    return null;
  }

  let scrollTarget;

  try {
    scrollTarget = document.querySelector(clickedLinkElemHref);
  } catch (e) {
    console.log(e);
    return null;
  }

  return scrollTarget;
}

const animateSingleScrollFrame: IAnimateSingleScrollFrameProps = (
  {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
  }: IAnimateSingleScrollFrame,
  currentTime: number
): void => {
  // как это, блин, работает?? Почему currentTime меньше startTime??!!!
  const elapsedTime = Math.max(currentTime - startScrollTime, 0);

  const absoluteAnimationProgress = Math.min(elapsedTime / scrollDuration, 1);

  const normalizedAnimationProgress = normalizeAnimationProgressByBezierCurve(
    absoluteAnimationProgress
  );

  const currentScrollLength =
    (targetPositionY - scrollStartPositionY) * normalizedAnimationProgress;

  const newPositionY = scrollStartPositionY + currentScrollLength;

  window.scrollTo({
    top: newPositionY,
  });

  const animationFrameSettings = {
    startScrollTime,
    scrollDuration,
    scrollStartPositionY,
    targetPositionY,
  };

  TS2345: Argument of type 'IAnimateSingleScrollFrameProps' is
  not assignable to parameter of type 'FrameRequestCallback'.

    interface FrameRequestCallback {
    (time: DOMHighResTimeStamp): void;
  }

  if (elapsedTime < scrollDuration) {
    requestAnimationFrame(animateSingleScrollFrame);
  } else {
    console.log("Scroll ends here");
  }
};

animateSingleScrollFrame.animationFrameSettings = {
  startScrollTime: 0,
  targetPositionY: 0,
  scrollStartPositionY: 0,
  scrollDuration: 0,
};

function normalizeAnimationProgressByBezierCurve(animationProgress: number) {
  return easeInOutQuadProgress(animationProgress);
}

function easeInOutQuadProgress(animationProgress: number) {
  return animationProgress < 0.5
    ? 2 * animationProgress * animationProgress
    : -1 + (4 - 2 * animationProgress) * animationProgress;
}
