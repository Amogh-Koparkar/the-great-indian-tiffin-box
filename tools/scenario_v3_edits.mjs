// Full End-to-End QA test for Edits 1-5 in tiffin-website-v3
export default async function(api) {
  console.log('=== 1. Testing Scene 1 Auto-play, No Hint, Sequential Dialogues & Auto-Transition ===');
  await api.open('');
  await api.waitFor(`document.getElementById('loader').classList.contains('done')`, 15000);
  await api.sleep(1600); // wait for blackFade reveal

  // Verify video is auto-playing and no hint is shown
  const s1Play = await api.eval(`({
    paused: document.getElementById('introVideo').paused,
    t: document.getElementById('introVideo').currentTime,
    hint: document.getElementById('hint').classList.contains('show'),
    hintText: document.getElementById('hint').textContent
  })`);
  console.log('Scene 1 initial playback state:', s1Play);

  // Wait for boySpeech to appear
  await api.waitFor(`document.getElementById('boySpeech').classList.contains('show')`, 10000);
  await api.sleep(350);
  const boyState = await api.eval(`({
    boyShow: document.getElementById('boySpeech').classList.contains('show'),
    momShow: document.getElementById('momSpeech').classList.contains('show'),
    hintShow: document.getElementById('hint').classList.contains('show'),
    boyRect: document.getElementById('boySpeech').getBoundingClientRect()
  })`);
  console.log('Scene 1 boy dialogue state:', boyState);
  await api.shot('v3_edit1_boy_speech_1920x1080');

  // Also capture boy speech at 1440x900 (16:10) to verify no face overlap
  await api.resize(1440, 900);
  await api.shot('v3_edit1_boy_speech_1440x900');
  await api.resize(1920, 1080);

  // Wait for momSpeech to appear (after boySpeech fades out)
  await api.waitFor(`document.getElementById('momSpeech').classList.contains('show')`, 8000);
  await api.sleep(350);
  const momState = await api.eval(`({
    boyShow: document.getElementById('boySpeech').classList.contains('show'),
    momShow: document.getElementById('momSpeech').classList.contains('show'),
    hintShow: document.getElementById('hint').classList.contains('show'),
    momRect: document.getElementById('momSpeech').getBoundingClientRect()
  })`);
  console.log('Scene 1 mom dialogue state:', momState);
  await api.shot('v3_edit1_mom_speech_1920x1080');

  await api.resize(1366, 768);
  await api.shot('v3_edit1_mom_speech_1366x768');
  await api.resize(1920, 1080);

  // Wait for automatic transition to Scene 2 (options) without any click!
  await api.waitFor(`window.__tiffin.Scenes.current.id === 'options' && !window.__tiffin.Scenes.busy`, 10000);
  console.log('Auto-transitioned to Scene 2 (options)!');

  console.log('=== 2. Testing Scene 2 Redesigned Palm Filter Buttons ===');
  await api.waitFor(`document.getElementById('panelDiet').classList.contains('show')`, 6000);
  await api.sleep(600);
  await api.shot('v3_edit2_palm_diet_1920x1080');

  await api.resize(1536, 864);
  await api.shot('v3_edit2_palm_diet_1536x864');
  await api.resize(1920, 1080);

  // Click "Veg"
  const vegPt = await api.eval(`(()=>{const r=document.querySelector('[data-diet="veg"]').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);
  await api.click(vegPt.x, vegPt.y);

  // Wait for panelMood ("Now with…")
  await api.waitFor(`document.getElementById('panelMood').classList.contains('show')`, 5000);
  await api.sleep(600);
  await api.shot('v3_edit2_palm_mood_1920x1080');

  // Click "Tangy"
  const tangyPt = await api.eval(`(()=>{const r=document.querySelector('[data-mood="tangy"]').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);
  await api.click(tangyPt.x, tangyPt.y);

  console.log('=== 3. Testing Scene 3 (New Loading & Dish-Choice Screen) ===');
  await api.waitFor(`window.__tiffin.Scenes.current.id === 'dishes'`, 6000);
  await api.sleep(1200);
  await api.shot('v3_edit3_loading_1920x1080');

  // Wait for 4 dish cards to appear
  await api.waitFor(`!document.getElementById('dishesChoice').hidden && document.querySelectorAll('.dish-card.in').length === 4`, 8000);
  await api.sleep(500);
  await api.shot('v3_edit3_cards_1920x1080');

  // Check all 4 resolutions on the 4 dish cards
  await api.resize(1536, 864);
  await api.shot('v3_edit3_cards_1536x864');
  await api.resize(1366, 768);
  await api.shot('v3_edit3_cards_1366x768');
  await api.resize(1440, 900);
  await api.shot('v3_edit3_cards_1440x900');
  await api.resize(1920, 1080);

  // Test clicking a non-clickable card (Tudkiya Bhath) -> should do nothing
  const mutedPt = await api.eval(`(()=>{const r=document.querySelectorAll('.dish-card.is-muted')[0].getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);
  await api.click(mutedPt.x, mutedPt.y);
  await api.sleep(300);
  const afterMutedClick = await api.eval(`document.getElementById('dishesChoice').classList.contains('chosen')`);
  console.log('Clicked muted card -> chosen state (must be false):', afterMutedClick);

  // Click Lemon Rice card
  const lemonPt = await api.eval(`(()=>{const r=document.getElementById('cardLemonRice').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);
  await api.click(lemonPt.x, lemonPt.y);
  await api.sleep(500);
  await api.shot('v3_edit3_confirm_1920x1080');

  // Wait for automatic transition to Scene 4 (kitchen)
  await api.waitFor(`window.__tiffin.Scenes.current.id === 'kitchen' && !window.__tiffin.Scenes.busy`, 6000);
  console.log('Auto-transitioned to Scene 4 (kitchen)!');
  await api.sleep(400);
  await api.shot('v3_edit4_kitchen_initial_1920x1080');

  console.log('=== 4. Testing Scene 4 Kitchen Skip Button (including while holding a bowl) ===');
  // Pick up bowl 1 (oil) so counter is blurred and bowl is in hand
  const oilPt = await api.S(586, 986);
  await api.click(oilPt.x, oilPt.y);
  await api.sleep(400);
  const heldBeforeSkip = await api.eval(`({
    held: !!window.__tiffin.Kitchen._debug.held,
    blurred: document.getElementById('kCounter').classList.contains('blurred')
  })`);
  console.log('Holding bowl before Skip:', heldBeforeSkip);
  await api.shot('v3_edit4_kitchen_holding_before_skip');

  // Click Skip button while holding the bowl!
  const skipPt = await api.eval(`(()=>{const r=document.getElementById('kSkipBtn').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);
  await api.click(skipPt.x, skipPt.y);
  await api.sleep(700);
  const afterSkip = await api.eval(`({
    held: !!window.__tiffin.Kitchen._debug.held,
    blurred: document.getElementById('kCounter').classList.contains('blurred'),
    bowlsAdded: window.__tiffin.State.bowlsAdded.length,
    doneShown: document.getElementById('kDone').classList.contains('show'),
    skipHidden: document.getElementById('kSkipBtn').hidden,
    panIngsIn: document.querySelectorAll('#panContents .ing.in').length,
    badgesOn: document.querySelectorAll('#bowlChecks .chk.on').length
  })`);
  console.log('Kitchen state after clicking Skip:', afterSkip);
  await api.shot('v3_edit4_kitchen_after_skip_1920x1080');

  console.log('=== 5. Testing Scene 5 Title Video 1_1 + Updated Hint Text + School Scene ===');
  await api.sleep(400);
  await api.click(960, 540); // tap to expand #ff113e box and transition to Scene 5 (title)
  await api.waitFor(`window.__tiffin.Scenes.current.id === 'title'`, 5000);
  const v1Info = await api.eval(`({
    src: document.getElementById('titleVideo1').getAttribute('src'),
    duration: document.getElementById('titleVideo1').duration
  })`);
  console.log('Title video 1 info:', v1Info);

  // Seek near the end of titleVideo1 so we don't wait the full 10.5s
  await api.eval(`(()=>{const v=document.getElementById('titleVideo1'); v.currentTime = Math.max(0, v.duration - 0.35);})()`);
  await api.waitFor(`document.getElementById('hint').classList.contains('show')`, 5000);
  const titleHint = await api.eval(`document.getElementById('hint').textContent`);
  console.log('Title scene frozen hint text:', titleHint);
  await api.shot('v3_edit5_title1_1_frozen_1920x1080');

  // Click to play titleVideo2 -> transitions to School scene
  await api.click(960, 540);
  await api.waitFor(`window.__tiffin.Scenes.current.id === 'school' && !window.__tiffin.Scenes.busy`, 8000);
  await api.sleep(400);
  await api.shot('v3_edit5_school_1920x1080');
  console.log('Reached final School scene cleanly!');
}
