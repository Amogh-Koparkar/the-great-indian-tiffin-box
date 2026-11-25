// Scenario A: static look of each scene + first-run flow of the intro
export default async (t) => {
  await t.open('index.html');
  await t.waitFor(`document.getElementById('loader').classList.contains('done')`);
  await t.sleep(300);  await t.shot('a1_intro_fade_start');
  await t.sleep(3500); await t.shot('a2_intro_revealed');
  console.log('hint:', await t.eval(`document.getElementById('hint').textContent`));
  await t.click(960, 540);                         // tap → video plays
  await t.sleep(1500); await t.shot('a3_intro_mid');
  await t.sleep(4500); await t.shot('a4_intro_settled');
  console.log('caption shown:', await t.eval(`document.getElementById('introCaption').classList.contains('show')`));
  await t.click(960, 540);                         // → options
  await t.sleep(4200); await t.shot('a5_options_diet');
  console.log('active scene:', await t.eval(`__tiffin.Scenes.current.id`));
};
