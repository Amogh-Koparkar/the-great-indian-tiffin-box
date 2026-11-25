// Scenario Geograph: Verify all text across Scenes 1-5 and PDF popup uses Geograph (400 & 700)
export default async (t) => {
  const checkSelector = async (sel) => {
    return await t.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(sel)});
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        fontSize: cs.fontSize,
        width: Math.round(r.width),
        height: Math.round(r.height),
        text: el.textContent.trim().slice(0, 40)
      };
    })()`);
  };

  // Scene 1
  await t.open('index.html');
  console.log('loader-title:', await checkSelector('.loader-title'));
  console.log('loader-note:', await checkSelector('#loaderNote'));
  await t.waitFor(`document.getElementById('loader').classList.contains('done')`);
  await t.sleep(3200);
  await t.shot('v2_s1_initial');
  console.log('hint s1:', await checkSelector('#hint'));
  console.log('fonts loaded:', await t.eval(`Array.from(document.fonts).map(f => f.family + ':' + f.weight + ':' + f.status)`));

  // Tap to trigger rumble + speech bubble
  await t.click(960, 540);
  await t.sleep(4200);
  await t.shot('v2_s1_speech');
  console.log('rumble-sfx:', await checkSelector('.rumble-sfx'));
  console.log('speech-line:', await checkSelector('.speech-line'));

  // Scene 2: Options
  await t.open('index.html?scene=options');
  await t.waitFor(`document.getElementById('panelDiet').classList.contains('show')`);
  await t.sleep(300);
  await t.shot('v2_s2_diet');
  console.log('palm-title diet:', await checkSelector('#panelDiet .palm-title'));
  console.log('btn veg:', await checkSelector('[data-diet="veg"]'));
  console.log('btn non-veg:', await checkSelector('[data-diet="non-veg"]'));

  await t.eval(`document.querySelector('[data-diet="veg"]').click()`);
  await t.waitFor(`document.getElementById('panelMood').classList.contains('show')`);
  await t.sleep(300);
  await t.shot('v2_s2_mood');
  console.log('palm-title mood:', await checkSelector('#panelMood .palm-title'));
  console.log('btn spicy:', await checkSelector('[data-mood="spicy"]'));
  console.log('btn crunchy:', await checkSelector('[data-mood="crunchy"]'));

  // Scene 3: Kitchen
  await t.open('index.html?scene=kitchen');
  await t.waitFor(`document.getElementById('loader').classList.contains('done')`);
  await t.sleep(500);
  const masalaPt = await t.S(185, 725);
  await t.move(masalaPt.x, masalaPt.y);
  await t.sleep(350);
  await t.shot('v2_s3_tooltip');
  console.log('rc-kicker:', await checkSelector('.rc-kicker'));
  console.log('rc-title:', await checkSelector('.rc-title'));
  console.log('rc-meta:', await checkSelector('.rc-meta'));
  console.log('rc-count:', await checkSelector('.rc-count'));
  console.log('tooltip title:', await checkSelector('#tooltip .tt-title'));
  console.log('tooltip li:', await checkSelector('#tooltip li'));
  console.log('tooltip b:', await checkSelector('#tooltip li b'));
  console.log('dropHint:', await checkSelector('#dropHint span'));
  console.log('kDone:', await checkSelector('#kDone span'));

  // Scene 4: Title
  await t.open('index.html?scene=title');
  await t.waitFor(`document.getElementById('loader').classList.contains('done')`);
  await t.sleep(6400);
  await t.shot('v2_s4_title');
  console.log('titleHeading:', await checkSelector('#titleHeading'));
  console.log('about-kicker:', await checkSelector('.about-kicker'));
  console.log('aboutBox p:', await checkSelector('#aboutBox p'));
  console.log('aboutBox b:', await checkSelector('#aboutBox p b'));

  // Scene 5: School + PDF
  await t.open('index.html?scene=school');
  await t.waitFor(`document.getElementById('loader').classList.contains('done')`);
  await t.sleep(400);
  const hpPt = await t.S(900, 320);
  await t.move(hpPt.x, hpPt.y);
  await t.sleep(350);
  await t.shot('v2_s5_hover_hp');
  console.log('studentLabel:', await checkSelector('#studentLabel'));
  console.log('replayBtn:', await checkSelector('#replayBtn'));

  const mainPt = await t.S(770, 460);
  await t.click(mainPt.x, mainPt.y);
  await t.sleep(600);
  await t.shot('v2_s5_pdf');
  console.log('pdf-name:', await checkSelector('.pdf-name'));
  console.log('pdfPrint:', await checkSelector('#pdfPrint'));
  console.log('pdfDownload:', await checkSelector('#pdfDownload'));
  console.log('pdfClose:', await checkSelector('#pdfClose'));
};
