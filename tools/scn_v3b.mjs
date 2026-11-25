// Comprehensive QA for Edit 0 + Edit 1 + Edit 2 + Edit 3 + Edit 4
export default async (t) => {
  // 1. Check viewport coverage at 1440x900 (16:10), 1366x768, 1536x864, 1920x1080
  await t.open('index.html?scene=options');
  await t.waitFor(`document.getElementById('loader').classList.contains('done')`);
  await t.waitFor(`document.getElementById('panelDiet').classList.contains('show')`);
  await t.sleep(300);

  for (const [w, h] of [[1440, 900], [1366, 768], [1536, 864], [1920, 1080]]) {
    await t.resize(w, h);
    const rect = await t.eval(`(() => { const r = document.getElementById('stage').getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), vw: innerWidth, vh: innerHeight }; })()`);
    console.log(`stage rect at ${w}x${h}:`, rect);
    await t.shot(`v3b_options_${w}x${h}`);
  }

  // 2. Test Scene 1 (no screenRumble shake)
  await t.open('index.html');
  await t.waitFor(`document.getElementById('loader').classList.contains('done')`);
  await t.sleep(3100);
  await t.click(960, 540);
  await t.sleep(3800);
  const hasRumbleClass = await t.eval(`document.getElementById('scene-intro').classList.contains('rumble')`);
  console.log('Scene 1 has rumble shake class (should be false):', hasRumbleClass);
  await t.shot('v3b_s1_settled_no_shake');
  await t.click(960, 540);

  // 3. Test Scene 2 -> Scene 3
  await t.waitFor(`__tiffin.Scenes.current.id === 'options' && document.getElementById('panelDiet').classList.contains('show')`);
  await t.eval(`document.querySelector('[data-diet="veg"]').click()`);
  await t.waitFor(`document.getElementById('panelMood').classList.contains('show')`);
  await t.eval(`document.querySelector('[data-mood="spicy"]').click()`);

  // 4. Test Scene 3 ordered cooking (1: oil, 2: masala, 3: onion, 4: lemon, 5: rice, 6: nuts)
  await t.waitFor(`__tiffin.Scenes.current.id === 'kitchen' && !__tiffin.Scenes.busy`, 8000);
  await t.sleep(350);
  await t.shot('v3b_s3_ordered_badges_initial');

  // Try picking up Rice (step 5) out of order when step 1 (Oil) is active!
  const ricePt = await t.S(239, 451);
  await t.move(ricePt.x, ricePt.y);
  await t.sleep(150);
  await t.down(ricePt.x, ricePt.y);
  await t.sleep(200);
  await t.shot('v3b_s3_wrong_bowl_feedback');
  await t.up(ricePt.x, ricePt.y);
  console.log('out-of-order held (should be null):', await t.eval(`__tiffin.Kitchen._debug.held`),
              'hint after wrong click:', await t.eval(`document.getElementById('hint').textContent`));

  // Now pour all 6 bowls in the required order: 1. oil, 2. masala, 3. onion, 4. lemon, 5. rice, 6. nuts
  const panPt = await t.S(935, 312);
  const ordered = [
    ['oil',    586, 986],
    ['masala', 185, 725],
    ['onion',  453, 688],
    ['lemon',  515, 833],
    ['rice',   239, 451],
    ['nuts',   261, 953],
  ];
  for (const [id, bx, by] of ordered) {
    const bp = await t.S(bx, by);
    await t.move(bp.x, bp.y);
    await t.sleep(100);
    await t.down(bp.x, bp.y);
    await t.sleep(150);
    await t.move(panPt.x, panPt.y);
    await t.sleep(200);
    await t.up(panPt.x, panPt.y);
    await t.waitFor(`!__tiffin.Kitchen._debug.busy && !__tiffin.Kitchen._debug.held && __tiffin.State.bowlsAdded.includes("${id}")`, 6000);
    await t.sleep(150);
  }
  await t.waitFor(`document.getElementById('kDone').classList.contains('show')`, 5000);
  await t.sleep(300);
  await t.shot('v3b_s3_all_6_ordered_done');
  console.log('bowlsAdded in order:', await t.eval(`__tiffin.State.bowlsAdded`));

  // Click to trigger smooth expanding #ff113e box transition into Scene 4
  await t.click(960, 540);
  await t.sleep(450);
  await t.shot('v3b_s3_expanding_box_mid');
  await t.waitFor(`__tiffin.Scenes.current.id === 'title'`, 5000);

  // Fast-forward titleVideo1 near end -> freezes -> tap -> titleVideo2 plays -> students appear at ~3.05s
  await t.sleep(300);
  await t.eval(`(() => { const v = document.getElementById('titleVideo1'); v.currentTime = v.duration - 0.25; })()`);
  await t.waitFor(`__tiffin.Scenes.list.title._debug.mode === 'v1_frozen'`, 5000);
  await t.sleep(300);
  const tTap = Date.now();
  await t.click(960, 540);
  await t.waitFor(`__tiffin.Scenes.current.id === 'school' && !__tiffin.Scenes.busy`, 6000);
  console.log('time from tap to Scene 5 students interactive (ms):', Date.now() - tTap);
  await t.shot('v3b_s5_students_appeared_fast');

  // Check Scene 5 at 1440x900 (16:10) as well
  await t.resize(1440, 900);
  await t.shot('v3b_s5_1440x900');
  await t.resize(1920, 1080);

  // Test Replay resets bowl badges and videos
  await t.eval(`document.getElementById('replayBtn').click()`);
  await t.sleep(3700);
  const step1Badge = await t.eval(`(() => { const c = document.querySelector('.chk[data-for="oil"]'); return { text: c.textContent, isNext: c.classList.contains('next') }; })()`);
  console.log('after Replay step 1 badge:', step1Badge);
};
