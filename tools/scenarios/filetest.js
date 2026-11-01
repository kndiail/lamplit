/* file:// 直接打开的可用性验证 */
module.exports = async (h) => {
  await h.goto('file:///D:/项目/像素游戏/index.html');
  await h.wait(2000);
  console.log('state', await h.eval('window.LAMPLIT && LAMPLIT.state'));
  console.log('font', await h.eval('document.fonts.check("12px Zpix")'));
  await h.key('Enter');
  await h.wait(500);
  console.log('play state', await h.eval('LAMPLIT.state'), 'time', await h.eval('+LAMPLIT.runTime.toFixed(1)'));
  await h.shot('shots/final/fileproto.png');
};
