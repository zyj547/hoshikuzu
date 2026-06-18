// ==========================================================================
// 情境化事件内容库：纯数据。扩充事件只需往本数组追加一个对象。
// 引擎见 event-engine.js；条件/效果字段契约见该文件与本子系统设计文档。
//   条件: minTeam/maxTeam, requiresRole, minFunds/maxFunds, minFans/maxFans,
//         background, minStage/maxStage（全部可选，留空=任意状态）
//   效果: funds/fans/rp, moraleAll/fatigueAll, targetMorale/targetFatigue,
//         targetStat:{code/art/design}, chance:{p,then,else}
//   占位符: {artist}{programmer}{designer}{target}（用到则须设 target 字段）
// ==========================================================================
const STUDIO_EVENTS = [
    // —— 单人独狼（maxTeam:1）——
    {
        id: "solo_allnight", category: "solo", weight: 12, cond: { maxTeam: 1 },
        title: "凌晨四点的工作室",
        desc: "整个工作室只有你一个人，咖啡见底，bug 还在。你盯着屏幕，怀疑这条路到底走不走得通。",
        choices: [
            { text: "硬撑通宵，把它修完", effects: { fatigueAll: +12, rp: +3 }, feedback: "熬出了成果，但人也累垮了。" },
            { text: "睡了，明天再说", effects: { fatigueAll: -8 }, feedback: "休息一晚，状态回来一些。" }
        ]
    },
    {
        id: "solo_outsource_lure", category: "solo", weight: 8, cond: { maxTeam: 1 },
        title: "外包的诱惑",
        desc: "有人发来一个外包私活，钱不少，但会占掉你做自己游戏的时间。",
        choices: [
            { text: "接了，先赚点现金流", effects: { funds: +6000, rp: -4 }, feedback: "钱到账，但项目进度搁置了。" },
            { text: "拒绝，专注自己的游戏", effects: { rp: +2, fans: +30 }, feedback: "坚持初心，社区里有人默默关注你。" }
        ]
    },
    {
        id: "solo_selfdoubt", category: "solo", weight: 8, cond: { maxTeam: 1 },
        title: "深夜的自我怀疑",
        desc: "你刷到别人的游戏又火了，再看看自己手里这个半成品，突然有点撑不住。",
        choices: [
            { text: "翻出最初的设计稿，给自己打打气", effects: { moraleAll: +8 }, feedback: "重新找回了一点初心。" },
            { text: "化焦虑为动力，连夜赶进度", effects: { rp: +2, fatigueAll: +5 }, feedback: "情绪憋成了产出，但也更累了。" }
        ]
    },
    {
        id: "solo_first_fan", category: "solo", weight: 8, cond: { maxTeam: 1 },
        title: "第一条玩家好评",
        desc: "一位陌生玩家留言：『这个小游戏让我开心了一整晚，谢谢你做出来。』",
        choices: [
            { text: "认真回复，并把好评截图存起来", effects: { fans: +50, moraleAll: +6 }, feedback: "被认可的感觉，比什么都顶用。" },
            { text: "默默把它当成做得更好的动力", effects: { rp: +3 }, feedback: "你把感动转化成了灵感。" }
        ]
    },

    // —— 团队管理（minTeam:3）——
    {
        id: "team_building", category: "team", weight: 10, cond: { minTeam: 3 },
        title: "要不要办个团建",
        desc: "项目压了大家好几周，有人小声提议：是不是该出去搓一顿、放松放松？",
        choices: [
            { text: "包场聚餐 + 剧本杀，好好犒劳团队", effects: { funds: -3000, moraleAll: +12 }, feedback: "笑闹一晚，团队气氛肉眼可见地回暖。" },
            { text: "项目要紧，团建以后再说", effects: { moraleAll: -4 }, feedback: "大家嘴上没说什么，但有点失落。" }
        ]
    },
    {
        id: "team_friction", category: "team", weight: 10, cond: { minTeam: 3 },
        title: "两人闹掰了",
        desc: "工作室里两位同事因为一个实现方案吵了起来，谁也不让谁，气氛一度很僵。",
        choices: [
            { text: "把两人叫到一起，耐心当和事佬", effects: { moraleAll: +6 }, feedback: "误会说开，大家又能好好做事了。" },
            { text: "让他们自己冷静，先不插手", effects: { moraleAll: -8 }, feedback: "矛盾没解开，整个团队都受了影响。" }
        ]
    },
    {
        id: "team_raise_request", category: "team", weight: 9, cond: { minTeam: 3 },
        title: "有人来谈加薪",
        desc: "一位干得不错的同事敲门进来，委婉地表达：能不能涨点工资？",
        choices: [
            { text: "认可贡献，给他加薪", effects: { funds: -2000, moraleAll: +8 }, feedback: "被看见的人更卖力，团队也更安心。" },
            { text: "现在预算紧，先婉拒", effects: { moraleAll: -6 }, feedback: "他点点头出去了，但情绪明显低了下来。" }
        ]
    },
    {
        id: "team_poach", category: "team", weight: 7, cond: { minTeam: 3 },
        title: "有人被挖墙脚",
        desc: "大厂向你的一名骨干抛了橄榄枝，开的价你很难比。他来征求你的意见。",
        choices: [
            { text: "诚意挽留，咬牙涨薪", effects: { funds: -2500, moraleAll: +5 }, feedback: "他被留住了，团队松了口气。" },
            { text: "祝福他，放他去更大的舞台", effects: { moraleAll: -5 }, feedback: "好聚好散，但少了个熟手总归遗憾。" }
        ]
    },

    // —— 程序向（requiresRole:"programmer"）——
    {
        id: "core_crash", category: "programmer", weight: 10, cond: { requiresRole: "programmer" }, target: "programmer",
        title: "核心代码大崩溃",
        desc: "深夜里 {programmer} 发现服务器接口整个崩了，脸都白了。",
        choices: [
            { text: "花 ¥4,000 买云备份组件秒修", effects: { funds: -4000 }, feedback: "危机解除，{programmer} 松了口气。" },
            { text: "让 {programmer} 通宵硬扛", effects: { targetStat: { code: -2 }, targetFatigue: +20, chance: { p: 0.4, then: { fans: -100 }, else: {} } }, feedback: "修是修好了，但 {programmer} 元气大伤。" }
        ]
    },
    {
        id: "tech_debt", category: "programmer", weight: 9, cond: { requiresRole: "programmer" }, target: "programmer",
        title: "技术债到期了",
        desc: "{programmer} 摊牌：之前赶工留下的烂摊子已经拖累开发，再不重构迟早出大事。",
        choices: [
            { text: "排期重构，长痛不如短痛", effects: { rp: +5, targetFatigue: +10 }, feedback: "{programmer} 埋头梳理，代码终于清爽了。" },
            { text: "先扛着，等忙完这阵再说", effects: { chance: { p: 0.4, then: { targetStat: { code: -1 } }, else: {} } }, feedback: "债越欠越多，但愿别在关键时刻爆雷。" }
        ]
    },
    {
        id: "genius_refactor", category: "programmer", weight: 6, cond: { requiresRole: "programmer" }, target: "programmer",
        title: "灵感爆发",
        desc: "{programmer} 两眼放光：『我想到一个绝妙的架构，能让整个项目脱胎换骨！』",
        choices: [
            { text: "给他空间，放手去搞", effects: { targetStat: { code: +3 }, targetMorale: +8 }, feedback: "{programmer} 一气呵成，技术实力更上一层。" },
            { text: "求稳，按原计划来", effects: { targetMorale: -4 }, feedback: "{programmer} 的兴头被浇灭了一些。" }
        ]
    },

    // —— 美术向（requiresRole:"artist"）——
    {
        id: "art_style_war", category: "artist", weight: 10, cond: { requiresRole: "artist" }, target: "artist",
        title: "画风之争",
        desc: "{artist} 坚持自己的画风，而你担心市场不买账。气氛有点僵。",
        choices: [
            { text: "尊重 {artist} 的判断", effects: { targetMorale: +12, chance: { p: 0.5, then: { fans: +120 }, else: { fans: -60 } } }, feedback: "你放手一搏，{artist} 干劲十足。" },
            { text: "要求按市场口味改", effects: { targetMorale: -10, fans: +40 }, feedback: "稳妥但 {artist} 有些失落。" }
        ]
    },
    {
        id: "art_outsource_fail", category: "artist", weight: 8, cond: { requiresRole: "artist" }, target: "artist",
        title: "外包画稿翻车了",
        desc: "图省事找的外包交了一批画风崩坏的稿子，临近节点，只能靠 {artist} 救火。",
        choices: [
            { text: "请 {artist} 加班返工，保住品质", effects: { targetFatigue: +15, fans: +60 }, feedback: "{artist} 连夜重画，质量总算稳住。" },
            { text: "将就上线，省一点是一点", effects: { fans: -80 }, feedback: "玩家一眼看穿了画风的违和，口碑受损。" }
        ]
    },
    {
        id: "art_stolen", category: "artist", weight: 7, cond: { requiresRole: "artist" }, target: "artist",
        title: "原画被白嫖",
        desc: "{artist} 发现自己的原画被某账号盗用赚流量，连署名都抹掉了。",
        choices: [
            { text: "公开维权，替 {artist} 讨个说法", effects: { fans: +150, targetMorale: +10 }, feedback: "正义之声引来一片声援，{artist} 很感激。" },
            { text: "多一事不如少一事，忍了", effects: { targetMorale: -12 }, feedback: "{artist} 心里堵得慌，士气低落。" }
        ]
    },

    // —— 策划向（requiresRole:"designer"）——
    {
        id: "design_scrap", category: "designer", weight: 9, cond: { requiresRole: "designer" }, target: "designer",
        title: "想推翻重做",
        desc: "{designer} 找到你：『现在这套玩法我越做越别扭，我想推翻重来。』",
        choices: [
            { text: "相信他的判断，支持重做", effects: { rp: +4, targetFatigue: +12 }, feedback: "{designer} 大刀阔斧，玩法骨架焕然一新。" },
            { text: "进度要紧，维持现状", effects: { targetMorale: -6 }, feedback: "{designer} 憋着一口气，继续硬着头皮做。" }
        ]
    },
    {
        id: "design_numbers_flamed", category: "designer", weight: 8, cond: { requiresRole: "designer" }, target: "designer",
        title: "数值被喷上热搜",
        desc: "玩家在论坛炸开了锅，说 {designer} 设计的数值劝退新手，体验稀烂。",
        choices: [
            { text: "连夜复盘，重调数值", effects: { targetFatigue: +10, fans: +50 }, feedback: "{designer} 通宵打磨，玩家逐渐回心转意。" },
            { text: "嘴硬不改，相信自己的设计", effects: { fans: -100 }, feedback: "固执的回应火上浇油，玩家流失了一批。" }
        ]
    },
    {
        id: "design_inspiration", category: "designer", weight: 7, cond: { requiresRole: "designer" }, target: "designer",
        title: "半夜来的灵感",
        desc: "{designer} 半夜发消息：『我想到一个超棒的机制，必须现在记下来！』",
        choices: [
            { text: "陪他把灵感梳理成方案", effects: { rp: +5, targetMorale: +6 }, feedback: "灵光被牢牢抓住，{designer} 成就感满满。" },
            { text: "让他先睡，明天再聊", effects: { targetFatigue: -8 }, feedback: "睡了个好觉，{designer} 第二天精神饱满。" }
        ]
    },

    // —— 财务危机（maxFunds:8000）——
    {
        id: "rent_due", category: "finance_low", weight: 14, cond: { maxFunds: 8000 },
        title: "房东来催租了",
        desc: "账上没剩多少钱，房东却发来消息：这个月的租金该交了。",
        choices: [
            { text: "咬牙先把租金交了", effects: { funds: -3000 }, feedback: "勉强稳住了门面。" },
            { text: "厚着脸皮求宽限几天", effects: { moraleAll: -5, chance: { p: 0.5, then: {}, else: { funds: -1000 } } }, feedback: "尴尬地拖了几天。" }
        ]
    },
    {
        id: "cant_pay_wages", category: "finance_low", weight: 12, cond: { maxFunds: 8000 },
        title: "快发不出工资了",
        desc: "发薪日临近，账上的钱却凑不齐全员工资。你盯着银行余额，手心冒汗。",
        choices: [
            { text: "自掏腰包垫付，绝不拖欠", effects: { funds: -4000, moraleAll: +5 }, feedback: "钱按时到账，大家对你多了几分信任。" },
            { text: "硬着头皮拖一拖工资", effects: { moraleAll: -15 }, feedback: "工资一拖，人心立刻散了一半。" }
        ]
    },
    {
        id: "loan_shark", category: "finance_low", weight: 8, cond: { maxFunds: 8000 },
        title: "送上门的高息贷款",
        desc: "一个『朋友』神秘兮兮地说，能立刻借你一笔周转金——当然，利息可不低。",
        choices: [
            { text: "签了，先渡过眼前这关", effects: { funds: +10000 }, feedback: "钱是到手了，但这是要还利息的，悠着点花。" },
            { text: "天上不会掉馅饼，拒绝", effects: { moraleAll: +3 }, feedback: "你守住了底线，团队反而踏实了些。" }
        ]
    },

    // —— 财务宽裕（minFunds:60000）——
    {
        id: "buy_equipment", category: "finance_high", weight: 10, cond: { minFunds: 60000 },
        title: "要不要升级设备",
        desc: "账上宽裕了，老旧的机器却越来越卡。有人提议：换一批新设备吧？",
        choices: [
            { text: "一步到位，全套升级", effects: { funds: -20000, rp: +6, moraleAll: +6 }, feedback: "新设备到位，效率和心情一起起飞。" },
            { text: "能用就行，钱留着过冬", effects: {}, feedback: "你选择继续精打细算。" }
        ]
    },
    {
        id: "tax_audit", category: "finance_high", weight: 8, cond: { minFunds: 60000 },
        title: "税务找上门",
        desc: "账上钱一多就显眼，税务部门来函要求核查近期的账目。",
        choices: [
            { text: "老老实实补缴税款", effects: { funds: -12000 }, feedback: "合规经营，睡得踏实。" },
            { text: "托关系想少缴一点", effects: { chance: { p: 0.5, then: {}, else: { funds: -20000, fans: -100 } } }, feedback: "你赌了一把，但愿别翻车。" }
        ]
    },
    {
        id: "expansion_offer", category: "finance_high", weight: 7, cond: { minFunds: 60000 },
        title: "该不该扩张",
        desc: "有人建议趁现金充裕大举招人、扩大规模，把摊子铺得更大。",
        choices: [
            { text: "果断扩张，搏一个未来", effects: { funds: -15000, rp: +8 }, feedback: "你押注规模化，先把底子打厚。" },
            { text: "稳扎稳打，不冒进", effects: { moraleAll: +4 }, feedback: "团队认可你的克制，氛围更稳。" }
        ]
    },

    // —— 粉丝 / 口碑（minFans:1000）——
    {
        id: "fan_art", category: "fans", weight: 10, cond: { minFans: 1000 },
        title: "雪片般的同人创作",
        desc: "粉丝们自发为你的游戏画了一大堆同人、写了同人文，热情高涨。",
        choices: [
            { text: "官方转发 + 办个小型创作比赛回馈", effects: { fans: +200, moraleAll: +6 }, feedback: "社区被点燃，团队也与有荣焉。" },
            { text: "低调地一一道谢", effects: { fans: +50 }, feedback: "真诚的感谢同样暖到了粉丝。" }
        ]
    },
    {
        id: "hater_storm", category: "fans", weight: 9, cond: { minFans: 1000 },
        title: "黑粉带节奏",
        desc: "一小撮人断章取义带起了节奏，评论区的火药味越来越浓。",
        choices: [
            { text: "正面发声，摆事实澄清", effects: { chance: { p: 0.5, then: { fans: +100 }, else: { fans: -150 } } }, feedback: "你选择直面争议，成败就看这一搏。" },
            { text: "冷处理，不予回应", effects: { fans: -40 }, feedback: "风波慢慢过去，但也掉了些粉。" }
        ]
    },
    {
        id: "media_interview", category: "fans", weight: 8, cond: { minFans: 1000 },
        title: "媒体来约专访",
        desc: "一家有影响力的游戏媒体想做一期你的独立开发故事专访。",
        choices: [
            { text: "欣然接受，讲讲一路走来的故事", effects: { fans: +250 }, feedback: "专访登出后，更多人认识了你的工作室。" },
            { text: "不太擅长露面，婉拒了", effects: {}, feedback: "你还是更想用作品说话。" }
        ]
    },
    {
        id: "crowdfund_call", category: "fans", weight: 7, cond: { minFans: 1000 },
        title: "玩家呼吁众筹",
        desc: "热心玩家在社区刷屏：『开众筹吧！我们愿意为你的下一作买单！』",
        choices: [
            { text: "顺势发起众筹", effects: { funds: +15000, fans: -50 }, feedback: "资金到位，不过也有人觉得吃相急了点。" },
            { text: "谢绝好意，靠自己稳步走", effects: { fans: +30 }, feedback: "这份克制反而赢得了更多尊重。" }
        ]
    },

    // —— 行业 / 随机（无条件）——
    {
        id: "expo_invite", category: "industry", weight: 10, cond: {},
        title: "独立游戏展会邀请",
        desc: "一个独立游戏展会向你发来摊位邀请，要交一笔参展费，但能见到玩家和媒体。",
        choices: [
            { text: "掏钱参展，搏一波曝光", effects: { funds: -5000, fans: +300 }, feedback: "现场反响不错，涨了一波粉。" },
            { text: "太贵了，这次先不去", effects: {}, feedback: "你选择按兵不动。" }
        ]
    },
    {
        id: "platform_policy", category: "industry", weight: 9, cond: {},
        title: "平台政策突变",
        desc: "你常用的发行平台连夜改了抽成规则，整个行业都在炸锅。",
        choices: [
            { text: "花时间研究新规，提前布局", effects: { rp: +4 }, feedback: "吃透规则的人，总能先一步占位。" },
            { text: "随大流，先观望一阵", effects: { moraleAll: -3 }, feedback: "不确定感在团队里弥漫了几天。" }
        ]
    },
    {
        id: "engine_update", category: "industry", weight: 8, cond: {},
        title: "引擎大版本更新",
        desc: "你用的游戏引擎发布了大版本，新特性诱人，但升级有踩坑风险。",
        choices: [
            { text: "尝鲜升级，吃到新特性红利", effects: { rp: +6, chance: { p: 0.4, then: { fans: -50 }, else: {} } }, feedback: "新特性真香，就是迁移踩了点坑。" },
            { text: "稳定压倒一切，暂不升级", effects: {}, feedback: "你选择让项目先平稳落地。" }
        ]
    },

    // —— 创始人背景专属（background 对应 FOUNDER_BACKGROUNDS 的 key）——
    {
        id: "bg_coder_hackathon", category: "background", weight: 8, cond: { background: "coder" },
        title: "黑客松评委邀请",
        desc: "作为小有名气的技术型创始人，你被邀请去一场黑客松当评委。",
        choices: [
            { text: "去，顺便结识一批硬核开发者", effects: { rp: +6, fans: +80 }, feedback: "思维碰撞带来灵感，也涨了名气。" },
            { text: "婉拒，专心自己的项目", effects: { rp: +2 }, feedback: "你把时间留给了代码。" }
        ]
    },
    {
        id: "bg_artist_exhibit", category: "background", weight: 8, cond: { background: "artist" },
        title: "个人画展邀约",
        desc: "凭着艺术大师的名头，一家画廊邀你办一场小型个人作品展。",
        choices: [
            { text: "办！让世界看到你的审美", effects: { fans: +150, funds: -3000 }, feedback: "画展惊艳全场，工作室的格调也水涨船高。" },
            { text: "把精力留给游戏本身", effects: { rp: +3 }, feedback: "你更想把美感倾注进作品里。" }
        ]
    },
    {
        id: "bg_business_deal", category: "background", weight: 8, cond: { background: "business" },
        title: "老关系牵线",
        desc: "你商业上的老朋友介绍来一笔合作，钱很实在，但要分掉你一些精力。",
        choices: [
            { text: "接下这单生意", effects: { funds: +8000 }, feedback: "人脉变现，账上又厚实了一些。" },
            { text: "婉拒，维护工作室的独立口碑", effects: { fans: +50 }, feedback: "玩家欣赏你的纯粹。" }
        ]
    },
    {
        id: "bg_veteran_mentor", category: "background", weight: 8, cond: { background: "veteran" },
        title: "后辈来求教",
        desc: "作为见过大风浪的行业老兵，一群年轻开发者慕名来向你请教。",
        choices: [
            { text: "倾囊相授，提携后辈", effects: { fans: +120, moraleAll: +4 }, feedback: "口碑在圈内传开，团队也以你为荣。" },
            { text: "时间宝贵，简单点拨两句", effects: { rp: +3 }, feedback: "三言两语，也够他们受用很久。" }
        ]
    },
    {
        id: "bg_creative_award", category: "background", weight: 8, cond: { background: "creative" },
        title: "创意奖项提名",
        desc: "你这位以脑洞著称的创始人，被一个创意大赛提名了。",
        choices: [
            { text: "认真准备，争取拿奖", effects: { fans: +130, rp: +3 }, feedback: "提名本身已是认可，团队信心大增。" },
            { text: "低调以对，重在参与", effects: { moraleAll: +5 }, feedback: "平常心，反而让大家更放松。" }
        ]
    }
];

// 浏览器全局 + Node 双模（与引擎一致，便于以后扩展/测试）
if (typeof module !== "undefined" && module.exports) module.exports = { STUDIO_EVENTS };
