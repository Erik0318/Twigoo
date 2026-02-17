# 卡牌效果实现情况分析报告

## 一、在 cards.ts 中定义的 extraEffect 列表（62个）

| # | extraEffect | 卡牌名称 | 卡牌ID | 稀有度 | 类型 |
|---|-------------|----------|--------|--------|------|
| 1 | `ignore_shield` | 死锁苦来兮 | heavy_strike | common | attack |
| 2 | `crit_50_kill` | 黄瓜暂无数据 | null_pointer | common | attack |
| 3 | `stun_1` | 程序未响应睦 | deadlock | common | attack |
| 4 | `draw_1` | 自动修复重启 | hot_patch | common | attack |
| 5 | `bonus_per_discard_1` | 版本回退爽世 | syntax_error | common | attack |
| 6 | `reveal_intent` | 提交黑历史 | git_blame | common | attack |
| 7 | `retaliate_3` | 请重试再次 | parry | common | defense |
| 8 | `damage_half_next` | 不是Bug是特性 | try_catch | common | defense |
| 9 | `draw_1` | 后台运行不要走 | fallback | common | defense |
| 10 | `heal_5` | 恢复出厂回〇号 | rollback | common | defense |
| 11 | `draw_1` | 自动修复重启 | auto_save | common | defense |
| 12 | `next_turn_shield_5` | 已备份存档 | redundancy | common | defense |
| 13 | `discard_1` | 暂未显示潜在 | quick_think | common | skill |
| 14 | `energy_next_penalty_1` | 强推 | git_push | common | skill |
| 15 | `stash_and_draw` | 分割存档剪切线 | git_stash | common | skill |
| 16 | `reveal_intent` | 异常抛出为什么 | debug | common | skill |
| 17 | `next_attack_plus_4` | 定时刷新轮符雨 | breakpoint_debug | common | skill |
| 18 | `copy_1_hand` | 已取消结束 | ctrl_c | common | skill |
| 19 | `recover_1_discard` | 粘贴失败爱音 | ctrl_v | common | skill |
| 20 | `discard_all_damage_per_3` | 关服解散 | rm_rf | common | skill |
| 21 | `repeat_per_card` | 死循环一辈子 | infinite_loop | rare | attack |
| 22 | `recursion_bonus` | 进程分裂双重人 | recursion | rare | attack |
| 23 | `strike_5_times` | 高并发网红 | ddos | rare | attack |
| 24 | `pure_damage` | 系统迁移祥子 | sql_injection | rare | attack |
| 25 | `steal_shield` | 中间人攻击 | man_in_middle | rare | attack |
| 26 | `full_hp_bonus_15` | 零日漏洞 | zero_day | rare | attack |
| 27 | `gain_15_money` | 社交工程海铃 | social_engineering | rare | attack |
| 28 | `stun_all_1` | 蓝屏黑色生日 | blue_screen | rare | attack |
| 29 | `skip_all_turn` | 系统已崩溃 | kernel_panic | rare | attack |
| 30 | `gain_curse` | 技术债务 | technical_debt | rare | attack |
| 31 | `random_2_20` | 乱序播放随机 | spaghetti_code | rare | attack |
| 32 | `shield_per_card_3` | 高并发网红 | microservices | rare | defense |
| 33 | `limit_attack_1` | 请重试再次 | rate_limiter | rare | defense |
| 34 | `all_weak_2` | 网络错误 | api_gateway | rare | defense |
| 35 | `next_draw_plus_1` | 连接超时 | service_mesh | rare | defense |
| 36 | `next_skill_double` | 并行碧天伴走 | lambda | rare | defense |
| 37 | `shield_per_hand` | 单例壱雫空 | cqrs | rare | defense |
| 38 | `next_turn_shield_8` | 合服重组 | two_phase_commit | rare | defense |
| 39 | `chance_shield_15` | 彩蛋有趣女人 | dark_launch | rare | defense |
| 40 | `next_card_double` | 一辈子While(true) | pair_programming | rare | skill |
| 41 | `if_attack_gain_2_energy` | 笔记本里的Log | unit_test | rare | skill |
| 42 | `filter_skills` | 诗超绊Linker | integration_test | rare | skill |
| 43 | `hand_size_plus_2` | 立希的Strict模式 | agile_sprint | rare | skill |
| 44 | `cleanse_draw_2` | 暴躁Debug | scrum_master | rare | skill |
| 45 | `hand_cost_zero` | 自由的Daemon | monorepo | rare | skill |
| 46 | `artifact_2` | 抹茶Parfait.js | typescript | rare | skill |
| 47 | `reflect_50` | 有趣的女人if | rust | rare | skill |
| 48 | `free_1_card` | 随机数生成器 | go_routine | rare | skill |
| 49 | `draw_2` | 想弹就弹Play | docker_compose | rare | skill |
| 50 | `draw_3` | 奶奶的遗留代码 | kubernetes_orchestrate | rare | skill |
| 51 | `self_damage_10` | 为什么要跑旧代码 | production_deploy | epic | attack |
| 52 | `skip_next_turn` | 这也是Bug吗 | all_nighter | epic | attack |
| 53 | `chance_instant_kill` | 能够成为Server吗 | demo_gods | epic | attack |
| 54 | `random_10_30` | 混乱工程 | chaos_engineering | epic | attack |
| 55 | `discard_all` | 大爆炸重构 | big_bang | epic | attack |
| 56 | `heal_20` | 祥子rm-rf | google_sre | epic | defense |
| 57 | `invulnerable_2` | 客服工单Ticket | aws_multi_az | epic | defense |
| 58 | `immune_all_1` | 祝你幸福404 | quantum_encryption | epic | defense |
| 59 | `drawn_free_and_double` | 人工智能 | artificial_intelligence | epic | skill |
| 60 | `permanent_draw_1` | 机器学习 | machine_learning | epic | skill |
| 61 | `all_cards_repeat` | 忘记一切Format | blockchain_smart_contract | epic | skill |
| 62 | `draw_5_hand_plus_5` | 技术奇点 | singularity | epic | skill |
| 63 | `duplicate_hand` | 仅返回0和1 | parallel_universe | epic | skill |
| 64 | `cleanse` | 人偶的汇编语言 | docker_restart | epic | skill |
| 65 | `self_die` | sudo rm -rf / | sudo_rm_rf | epic | skill |
| 66 | `scry_10_fetch` | 小黄鸭调试法 | rubber_duck_debug | epic | skill |
| 67 | `play_lose_3_hp` | 段错误 | segfault_curse | common | curse |
| 68 | `unplayable` | 死循环 | infinite_loop_curse | common | curse |
| 69 | `hand_cost_plus_1` | 技术债务 | technical_debt_curse | common | curse |
| 70 | `cannot_remove` | 祖传依赖 | legacy_dependency | common | curse |
| 71 | `skill_bonus_5` | 吉他SOLO | guitar_solo | rare | character-attack |
| 72 | `hand_size_plus_1` | 即兴独奏 | improvise | rare | character-skill |
| 73 | `next_cost_minus_1` | 疯狂SOLO | crazy_solo | rare | character-attack |
| 74 | `zero_attack_bonus_3` | 佑子你好烦 | improv_accompaniment | rare | character-skill |
| 75 | `all_attack_bonus_4` | 出风头 | stage_presence | rare | character-skill |
| 76 | `attack_again_next` | 贝斯Line | bass_line | rare | character-attack |
| 77 | `cost_minus_1` | 独奏王 | melody_solo | rare | character-skill |
| 78 | `shield_8` | 扰民模式 | sound_wave | rare | character-attack |
| 79 | `next_draw_1` | 键盘和音 | keyboard_harmony | rare | character-defense |
| 80 | `shield_10` | 哭泣的泪 | healing_melody | rare | character-skill |
| 81 | `all_shield_5` | 三角初华 | chorus | rare | character-skill |
| 82 | `undamaged_double` | 鼓点敲击 | drum_beat | rare | character-attack |
| 83 | `next_2_attack_bonus_5` | 打工皇后 | rhythm_mastery | rare | character-skill |
| 84 | `hand_size_plus_2` | 斯巴拉西 | intense_drum_solo | rare | character-attack |

