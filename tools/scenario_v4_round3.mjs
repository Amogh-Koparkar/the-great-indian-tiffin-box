// QA verification for above-head name labels + hover fade-out behaviour + 158px logo on 60% backing
export default async function(api) {
  console.log('=== 1. Testing School Scene Idle State (All 5 above-head labels visible, no face overlap, 158px logo on 60% backing) ===');
  await api.open('?scene=school');
  await api.waitFor(`document.getElementById('loader').classList.contains('done')`, 15000);
  await api.waitFor(`window.__tiffin.Scenes.list.school._debug.isReady === true`, 5000);
  await api.sleep(300);

  // Move pointer to neutral corner so nobody is hovered
  await api.move(20, 1000);
  await api.sleep(250);

  const idleCheck = await api.eval(`(()=>{
    const labels = [...document.querySelectorAll('.student-head-label')].map(el => {
      const r = el.getBoundingClientRect();
      return {
        student: el.parentElement.dataset.student,
        text: el.textContent,
        opacity: getComputedStyle(el).opacity,
        rect: { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom) }
      };
    });
    const logoCard = document.getElementById('schoolLogoCard');
    const logoImg = document.getElementById('schoolLogo');
    return {
      labels,
      logoCardBg: getComputedStyle(logoCard).backgroundColor,
      logoImgOpacity: getComputedStyle(logoImg).opacity,
      logoHeight: Math.round(logoImg.getBoundingClientRect().height),
      logoCardRect: logoCard.getBoundingClientRect()
    };
  })()`);
  console.log('Idle state check (1920x1080):', JSON.stringify(idleCheck, null, 2));
  await api.shot('v4_round3_idle_all_5_labels_1920x1080');

  // Check idle state at 1536x864, 1366x768, and 1440x900
  for (const [w, h] of [[1536, 864], [1366, 768], [1440, 900]]) {
    await api.resize(w, h);
    await api.shot(`v4_round3_idle_${w}x${h}`);
  }
  await api.resize(1920, 1080);

  console.log('=== 2. Testing Hover Behaviour on Each Student (Hovered label fades to 0, other 4 stay 1, speech box shows) ===');
  const studentCoords = [
    ['boy2',  530, 420, 'Anubhav'],
    ['main',  785, 430, 'Amogh'],
    ['boy3',  935, 250, 'Jash'],
    ['girl1', 1050, 380, 'Suhani'],
    ['girl2', 1240, 500, 'Keya'],
  ];

  for (const [key, sx, sy, expectedName] of studentCoords) {
    const pt = await api.S(sx, sy);
    await api.move(pt.x, pt.y);
    await api.sleep(280);
    const hoverState = await api.eval(`(()=>{
      const labelOpacities = {};
      document.querySelectorAll('.student').forEach(st => {
        const k = st.dataset.student;
        const lbl = st.querySelector('.student-head-label');
        labelOpacities[k] = +parseFloat(getComputedStyle(lbl).opacity).toFixed(2);
      });
      return {
        hoverKey: window.__tiffin.Scenes.list.school._debug.hover,
        hoverBoxVisible: document.getElementById('studentHoverCard').classList.contains('show'),
        boxName: document.getElementById('shcName').textContent,
        labelOpacities
      };
    })()`);
    console.log(`Hovering ${expectedName} (${key}):`, hoverState);
    await api.shot(`v4_round3_hover_${expectedName}_1920x1080`);
  }

  console.log('=== 3. Testing Rapid Movement Across All 5 Students & Mouse Leave ===');
  for (const [key, sx, sy] of studentCoords) {
    const pt = await api.S(sx, sy);
    await api.move(pt.x, pt.y);
    await api.sleep(40);
  }
  // Now move off all students
  await api.move(20, 1000);
  await api.sleep(280);
  const afterLeave = await api.eval(`(()=>{
    const labelOpacities = {};
    document.querySelectorAll('.student').forEach(st => {
      labelOpacities[st.dataset.student] = +parseFloat(getComputedStyle(st.querySelector('.student-head-label')).opacity).toFixed(2);
    });
    return {
      hoverBoxVisible: document.getElementById('studentHoverCard').classList.contains('show'),
      labelOpacities
    };
  })()`);
  console.log('After rapid move + mouse leave (all 5 labels must be 1, box false):', afterLeave);
}
