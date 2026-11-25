// End-to-End QA for tiffin-website-v4 (Edits 1 to 5)
export default async function(api) {
  console.log('=== EDIT 1: Scene 1 Dialogues (Amogh & Mother, no grrr..., 10-15% larger Bold names, Regular lines) ===');
  await api.open('');
  await api.waitFor(`document.getElementById('loader').classList.contains('done')`, 15000);
  await api.sleep(1500);

  // Verify scroll is locked in Scene 1
  const s1ScrollLocked = await api.eval(`!document.body.classList.contains('school-unlocked') && getComputedStyle(document.body).overflow === 'hidden'`);
  console.log('Scene 1 scroll locked:', s1ScrollLocked);

  // Wait for Amogh's line
  await api.waitFor(`document.getElementById('boySpeech').classList.contains('show')`, 10000);
  await api.sleep(350);
  const boyData = await api.eval(`(()=>{
    const box = document.getElementById('boySpeech');
    const nm = box.querySelector('.speech-name');
    const ln = box.querySelector('.speech-line');
    return {
      nameText: nm.textContent,
      lineText: ln.textContent,
      hasRumble: !!box.querySelector('.rumble-sfx'),
      nameFontSize: parseFloat(getComputedStyle(nm).fontSize),
      lineFontSize: parseFloat(getComputedStyle(ln).fontSize),
      nameWeight: getComputedStyle(nm).fontWeight,
      lineWeight: getComputedStyle(ln).fontWeight,
      ratio: +(parseFloat(getComputedStyle(nm).fontSize) / parseFloat(getComputedStyle(ln).fontSize)).toFixed(3)
    };
  })()`);
  console.log('Boy speech check:', boyData);
  await api.shot('v4_edit1_amogh_1920x1080');

  // Wait for Mother's line
  await api.waitFor(`document.getElementById('momSpeech').classList.contains('show')`, 8000);
  await api.sleep(350);
  const momData = await api.eval(`(()=>{
    const box = document.getElementById('momSpeech');
    const nm = box.querySelector('.speech-name');
    const ln = box.querySelector('.speech-line');
    return {
      nameText: nm.textContent,
      lineText: ln.textContent,
      nameFontSize: parseFloat(getComputedStyle(nm).fontSize),
      lineFontSize: parseFloat(getComputedStyle(ln).fontSize),
      nameWeight: getComputedStyle(nm).fontWeight,
      lineWeight: getComputedStyle(ln).fontWeight
    };
  })()`);
  console.log('Mom speech check:', momData);
  await api.shot('v4_edit1_mother_1920x1080');

  // Wait for automatic transition to Scene 2
  await api.waitFor(`window.__tiffin.Scenes.current.id === 'options' && !window.__tiffin.Scenes.busy`, 10000);
  console.log('Auto-advanced to Scene 2!');

  // Jump to Scene 3 (dishes) or click through Scene 2 quickly
  await api.waitFor(`document.getElementById('panelDiet').classList.contains('show')`, 5000);
  const vegPt = await api.eval(`(()=>{const r=document.querySelector('[data-diet="veg"]').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);
  await api.click(vegPt.x, vegPt.y);
  await api.waitFor(`document.getElementById('panelMood').classList.contains('show')`, 5000);
  const tangyPt = await api.eval(`(()=>{const r=document.querySelector('[data-mood="tangy"]').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);
  await api.click(tangyPt.x, tangyPt.y);

  console.log('=== EDIT 2: Scene 3 Dish Cards (All 4 hover, only Lemon Rice clicks & glides to centre) ===');
  await api.waitFor(`!document.getElementById('dishesChoice').hidden && document.querySelectorAll('.dish-card.in').length === 4`, 10000);
  await api.sleep(450);

  // Hover over a muted card (Tudkiya Bhath) to verify hover effect
  const tudkiyaPt = await api.eval(`(()=>{const r=document.querySelectorAll('.dish-card.is-muted')[0].getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);
  await api.move(tudkiyaPt.x, tudkiyaPt.y);
  await api.sleep(350);
  await api.shot('v4_edit2_muted_card_hover_1920x1080');

  // Click muted card -> must NOT trigger chosen state
  await api.click(tudkiyaPt.x, tudkiyaPt.y);
  await api.sleep(200);
  const mutedClicked = await api.eval(`document.getElementById('dishesChoice').classList.contains('chosen')`);
  console.log('Muted card click triggered chosen (must be false):', mutedClicked);

  // Click Lemon Rice -> verify it glides to exact centre of screen
  const lemonPt = await api.eval(`(()=>{const r=document.getElementById('cardLemonRice').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);
  await api.click(lemonPt.x, lemonPt.y);
  await api.sleep(900); // wait for 0.72s centering transition + confirm pill
  const centeredRect = await api.eval(`(()=>{
    const r = document.getElementById('cardLemonRice').getBoundingClientRect();
    return {
      centerX: Math.round(r.left + r.width / 2),
      centerY: Math.round(r.top + r.height / 2),
      viewportCenterX: Math.round(innerWidth / 2),
      viewportCenterY: Math.round(innerHeight / 2)
    };
  })()`);
  console.log('Lemon Rice centred position after click:', centeredRect);
  await api.shot('v4_edit2_lemon_rice_centred_1920x1080');

  // Wait for auto-transition to Scene 4 Kitchen, then click Skip
  await api.waitFor(`window.__tiffin.Scenes.current.id === 'kitchen' && !window.__tiffin.Scenes.busy`, 6000);
  const skipPt = await api.eval(`(()=>{const r=document.getElementById('kSkipBtn').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);
  await api.click(skipPt.x, skipPt.y);
  await api.sleep(1000);
  await api.click(960, 540); // advance to Title scene
  await api.waitFor(`window.__tiffin.Scenes.current.id === 'title'`, 5000);
  await api.eval(`(()=>{const v=document.getElementById('titleVideo1'); v.currentTime = Math.max(0, v.duration - 0.25);})()`);
  await api.waitFor(`document.getElementById('hint').classList.contains('show')`, 5000);
  await api.click(960, 540); // play titleVideo2 -> auto-advance to School scene
  await api.waitFor(`window.__tiffin.Scenes.current.id === 'school' && !window.__tiffin.Scenes.busy`, 8000);
  await api.sleep(500);

  console.log('=== EDIT 3: Scene 5 School Scene (Logo top-left, 5 always-visible names, 5 hover cards matching still 6) ===');
  const schoolInfo = await api.eval(`({
    logoVisible: document.getElementById('schoolLogo').getBoundingClientRect().width > 50,
    logoRect: document.getElementById('schoolLogo').getBoundingClientRect(),
    names: [...document.querySelectorAll('.student-name-tag')].map(el => el.textContent),
    scrollUnlocked: document.body.classList.contains('school-unlocked')
  })`);
  console.log('School scene info:', schoolInfo);
  await api.shot('v4_edit3_school_overview_1920x1080');

  // Test hovering each of the 5 students and capture their hover cards
  const studentCoords = [
    ['boy2',  530, 420, 'Anubhav'],
    ['main',  785, 430, 'Amogh'],
    ['boy3',  900, 320, 'Jash'],
    ['girl1', 1050, 380, 'Suhani'],
    ['girl2', 1240, 500, 'Keya'],
  ];
  for (const [key, sx, sy, expectedName] of studentCoords) {
    const pt = await api.S(sx, sy);
    await api.move(pt.x, pt.y);
    await api.sleep(320);
    const cardData = await api.eval(`({
      show: document.getElementById('studentHoverCard').classList.contains('show'),
      state: document.getElementById('shcState').textContent,
      dish: document.getElementById('shcDish').textContent,
      rect: document.getElementById('studentHoverCard').getBoundingClientRect()
    })`);
    console.log(`Hover ${expectedName} (${key}):`, cardData);
    await api.shot(`v4_edit3_hover_${expectedName}`);
  }

  console.log('=== EDIT 4 & 5: Scrollable States Section (28 States, 8 UTs, Search, Mizoram 5-dish Accordion) & Footer ===');
  await api.eval(`document.getElementById('statesSection').scrollIntoView({ behavior: 'instant' })`);
  await api.sleep(400);
  const statesInfo = await api.eval(`({
    statesCount: document.querySelectorAll('#gridStates .state-item').length,
    utCount: document.querySelectorAll('#gridUTs .state-item').length,
    firstState: document.querySelector('#gridStates .state-item')?.dataset.state,
    lastState: [...document.querySelectorAll('#gridStates .state-item')].pop()?.dataset.state
  })`);
  console.log('States section counts:', statesInfo);
  await api.shot('v4_edit4_states_section_1920x1080');

  // Test search bar filtering: type "mizo"
  await api.eval(`(()=>{
    const inp = document.getElementById('stateSearchInput');
    inp.value = '  MIZO ';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await api.sleep(300);
  const searchMizo = await api.eval(`({
    visibleStates: [...document.querySelectorAll('#gridStates .state-item:not([hidden])')].map(b => b.dataset.state),
    utGroupHidden: document.getElementById('groupUTs').hidden,
    clearBtnVisible: !document.getElementById('stateSearchClear').hidden
  })`);
  console.log('Search "  MIZO " result:', searchMizo);
  await api.shot('v4_edit4_search_mizoram');

  // Click Mizoram from the search results to open its State Card
  const mizoPt = await api.eval(`(()=>{const r=document.querySelector('[data-state="Mizoram"]').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);
  await api.click(mizoPt.x, mizoPt.y);
  await api.sleep(450);
  const mizoModal = await api.eval(`({
    open: !document.getElementById('stateModal').hidden && document.getElementById('stateModal').classList.contains('show'),
    title: document.getElementById('stateModalTitle').textContent,
    dishes: [...document.querySelectorAll('#stateModalBody .dish-acc-name')].map(el => el.textContent),
    openCountInitial: document.querySelectorAll('#stateModalBody .dish-acc-item.open').length
  })`);
  console.log('Mizoram modal initial state:', mizoModal);
  await api.shot('v4_edit4_mizoram_card_closed');

  // Click first dish ("Bai") to open accordion
  await api.eval(`document.querySelectorAll('#stateModalBody .dish-acc-trigger')[0].click()`);
  await api.sleep(450);
  await api.shot('v4_edit4_mizoram_dish1_bai_open');

  // Click second dish ("Vawksa Rep") -> first dish must close, second dish opens
  await api.eval(`document.querySelectorAll('#stateModalBody .dish-acc-trigger')[1].click()`);
  await api.sleep(450);
  const accCheck = await api.eval(`({
    openIndices: [...document.querySelectorAll('#stateModalBody .dish-acc-item')].map((el, i) => el.classList.contains('open') ? i : -1).filter(i => i >= 0)
  })`);
  console.log('Accordion single-open check after clicking dish 2:', accCheck);
  await api.shot('v4_edit4_mizoram_dish2_vawksa_open');

  // Close Mizoram card via Escape key
  await api.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await api.sleep(400);
  console.log('Mizoram modal hidden after Escape:', await api.eval(`document.getElementById('stateModal').hidden`));

  // Test empty search ("zzzz") -> shows "No state found"
  await api.eval(`(()=>{
    const inp = document.getElementById('stateSearchInput');
    inp.value = 'zzzz';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await api.sleep(250);
  console.log('Empty search message shown:', await api.eval(`!document.getElementById('statesEmptyMsg').hidden`));
  await api.shot('v4_edit4_search_empty');

  // Clear search via Clear (×) button
  await api.eval(`document.getElementById('stateSearchClear').click()`);
  await api.sleep(250);

  // Click another state (e.g., Bihar) -> must show "Recipes coming soon"
  await api.eval(`document.querySelector('[data-state="Bihar"]').click()`);
  await api.sleep(450);
  const biharModal = await api.eval(`({
    title: document.getElementById('stateModalTitle').textContent,
    comingSoonText: document.querySelector('#stateModalBody .state-coming-soon-title')?.textContent
  })`);
  console.log('Bihar modal state:', biharModal);
  await api.shot('v4_edit4_other_state_coming_soon');
  await api.eval(`document.getElementById('stateModalClose').click()`);
  await api.sleep(400);

  // Scroll to Footer & verify QR code and Instagram links
  await api.eval(`document.getElementById('siteFooter').scrollIntoView({ behavior: 'instant' })`);
  await api.sleep(400);
  const footerInfo = await api.eval(`({
    qrLoaded: document.querySelector('.footer-qr-box img').complete && document.querySelector('.footer-qr-box img').naturalWidth > 100,
    igLinks: [...document.querySelectorAll('.footer-ig-link')].map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href'),
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel')
    }))
  })`);
  console.log('Footer verification:', footerInfo);
  await api.shot('v4_edit5_footer_1920x1080');

  // Check responsive mobile width (390x844) for States section and Footer
  await api.resize(390, 844);
  await api.eval(`document.getElementById('statesSection').scrollIntoView({ behavior: 'instant' })`);
  await api.sleep(300);
  await api.shot('v4_edit4_states_mobile_390x844');
  await api.eval(`document.getElementById('siteFooter').scrollIntoView({ behavior: 'instant' })`);
  await api.sleep(300);
  await api.shot('v4_edit5_footer_mobile_390x844');
  await api.resize(1920, 1080);
}