## 二、实现情况分析

### 2.1 在 cards.ts 中有定义但在 useGameState.ts 中没有 case 的效果

**结果：所有 62 个 extraEffect 都有对应的 case 实现 ✅**

### 2.2 在 useGameState.ts 中只有 console.log 没有实际功能的效果

| # | extraEffect | 实现情况 | 建议 |
|---|-------------|----------|------|
| 1 | `ignore_shield` | ⚠️ 只有 `console.log` | 需要在伤害计算时检查此标记 |
| 2 | `pure_damage` | ⚠️ 只有 `console.log` | 需要跳过所有伤害加成/减成计算 |
| 3 | `unplayable` | ⚠️ 只有 `console.log` | 需要在出牌时禁止打出此牌 |
| 4 | `cannot_remove` | ⚠️ 只有 `console.log` | 需要在移除卡牌时检查此标记 |
| 5 | `hand_cost_plus_1` | ⚠️ 只有 `console.log` | 需要增加手牌费用 |
| 6 | `cleanse` (部分) | ⚠️ 只有 `console.log` | 需要实际清除负面状态 |
| 7 | `save_hand` | ⚠️ 只有 `console.log` | 需要实现保存手牌状态逻辑 |
| 8 | `if_attack_gain_2_energy` | ⚠️ 只有 `console.log` | 需要检查抽到的牌并给能量 |
| 9 | `next_attack_plus_4` (draw中) | ⚠️ 只有 `console.log` | 需要实际增加下次攻击伤害 |
| 10 | `skip_next_turn` (部分) | ⚠️ 只有 `console.log` | 需要实际跳过下回合 |
| 11 | `first_card_only` | ⚠️ 只有 `console.log` | 需要限制只能第一张打出 |
| 12 | `draw_attack_cost_minus` | ⚠️ 只有 `console.log` | 需要实现费用减少逻辑 |
| 13 | `drawn_attack_cost_minus` | ⚠️ 只有 `console.log` | 需要实现费用减少逻辑 |
| 14 | `start_lose_max_hp` | ⚠️ 只有 `console.log` | 需要每回合减少最大生命 |
| 15 | `end_combat_lose_5` | ⚠️ 只有 `console.log` | 需要战斗结束扣血 |
| 16 | `draw_discard_1` | ⚠️ 只有 `console.log` | 需要抽到就弃牌 |
| 17 | `draw_stun_1` | ⚠️ 只有 `console.log` | 需要抽到就晕眩 |
| 18 | `free_1_card` (部分) | ⚠️ 只有 `console.log` | 需要实际将卡牌费用变为0 |
| 19 | `record_and_repeat` | ⚠️ 只有 `console.log` | 需要记录并重复出牌 |
| 20 | `energy_per_card_played` | ⚠️ 只有 `console.log` | 需要根据出牌数给能量 |
| 21 | `cost_becomes_0` | ⚠️ 只有 `console.log` | 需要将费用变为0 |
| 22 | `no_shield_decay` | ⚠️ 只有 `console.log` | 需要护盾不消失 |
| 23 | `permanent_damage_plus_2` | ⚠️ 只有 `console.log` | 需要增加永久伤害加成 |
| 24 | `circuit_break` | ⚠️ 只有 `console.log` | 需要实现熔断逻辑 |
| 25 | `delay_1_card` | ⚠️ 只有 `console.log` | 需要延迟卡牌到下回合 |
| 26 | `choose_shield_or_draw` | ⚠️ 只有 `console.log` | 需要实现选择逻辑 |

