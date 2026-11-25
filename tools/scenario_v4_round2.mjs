// QA verification for School Scene (no name labels, conversational speech bubbles, staggered entrance, logo backing) & Footer QR code
export default async function(api) {
  console.log('=== 1. Testing Smooth Staggered Entrance from Title Scene 2 -> School Scene ===');
  await api.open('?scene=title');
  await api.waitFor(`document.getElementById('loader').classList.contains('done')`, 15000);
  await api.sleep(400);

  // Seek titleVideo1 near end so it freezes
  await api.eval(`(()=>{const v=document.getElementById('titleVideo1'); v.currentTime = Math.max(0, v.duration - 0.25);})()`);
  await api.waitFor(`document.getElementById('hint').classList.contains('show')`, 5000);

  // Tap to start titleVideo2
  await api.click(960, 540);
  // Wait until #scene-school becomes active (at t >= 2.75s of titleVideo2)
  await api.waitFor(`document.getElementById('scene-school').classList.contains('active')`, 6000);

  // Check immediately at the start of entrance: isReady must be false (not hoverable/clickable yet!)
  const entranceStart = await api.eval(`({
    entering: document.getElementById('scene-school').classList.contains('entering'),
    isReady: window.__tiffin.Scenes.list.school._debug.isReady,
    nameTagsExist: !!document.getElementById('studentNames')
  })`);
  console.log('Entrance start state:', entranceStart);
  await api.sleep(320); // mid-stagger snapshot
  await api.shot('v4_round2_school_mid_entrance');

  // Wait for entrance to complete (~1.38s total)
  await api.waitFor(`window.__tiffin.Scenes.list.school._debug.isReady === true`, 5000);
  await api.sleep(200);
  const entranceDone = await api.eval(`({
    readyClass: document.getElementById('scene-school').classList.contains('ready'),
    logoCardRect: document.getElementById('schoolLogoCard').getBoundingClientRect(),
    logoImgRect: document.getElementById('schoolLogo').getBoundingClientRect(),
    hintVisible: getComputedStyle(document.getElementById('scrollDownHint')).opacity
  })`);
  console.log('Entrance complete state:', entranceDone);
  await api.shot('v4_round2_school_ready_1920x1080');

  console.log('=== 2. Testing Conversational Speech Bubbles on All 5 Students across 4 Resolutions ===');
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
    await api.sleep(340);
    const boxInfo = await api.eval(`(()=>{
      const c = document.getElementById('studentHoverCard');
      const r = c.getBoundingClientRect();
      return {
        show: c.classList.contains('show'),
        name: document.getElementById('shcName').textContent,
        state: document.getElementById('shcState').textContent,
        line: document.getElementById('shcLine').textContent,
        tail: c.dataset.tail,
        inViewport: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
        rect: { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom) }
      };
    })()`);
    console.log(`Hover ${expectedName} (1920x1080):`, boxInfo);
    await api.shot(`v4_round2_hover_${expectedName}_1920x1080`);
  }

  // Verify all 5 boxes stay inside the viewport at 1536x864, 1366x768, and 1440x900
  for (const [w, h] of [[1536, 864], [1366, 768], [1440, 900]]) {
    await api.resize(w, h);
    for (const [key, sx, sy, expectedName] of studentCoords) {
      const pt = await api.S(sx, sy);
      await api.move(pt.x, pt.y);
      await api.sleep(220);
      const check = await api.eval(`(()=>{
        const r = document.getElementById('studentHoverCard').getBoundingClientRect();
        return {
          inViewport: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
          rect: { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom) }
        };
      })()`);
      console.log(`Hover ${expectedName} (${w}x${h}):`, check);
      if (w === 1440 && (expectedName === 'Anubhav' || expectedName === 'Keya')) {
        await api.shot(`v4_round2_hover_${expectedName}_${w}x${h}`);
      }
    }
  }
  await api.resize(1920, 1080);

  // Verify clicking Amogh still opens the PDF popup
  const amoghPt = await api.S(785, 430);
  await api.click(amoghPt.x, amoghPt.y);
  await api.sleep(400);
  console.log('Clicking Amogh opened PDF modal:', await api.eval(`!document.getElementById('pdfModal').hidden`));
  await api.eval(`document.getElementById('pdfClose').click()`);
  await api.sleep(400);

  console.log('=== 3. Testing Footer Larger Pure-White QR Code (Desktop & Mobile) ===');
  await api.eval(`document.getElementById('siteFooter').scrollIntoView({ behavior: 'instant' })`);
  await api.sleep(350);
  const qrDesktop = await api.eval(`(()=>{
    const box = document.querySelector('.footer-qr-box');
    const img = box.querySelector('img');
    const br = box.getBoundingClientRect();
    const cs = getComputedStyle(box);
    return {
      boxWidth: Math.round(br.width),
      boxHeight: Math.round(br.height),
      padding: cs.padding,
      bg: cs.backgroundColor,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    };
  })()`);
  console.log('Footer QR Desktop (1920x1080):', qrDesktop);
  await api.shot('v4_round2_footer_qr_1920x1080');

  await api.resize(390, 844);
  await api.eval(`document.getElementById('siteFooter').scrollIntoView({ behavior: 'instant' })`);
  await api.sleep(350);
  const qrMobile = await api.eval(`(()=>{
    const box = document.querySelector('.footer-qr-box');
    const br = box.getBoundingClientRect();
    return { boxWidth: Math.round(br.width), boxHeight: Math.round(br.height) };
  })()`);
  console.log('Footer QR Mobile (390x844):', qrMobile);
  await api.shot('v4_round2_footer_qr_mobile_390x844');
}
