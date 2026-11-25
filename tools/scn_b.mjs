// Scenario B: Options -> Kitchen (hover tooltips, IK arm, pouring all 6 bowls) -> Title -> School -> PDF -> Replay
export default async (t) => {
  await t.open('index.html?scene=options');
  await t.waitFor(`document.getElementById('loader').classList.contains('done')`);
  await t.sleep(2200);
  await t.shot('b1_options_diet');

  // Click Veg (after panelDiet is visible)
  await t.waitFor(`document.getElementById('panelDiet').classList.contains('show')`);
  await t.eval(`document.querySelector('[data-diet="veg"]').click()`);
  await t.waitFor(`document.getElementById('panelMood').classList.contains('show')`);
  await t.sleep(300);
  await t.shot('b2_options_mood');
  console.log('diet state:', await t.eval(`__tiffin.State.diet`));

  // Click Tangy and wait for kitchen scene to become active
  await t.eval(`document.querySelector('[data-mood="tangy"]').click()`);
  await t.waitFor(`__tiffin.Scenes.current.id === 'kitchen' && !__tiffin.Scenes.busy`, 8000);
  await t.sleep(300);
  await t.shot('b3_kitchen_initial');
  console.log('mood state:', await t.eval(`__tiffin.State.mood`), 'scene:', await t.eval(`__tiffin.Scenes.current.id`));

  // Test hover over rice bowl
  const ricePt = await t.S(239, 451);
  await t.move(ricePt.x, ricePt.y);
  await t.sleep(400);
  await t.shot('b4_kitchen_hover_rice');
  console.log('tooltip text:', await t.eval(`document.getElementById('tooltip').innerText`));

  // Test picking up rice bowl and dragging toward pan (check background blur)
  await t.down(ricePt.x, ricePt.y);
  await t.sleep(300);
  const midPt = await t.S(600, 400);
  await t.move(midPt.x, midPt.y);
  await t.sleep(450);
  await t.shot('b5_kitchen_holding_blurred');
  console.log('counter blurred:', await t.eval(`document.getElementById('kCounter').classList.contains('blurred')`));

  // Move over pan and release to pour
  const panPt = await t.S(935, 312);
  await t.move(panPt.x, panPt.y);
  await t.sleep(400);
  await t.up(panPt.x, panPt.y);
  await t.sleep(2400);
  await t.shot('b6_kitchen_after_1_bowl');
  console.log('bowlsAdded after 1:', await t.eval(`__tiffin.State.bowlsAdded`));

  // Pour the remaining 5 bowls (oil, masala, onion, lemon, nuts)
  const remaining = [
    [586, 986], // oil
    [185, 725], // masala
    [453, 688], // onion
    [515, 833], // lemon
    [261, 953], // nuts
  ];
  for (const [bx, by] of remaining) {
    const bp = await t.S(bx, by);
    await t.move(bp.x, bp.y);
    await t.sleep(150);
    await t.down(bp.x, bp.y);
    await t.sleep(180);
    await t.move(panPt.x, panPt.y);
    await t.sleep(250);
    await t.up(panPt.x, panPt.y);
    await t.sleep(2300);
  }
  await t.shot('b7_kitchen_all_6_done');
  console.log('bowlsAdded after 6:', await t.eval(`__tiffin.State.bowlsAdded`));

  // Tap to transition to Title scene
  await t.click(960, 540);
  await t.sleep(3200);
  await t.shot('b8_title_mid_slowmo');
  await t.sleep(3500);
  await t.shot('b9_title_settled');
  console.log('title scene:', await t.eval(`__tiffin.Scenes.current.id`));

  // Tap to trigger handCover transition to School scene
  await t.click(960, 540);
  await t.sleep(3000);
  await t.shot('b10_school_initial');
  console.log('school scene:', await t.eval(`__tiffin.Scenes.current.id`));

  // Hover Bihar student (boy2: 538, 600)
  const biharPt = await t.S(538, 600);
  await t.move(biharPt.x, biharPt.y);
  await t.sleep(400);
  await t.shot('b11_school_hover_bihar');
  console.log('student label:', await t.eval(`document.getElementById('studentLabel').textContent`));

  // Hover and click main boy (790, 700) -> opens PDF popup
  const mainPt = await t.S(790, 700);
  await t.move(mainPt.x, mainPt.y);
  await t.sleep(350);
  await t.click(mainPt.x, mainPt.y);
  await t.sleep(800);
  await t.shot('b12_school_pdf_modal');
  console.log('pdf modal open:', await t.eval(`!document.getElementById('pdfModal').hidden`));
};
