import gsap from 'gsap';

export function horizontalLoop(items, config) {
  items = gsap.utils.toArray(items);
  config = config || {};
  
  const tl = gsap.timeline({
    repeat: config.repeat,
    paused: config.paused,
    defaults: { ease: 'none' },
    onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
  });

  const length = items.length;
  const startX = items[0].offsetLeft;
  const times = [];
  const widths = [];
  const xPercents = [];
  let curIndex = 0;
  const pixelsPerSecond = (config.speed || 1) * 100;
  const snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1);

  // Initialize items and calculate widths
  gsap.set(items, {
    xPercent: (i, el) => {
      const width = widths[i] = parseFloat(gsap.getProperty(el, 'width', 'px'));
      xPercents[i] = snap(
        (parseFloat(gsap.getProperty(el, 'x', 'px')) / width * 100 +
        (parseFloat(gsap.getProperty(el, 'xPercent')) || 0
      )));
      return xPercents[i];
    }
  });

  // Calculate total width of all items including padding
  const totalWidth = calculateTotalWidth();

  // Create the animation loop
  for (let i = 0; i < length; i++) {
    const item = items[i];
    const curX = (xPercents[i] / 100) * widths[i];
    const distanceToStart = item.offsetLeft + curX - startX;
    const distanceToLoop = distanceToStart + widths[i] * (parseFloat(gsap.getProperty(item, 'scaleX')) || 1);

    // Animation to move left
    tl.to(item, {
      xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
      duration: distanceToLoop / pixelsPerSecond,
    }, 0);

    // Animation to reset position from right
    tl.fromTo(item, {
      xPercent: snap(((curX - distanceToLoop + totalWidth) / widths[i]) * 100),
    }, {
      xPercent: xPercents[i],
      duration: (totalWidth - distanceToLoop) / pixelsPerSecond,
      immediateRender: false,
    }, distanceToLoop / pixelsPerSecond);

    // Add label for this item's start position
    tl.add('label' + i, distanceToStart / pixelsPerSecond);
    times[i] = distanceToStart / pixelsPerSecond;
  }

  function calculateTotalWidth() {
    const lastIndex = items.length - 1;
    return items[lastIndex].offsetLeft +
      (xPercents[lastIndex] / 100) * widths[lastIndex] -
      startX +
      items[lastIndex].offsetWidth *
      (parseFloat(gsap.getProperty(items[lastIndex], 'scaleX')) || 1) +
      (config.paddingRight || 0);
  }

  function toIndex(index, vars) {
    vars = vars || {};
    // Always go in the shortest direction
    if (Math.abs(index - curIndex) > length / 2) {
      index += index > curIndex ? -length : length;
    }
    
    const newIndex = gsap.utils.wrap(0, length, index);
    let time = times[newIndex];
    
    // Adjust for timeline wrapping
    if ((time > tl.time()) !== (index > curIndex)) {
      vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
      time += tl.duration() * (index > curIndex ? 1 : -1);
    }
    
    curIndex = newIndex;
    vars.overwrite = true;
    return tl.tweenTo(time, vars);
  }

  // Add navigation methods to timeline
  tl.next = (vars) => toIndex(curIndex + 1, vars);
  tl.previous = (vars) => toIndex(curIndex - 1, vars);
  tl.current = () => curIndex;
  tl.toIndex = (index, vars) => toIndex(index, vars);
  tl.times = times;

  // Pre-render for better performance
  tl.progress(1, true).progress(0, true);

  if (config.reversed) {
    tl.vars.onReverseComplete();
    tl.reverse();
  }

  return tl;
}