// Full end-to-end QA for tiffin-website-v3 (Scenes 1 -> 2 -> 3 -> 4 -> 5 -> PDF -> Replay)
export default async (t) => {
  // 1. Scene 1: Opening video
  await t.open('index.html');
  await t.waitFor(`document.getElementById('loader').classList.contains('done')`);
  await t.sleep(3200);
  await t.shot('v3_1_intro_revealed');
  await t.click(960, 540);
  await t.sleep(4200);
  await t.shot('v3_2_intro_settled');
  await t.click(960, 540);

  // 2. Scene 2: Options with options_bg.png
  await t.waitFor(`__tiffin.Scenes.current.id === 'options' && document.getElementById('panelDiet').classList.contains('show')`, 8000);
  await t.sleep(300);
  await t.shot('v3_3_options_bg');
  await t.eval(`document.querySelector('[data-diet="veg"]').click()`);
  await t.waitFor(`document.getElementById('panelMood').classList.contains('show')`);
  await t.sleep(300);
  await t.eval(`document.querySelector('[data-mood="tangy"]').click()`);

  // 3. Scene 3: Kitchen with Kitchen_bg.png
  await t.waitFor(`__tiffin.Scenes.current.id === 'kitchen' && !__tiffin.Scenes.busy`, 8000);
  await t.sleep(400);
  await t.shot('v3_4_kitchen_bg');

  // Pour all 6 bowls into the pan
  const panPt = await t.S(935, 312);
  const bowls = [[239, 451], [586, 986], [185, 725], [453, 688], [515, 833], [261, 953]];
  for (const [bx, by] of bowls) {
    const bp = await t.S(bx, by);
    await t.move(bp.x, bp.y);
    await t.sleep(100);
    await t.down(bp.x, bp.y);
    await t.sleep(150);
    await t.move(panPt.x, panPt.y);
    await t.sleep(200);
    await t.up(panPt.x, panPt.y);
    await t.sleep(2250);
  }
  await t.shot('v3_5_kitchen_done_box');

  // Check #kDone span metrics (color, bg, size, centered position)
  const doneInfo = await t.eval(`(() => {
    const s = document.querySelector('#kDone span');
    const cs = getComputedStyle(s);
    const r = s.getBoundingClientRect();
    const sr = document.getElementById('stage').getBoundingClientRect();
    return {
      bg: cs.backgroundColor,
      color: cs.color,
      fontSize: cs.fontSize,
      centerXDiff: Math.round((r.left + r.width / 2) - (sr.left + sr.width / 2)),
      centerYDiff: Math.round((r.top + r.height / 2) - (sr.top + sr.height / 2)),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  })()`);
  console.log('kDone info:', doneInfo);

  // Tap to trigger #ff113e screen transition into Scene 4 (title scene 1.mp4)
  await t.click(960, 540);
  await t.sleep(300);
  await t.shot('v3_6_red_wash_transition');

  // Wait for Scene 4 to be active & titleVideo1 playing
  await t.waitFor(`__tiffin.Scenes.current.id === 'title'`, 5000);
  await t.sleep(2500);
  await t.shot('v3_7_title1_playing');

  // Verify tapping while titleVideo1 is playing is ignored
  await t.click(960, 540);
  console.log('mode after mid-play tap (should still be v1_playing):', await t.eval(`__tiffin.Scenes.list.title._debug.mode`));

  // Fast-forward titleVideo1 near the end so we test the natural ended event + freeze + hint
  await t.eval(`(() => { const v = document.getElementById('titleVideo1'); v.currentTime = v.duration - 0.3; })()`);
  await t.waitFor(`__tiffin.Scenes.list.title._debug.mode === 'v1_frozen'`, 5000);
  await t.sleep(500);
  await t.shot('v3_8_title1_frozen_with_hint');
  console.log('title1 frozen hint:', await t.eval(`document.getElementById('hint').textContent`));

  // Tap to start titleVideo2 immediately
  await t.click(960, 540);
  await t.sleep(800);
  await t.shot('v3_9_title2_playing');
  console.log('mode after tap (should be v2_playing):', await t.eval(`__tiffin.Scenes.list.title._debug.mode`));

  // Wait for titleVideo2 to finish and transition to Scene 5 with frozen last frame as background
  await t.waitFor(`__tiffin.Scenes.current.id === 'school' && !__tiffin.Scenes.busy`, 10000);
  await t.sleep(500);
  await t.shot('v3_10_school_over_frozen_title2');

  // Hover a student in Scene 5
  const hpPt = await t.S(900, 320);
  await t.move(hpPt.x, hpPt.y);
  await t.sleep(350);
  await t.shot('v3_11_school_hover_hp');
  console.log('school hover label:', await t.eval(`document.getElementById('studentLabel').textContent`));

  // Click main boy to open PDF popup
  const mainPt = await t.S(770, 460);
  await t.click(mainPt.x, mainPt.y);
  await t.sleep(600);
  await t.shot('v3_12_pdf_open');
  console.log('pdf open:', await t.eval(`!document.getElementById('pdfModal').hidden`));

  // Close PDF and click Replay
  await t.eval(`document.getElementById('pdfClose').click()`);
  await t.sleep(450);
  await t.eval(`document.getElementById('replayBtn').click()`);
  await t.sleep(3800);
  await t.shot('v3_13_after_replay');
  console.log('after replay scene:', await t.eval(`__tiffin.Scenes.current.id`),
              'title mode reset:', await t.eval(`__tiffin.Scenes.list.title._debug.mode`),
              'bg-under cleared:', await t.eval(`!document.getElementById('scene-title').classList.contains('bg-under')`));
};
