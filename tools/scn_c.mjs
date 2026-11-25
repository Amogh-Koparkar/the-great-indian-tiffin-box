// Scenario C: School scene hover over all 5 students + click main boy -> PDF modal -> Close -> Replay
export default async (t) => {
  await t.open('index.html?scene=school');
  await t.waitFor(`document.getElementById('loader').classList.contains('done')`);
  await t.sleep(400);

  // Test hover over each student: boy2 (Bihar), boy3 (Himachal Pradesh), girl1 (Uttar Pradesh), girl2 (Kashmir), main (Your Lemon Rice)
  const checks = [
    ['bihar', 538, 450],
    ['himachal', 900, 320],
    ['up', 1050, 420],
    ['kashmir', 1240, 480],
    ['main', 770, 460],
  ];
  for (const [name, sx, sy] of checks) {
    const pt = await t.S(sx, sy);
    await t.move(pt.x, pt.y);
    await t.sleep(350);
    await t.shot('c_hover_' + name);
    console.log(name, 'label:', await t.eval(`document.getElementById('studentLabel').textContent`));
  }

  // Click main boy to open PDF popup
  const mainPt = await t.S(770, 460);
  await t.click(mainPt.x, mainPt.y);
  await t.sleep(800);
  await t.shot('c_pdf_open');
  console.log('pdf open:', await t.eval(`!document.getElementById('pdfModal').hidden`));

  // Click Close button
  await t.eval(`document.getElementById('pdfClose').click()`);
  await t.sleep(500);
  await t.shot('c_pdf_closed');
  console.log('pdf closed:', await t.eval(`document.getElementById('pdfModal').hidden`));

  // Click Replay button
  await t.eval(`document.getElementById('replayBtn').click()`);
  await t.sleep(3800);
  await t.shot('c_after_replay');
  console.log('after replay scene:', await t.eval(`__tiffin.Scenes.current.id`));
};