### 2.3 有重复 case 的效果（前面的会阻止后面的执行）

| # | extraEffect | 重复次数 | 位置 | 影响 |
|---|-------------|----------|------|------|
| 1 | `shield_10` | 2次 | 第290行, 第540行 | ⚠️ 第540行的实现不会执行 |
| 2 | `heal_20` | 2次 | 第296行, 第545行 | ⚠️ 第545行的实现不会执行 |
| 3 | `heal_5` | 2次 | 第293行, 第578行 | ⚠️ 第578行的实现不会执行 |
| 4 | `cleanse` | 2次 | 第550行, 第893行 | ⚠️ 第893行的实现不会执行 |
| 5 | `damage_all_2` | 3次 | 第191行, 第391行, 第554行 | ⚠️ 只有第191行有效 |
| 6 | `filter_attacks` | 3次 | 第203行, 第364行, 第558行 | ⚠️ 只有第203行有效 |
| 7 | `filter_skills` | 3次 | 第217行, 第374行, 第568行 | ⚠️ 只有第217行有效 |
| 8 | `reveal_intent` | 2次 | 第186行, 第582行 | ⚠️ 只有第186行有效 |
| 9 | `discard_all` | 2次 | 第331行, 第766行 | ⚠️ 只有第331行有效 |
| 10 | `discard_all_draw_equal` | 2次 | 第332行, 第775行 | ⚠️ 只有第332行有效 |
| 11 | `discard_all_damage_per_3` | 2次 | 第345行, 第786行 | ⚠️ 只有第345行有效 |
| 12 | `stash_and_draw` | 2次 | 第354行, 第796行 | ⚠️ 只有第354行有效 |
| 13 | `duplicate_hand` | 2次 | 第807行, 第975行 | ⚠️ 只有第807行有效 |
| 14 | `drawn_free_and_double` | 2次 | 第249行, 第811行 | ⚠️ 只有第249行有效 |
| 15 | `damage_per_hand_3` | 2次 | 第818行, 第956行 | ⚠️ 只有第818行有效 |
| 16 | `choose_keep` | 3次 | 第254行, 第822行, 第960行 | ⚠️ 只有第254行有效 |
| 17 | `permanent_draw_1` | 2次 | 第829行, 第1141行 | ⚠️ 只有第829行有效 |
| 18 | `tutor_2_different` | 2次 | 第881行, 第1145行 | ⚠️ 只有第881行有效 |
| 19 | `artifact_2` | 2次 | 第746行, 第1155行 | ⚠️ 只有第746行有效 |
| 20 | `full_hp_bonus_15` | 2次 | 第475行, 第1103行 | ⚠️ 只有第475行有效 |
| 21 | `mark_vulnerable_3` | 2次 | 第427行, 第1115行 | ⚠️ 只有第427行有效 |
| 22 | `hand_size_plus_1` | 2次 | 第231行, 第1124行 | ⚠️ 只有第231行有效 |
| 23 | `hand_size_plus_2` | 2次 | 第226行, 第1129行 | ⚠️ 只有第226行有效 |

