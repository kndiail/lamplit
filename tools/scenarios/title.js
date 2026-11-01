module.exports = async (h) => {
  await h.goto();
  await h.wait(1700);
  await h.eval("(() => { try { LAMPLIT.finishStory(); } catch (e) {} if (LAMPLIT.state === 'STORY') LAMPLIT.setState('TITLE'); try { LAMPLIT.save.lore.prologue = true; } catch (e) {} return 1; })()");

  await h.wait(1500);
  console.log('state =', await h.eval('window.LAMPLIT && LAMPLIT.state'));
  console.log('font =', await h.eval('document.fonts.check("12px Zpix")'));
  await h.shot('shots/title.png');
};
