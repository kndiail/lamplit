/* =========================================================
   提灯者 LAMPLIT — 剧情层
   序章 / 记忆碎片 / 看守者台词 / 结局
   ========================================================= */
(function () {
  'use strict';
  const META = window.META;

  const STORY = {};

  /* ---------------- 序章 ---------------- */
  STORY.prologue = [
    {
      title: '序 · 长夜',
      lines: [
        '太阳沉下去的那天，没有人听见声音。',
        '先是影子变长，然后是灯一盏一盏地熄灭。',
        '到最后，连「白天」这个词都成了传说。',
      ],
    },
    {
      title: '序 · 守夜人',
      lines: [
        '守夜人世代守着一盏灯。',
        '灯不照亮世界，只照亮持灯的人走过的路。',
        '他们说：只要灯还亮着，黎明就还在路上。',
      ],
    },
    {
      title: '序 · 最后一盏',
      lines: [
        '守夜人都死了。灯油只够最后一程。',
        '你接过灯，听见火苗里有人低声数着名字。',
        '你的名字也在其中——排在最后。',
      ],
    },
    {
      title: '序 · 长夜与层主',
      lines: [
        '通往黎明的路上，守着十二位层主。',
        '一位曾是灯塔，吞下了自己的守夜人。',
        '一位是长夜的母亲，从不允许谁先醒来。',
      ],
    },
    {
      title: '序 · 提灯者',
      lines: [
        '灯是你的武器，也是你的视野。',
        '走出光圈的东西，你不必害怕；',
        '走进光圈的东西，你必须杀死。',
        '——点亮它吧。',
      ],
    },
  ];

  /* ---------------- 记忆碎片 ---------------- */
  // cond: 达成条件（在 META.evaluate 中按 ctx 判定）
  STORY.fragments = [
    {
      id: 'f1', name: '第一片 · 灯油',
      hint: '活过 00:60',
      text: '灯油不是油。是守夜人临走前，从记忆里拧出来的东西。\n烧掉一段，就少记得一件事。所以守夜人总是很健忘，也很安静。',
    },
    {
      id: 'f2', name: '第二片 · 名字',
      hint: '单局击杀 120',
      text: '火苗里数名字的声音，是历代守夜人的名字。\n数到你的时候会停一下，像在确认：这一个，还活着。',
    },
    {
      id: 'f3', name: '第三片 · 灯塔',
      hint: '击杀第一位看守者',
      text: '第一位看守者曾是海边的灯塔。\n它吞下了自己的守夜人，因为那人说「我累了，让我睡一会儿」。\n灯塔没有听懂「一会儿」是什么意思，于是它一直等，等到自己也熄了。',
    },
    {
      id: 'f4', name: '第四片 · 母亲',
      hint: '见过深黯之母',
      text: '长夜不是被谁放出来的。它是所有熄灭的灯聚在一起，慢慢长出来的东西。\n所以深黯之母并不恨你。她只是不愿意再失去一个孩子。',
    },
    {
      id: 'f5', name: '第五片 · 白昼',
      hint: '在一局中拿到 6 件武器',
      text: '古书里写过白昼：光是斜着落下来的，影子很短，人会眯起眼睛。\n守夜人把这一段抄了很多遍，抄到纸都磨破了。',
    },
    {
      id: 'f6', name: '第六片 · 交换',
      hint: '累计击杀 600',
      text: '灯要亮，就得有东西烧。\n守夜人烧记忆，看守者烧自己。\n你烧的是什么，现在还不知道——但火苗数名字时，越来越短了。',
    },
    {
      id: 'f7', name: '第七片 · 门',
      hint: '通关一次',
      text: '黎明其实是一扇门，不是天亮。\n推开它的人不能再回来，因为门后面没有夜晚，也就没有灯。\n守夜人一代代接力，就是为了一直有人站在门口。',
    },
    {
      id: 'f8', name: '第八片 · 最后一程',
      hint: '收齐前七片后通关',
      text: '火苗终于数到了最后。\n它念出你的名字，然后问：这一次，要不要换你来做灯？\n你没有回答。你只是把灯举高了一点——路还很长，但已经能看见门了。',
    },
  ];

  /* ---------------- 看守者台词 ---------------- */
  STORY.quotes = {
    boss1: {
      name: '灯笼吞噬者',
      intro: [
        '「……灯……还给我……」',
        '它曾是灯塔。现在只记得饿。',
      ],
      death: [
        '「原来……你也在等人啊。」',
      ],
    },
    boss2: {
      name: '深黯之母',
      intro: [
        '「孩子，外面没有黎明。」',
        '「留下来，我把黑夜给你。」',
      ],
      death: [
        '「……那就，替我看看它。」',
      ],
    },
  };

  /* ---------------- 结局 ---------------- */
  STORY.ending = {
    death: [
      '灯熄了。',
      '火苗最后数了一遍名字，没有数到你——',
      '这一次，它数的是明天要亮起来的人。',
    ],
    win: [
      '看守者倒下，长夜让开一条缝。',
      '门在路的尽头，光从门缝里斜着落下来。',
      '你把灯放在门口，转身走进光里。',
      '——后来的人会记得：那一夜，有人提着灯走过。',
    ],
    true: [
      '八片记忆在火里一起烧起来。',
      '你终于听清了那个声音在数谁的名字。',
      '它数的是所有没能走到门口的人。',
      '你把灯举过头顶，火苗烧到了自己的影子。',
      '门开了。这一次，走进去的不只是你，',
      '还有一整条夜路上，所有熄灭过的灯。',
      '——黎明不是天亮的。是有人把自己点着了。',
    ],
  };

  /* ---------------- 存取 ---------------- */
  STORY.ensure = function (save) {
    if (!save.lore) save.lore = { seen: [], prologue: false, ending: false, trueEnding: false };
    const l = save.lore;
    if (!Array.isArray(l.seen)) l.seen = [];
    if (typeof l.prologue !== 'boolean') l.prologue = false;
    if (typeof l.ending !== 'boolean') l.ending = false;
    if (typeof l.trueEnding !== 'boolean') l.trueEnding = false;
    return save;
  };

  STORY.has = function (save, id) {
    return !!(save.lore && save.lore.seen.indexOf(id) >= 0);
  };

  STORY.unlock = function (save, id) {
    STORY.ensure(save);
    if (save.lore.seen.indexOf(id) >= 0) return false;
    save.lore.seen.push(id);
    return true;
  };

  STORY.count = function (save) {
    STORY.ensure(save);
    return save.lore.seen.length;
  };

  // 单局内可解锁的碎片（由 game.js 在事件点调用）
  STORY.checkRun = function (save, ctx) {
    const got = [];
    const add = (id) => { if (STORY.unlock(save, id)) got.push(id); };
    if (ctx.runTime >= 60) add('f1');
    if (ctx.kills >= 120) add('f2');
    if (ctx.boss1Dead) add('f3');
    if (ctx.boss2Seen) add('f4');
    if (ctx.weapons >= 6) add('f5');
    if (ctx.totalKills >= 600) add('f6');
    if (ctx.won) add('f7');
    if (ctx.won && STORY.count(save) >= 7) add('f8');
    return got;
  };

  STORY.fragmentById = function (id) {
    for (let i = 0; i < STORY.fragments.length; i++) {
      if (STORY.fragments[i].id === id) return STORY.fragments[i];
    }
    return null;
  };

  window.STORY = STORY;
})();