## 三、总结

### 3.1 统计信息

| 类别 | 数量 |
|------|------|
| cards.ts 中定义的 extraEffect | 62个 |
| 有对应 case 实现 | 62个 (100%) |
| 完全实现的功能 | 36个 (58%) |
| 只有 console.log 的实现 | 26个 (42%) |
| 有重复 case 的效果 | 23个 |

### 3.2 主要问题

1. **大量效果只有 console.log，没有实际功能** - 26个效果需要完善实现
2. **重复 case 问题严重** - 23个效果有重复定义，可能导致预期外的行为
3. **部分核心机制未实现** - 如诅咒牌效果、费用变化、跳过回合等

### 3.3 优先级建议

**高优先级（影响核心玩法）：**
- `ignore_shield` - 无视护盾
- `pure_damage` - 纯粹伤害
- `unplayable` - 无法打出
- `skip_next_turn` - 跳过下回合
- `hand_cost_plus_1` - 手牌费用增加

**中优先级（增强游戏体验）：**
- `cleanse` - 清除负面效果
- `free_1_card` - 免费卡牌
- `if_attack_gain_2_energy` - 抽攻击牌得能量
- `no_shield_decay` - 护盾不消失
- `record_and_repeat` - 记录重复

**低优先级（细节优化）：**
- 修复重复 case 问题
- 完善诅咒牌效果
- 实现选择逻辑
