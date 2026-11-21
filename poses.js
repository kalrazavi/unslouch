// The dummy. Each body part is a polyline with two frames, [resting, working];
// the figure eases from one to the other, holds, and comes back. A single frame = stays put.
// Coordinates sit on a 200-wide canvas with the floor at y = 124.

const POSES = {
  // Side view: slouched away from the wall, then stacked up against it.
  wall: {
    dur: 5, scene: 'side',
    far: [],
    body: [
      ['86,78 87,99 88,120 97,120'],
      ['93,42 86,78', '87,39 86,78'],
      ['93,46 96,64 98,81', '87,44 89,62 90,80'],
    ],
    head: ['99,31', '90,27'],
  },
  // Side view: head glides straight back over the shoulders.
  chin: {
    dur: 4,
    far: [],
    body: [
      ['100,78 100,120 109,120'],
      ['100,40 100,78'],
      ['100,42 107,36', '100,42 100,35'],
      ['100,44 102,62 103,80'],
    ],
    head: ['110,30', '101,27'],
  },
  // Front view: goalpost arms slide up the wall and back down.
  angel: {
    dur: 4, scene: 'front',
    far: [],
    body: [
      ['100,78 94,120'], ['100,78 106,120'],
      ['100,38 100,78'],
      ['100,44 82,58 76,38', '100,44 86,30 84,8'],
      ['100,44 118,58 124,38', '100,44 114,30 116,8'],
    ],
    head: ['100,27'],
  },
  // Side view, face down: chest and arms lift off the floor.
  cobra: {
    dur: 4,
    far: [],
    body: [
      ['42,117 96,116'],
      ['96,116 136,116', '96,116 133,102'],
      ['136,116 114,115', '133,102 110,104'],
    ],
    head: ['149,113', '146,92'],
  },
  // Side view, face up: hips rise until heels, hips and shoulders line up.
  plank: {
    dur: 4,
    far: [],
    body: [
      ['42,119 94,113', '42,119 91,98'],
      ['94,113 140,80', '91,98 140,78'],
      ['140,79 141,119'],
    ],
    head: ['153,74', '153,70'],
  },
  // Front view: wide stance, hands on hips, chest opening.
  power: {
    dur: 4,
    far: [],
    body: [
      ['100,78 84,120'], ['100,78 116,120'],
      ['100,38 100,78'],
      ['100,44 84,60 96,76', '100,44 78,57 96,76'],
      ['100,44 116,60 104,76', '100,44 122,57 104,76'],
    ],
    head: ['100,28', '100,26'],
  },
  // Side view: arms and legs swinging.
  walk: {
    dur: 1.2, swing: true,
    far: [
      ['100,78 94,99 86,119', '100,78 108,98 114,119'],
      ['100,44 108,60 113,74', '100,44 93,61 90,77'],
    ],
    body: [
      ['100,78 108,98 114,119', '100,78 94,99 86,119'],
      ['100,38 100,78'],
      ['100,44 93,61 90,77', '100,44 108,60 113,74'],
    ],
    head: ['101,27', '101,28'],
  },
};

const SCENE = {
  side: '<path class="wall" d="M76 2V124"/>',
  front: '<rect class="wallface" x="54" y="-6" width="92" height="130" rx="8"/>',
};

export function pose(key) {
  const p = POSES[key];
  const timing = p.swing
    ? 'keyTimes="0;.5;1" keySplines=".4 0 .6 1;.4 0 .6 1"'
    : 'keyTimes="0;.3;.75;1" keySplines=".4 0 .2 1;0 0 1 1;.4 0 .2 1"';

  const part = (cls, [a, b = a]) => {
    const d = (s) => 'M' + s.split(' ').join('L') + (cls === 'head' ? 'h.01' : '');
    const frames = (p.swing ? [a, b, a] : [a, b, b, a]).map(d).join(';');
    const move = a === b ? ''
      : `<animate attributeName="d" dur="${p.dur}s" repeatCount="indefinite" calcMode="spline" ${timing} values="${frames}"/>`;
    return `<path class="${cls}" d="${d(b)}">${move}</path>`;
  };

  return (SCENE[p.scene] || '') + '<path class="floor" d="M28 125H172"/>'
    + p.far.map((x) => part('far', x)).join('')
    + p.body.map((x) => part('limb', x)).join('')
    + part('head', p.head);
}
