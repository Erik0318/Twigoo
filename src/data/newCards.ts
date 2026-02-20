/**
 * 全新卡牌系统 - 120张精品卡牌
 * MyGO名场面台词 + 程序梗命名
 * 参考炉石传说/KARDS机制设计
 */

import type { Card } from '@/types/game';

// ==================== 攻击牌 (40张) ====================

const commonAttacks: Card[] = [
  // 基础攻击
  { id: 'strike', name: '普通攻击', cost: 1, type: 'attack', rarity: 'common', description: '造成6点伤害', effect: { type: 'damage', value: 6, target: 'enemy' }, icon: 'Sword' },
  { id: 'heavy_strike', name: '重击', cost: 2, type: 'attack', rarity: 'common', description: '造成10点伤害', effect: { type: 'damage', value: 10, target: 'enemy' }, icon: 'Hammer' },
  { id: 'cleave', name: '横扫', cost: 1, type: 'attack', rarity: 'common', description: '对所有敌人造成5点伤害', effect: { type: 'damage', value: 5, target: 'all' }, icon: 'Wind' },
  
  // MyGO名梗攻击
  { id: 'why_play_haruhikage', name: '为什么要演奏春日影', cost: 2, type: 'attack', rarity: 'common', description: '造成7点伤害。如果是本回合第一张牌，伤害翻倍并晕眩敌人', effect: { type: 'damage', value: 7, target: 'enemy', extraEffect: 'first_card_double_stun' }, icon: 'Music' },
  { id: 'it_is_my_go', name: 'It is MyGO!!!!!', cost: 1, type: 'attack', rarity: 'common', description: '造成4点伤害。本回合每打出过1张牌，重复1次', effect: { type: 'damage', value: 4, target: 'enemy', extraEffect: 'repeat_per_card_1' }, icon: 'Sparkles' },
  { id: 'need_more_practice', name: '还需要更多练习', cost: 1, type: 'attack', rarity: 'common', description: '造成5点伤害。如果未击杀敌人，抽1张牌', effect: { type: 'damage', value: 5, target: 'enemy', extraEffect: 'draw_if_not_kill' }, icon: 'Target' },
  { id: 'bushiroad', name: '武士道', cost: 2, type: 'attack', rarity: 'common', description: '造成6点伤害。获得等于造成伤害的护盾', effect: { type: 'damage', value: 6, target: 'enemy', extraEffect: 'lifesteal_shield' }, icon: 'Shield' },
  { id: 'soyorin_stare', name: 'Soyorin凝视', cost: 1, type: 'attack', rarity: 'common', description: '造成7点伤害。如果手牌数为偶数，费用-1', effect: { type: 'damage', value: 7, target: 'enemy', extraEffect: 'even_hand_discount' }, icon: 'Eye' },
  { id: 'rikki_angry', name: '立希愤怒', cost: 2, type: 'attack', rarity: 'common', description: '造成8点伤害。如果上回合受到伤害，伤害+4', effect: { type: 'damage', value: 8, target: 'enemy', extraEffect: 'vengeance_6' }, icon: 'Flame' },
  { id: 'mutsumin_silent', name: '睦头人沉默', cost: 1, type: 'attack', rarity: 'common', description: '造成6点伤害。使敌人的特殊能力失效1回合', effect: { type: 'damage', value: 6, target: 'enemy', extraEffect: 'disable_special_1' }, icon: 'VolumeX' },
  { id: 'uika_secret', name: '初华的秘密', cost: 2, type: 'attack', rarity: 'common', description: '造成9点伤害。如果本回合已打出技能牌，晕眩敌人', effect: { type: 'damage', value: 9, target: 'enemy', extraEffect: 'combo_skill_stun' }, icon: 'Star' },
  { id: 'saki_ruthless', name: '祥子无情', cost: 3, type: 'attack', rarity: 'common', description: '造成12点伤害。弃1张手牌', effect: { type: 'damage', value: 12, target: 'enemy', extraEffect: 'discard_1' }, icon: 'Skull' },
  { id: 'anon_chaos', name: '爱音 chaos', cost: 0, type: 'attack', rarity: 'common', description: '造成3-10点随机伤害', effect: { type: 'damage', value: 0, target: 'enemy', extraEffect: 'random_3_10' }, icon: 'Dices' },
  { id: 'rana_neko', name: '野猫Rana', cost: 1, type: 'attack', rarity: 'common', description: '造成4点伤害2次', effect: { type: 'damage', value: 4, target: 'enemy', extraEffect: 'strike_twice' }, icon: 'Cat' },
  { id: 'tomori_scream', name: '灯呐喊', cost: 2, type: 'attack', rarity: 'common', description: '造成8点伤害。如果生命低于30%，伤害翻倍', effect: { type: 'damage', value: 8, target: 'enemy', extraEffect: 'low_hp_double' }, icon: 'Mic' },
  
  // 程序梗攻击
  { id: 'stack_overflow', name: '栈溢出', cost: 2, type: 'attack', rarity: 'common', description: '造成8点伤害。如果是手牌最左侧，伤害翻倍', effect: { type: 'damage', value: 8, target: 'enemy', extraEffect: 'leftmost_double' }, icon: 'Layers' },
  { id: 'null_pointer', name: '空指针异常', cost: 1, type: 'attack', rarity: 'common', description: '造成5点伤害。如果目标有护盾，窃取护盾', effect: { type: 'damage', value: 5, target: 'enemy', extraEffect: 'steal_shield' }, icon: 'MousePointer' },
  { id: 'memory_leak', name: '内存泄漏', cost: 1, type: 'attack', rarity: 'common', description: '造成3点伤害，敌人下回合开始时再受到6点', effect: { type: 'damage', value: 3, target: 'enemy', extraEffect: 'dot_6_next' }, icon: 'Droplet' },
  { id: 'infinite_loop', name: '死循环', cost: 2, type: 'attack', rarity: 'common', description: '造成4点伤害。如果本回合使用过同名卡，重复2次', effect: { type: 'damage', value: 4, target: 'enemy', extraEffect: 'duplicate_triple' }, icon: 'Repeat' },
  { id: 'race_condition', name: '竞态条件', cost: 2, type: 'attack', rarity: 'common', description: '造成7点伤害。如果本回合已打出3张牌，改为造成21点', effect: { type: 'damage', value: 7, target: 'enemy', extraEffect: 'combo_3_triple' }, icon: 'Zap' },
  { id: 'buffer_overflow', name: '缓冲区溢出', cost: 2, type: 'attack', rarity: 'common', description: '对全体造成5点伤害。如果手牌已满，改为10点', effect: { type: 'damage', value: 5, target: 'all', extraEffect: 'full_hand_double_aoe' }, icon: 'Waves' },
  { id: 'syntax_error', name: '语法错误', cost: 1, type: 'attack', rarity: 'common', description: '造成6点伤害。如果上回合打出攻击牌，晕眩敌人', effect: { type: 'damage', value: 6, target: 'enemy', extraEffect: 'chain_attack_stun' }, icon: 'AlertTriangle' },
  { id: 'deprecated_api', name: '废弃API', cost: 0, type: 'attack', rarity: 'common', description: '造成5点伤害。获得1张无法打出的诅咒牌', effect: { type: 'damage', value: 5, target: 'enemy', extraEffect: 'gain_curse' }, icon: 'Trash2' },
  { id: 'hotfix', name: '热修复', cost: 0, type: 'attack', rarity: 'common', description: '造成3点伤害。抽1张牌', effect: { type: 'damage', value: 3, target: 'enemy', extraEffect: 'draw_1' }, icon: 'Bandage' },
  { id: 'chmod_777', name: 'chmod 777', cost: 1, type: 'attack', rarity: 'common', description: '造成6点伤害。如果敌人有虚弱，伤害+4', effect: { type: 'damage', value: 6, target: 'enemy', extraEffect: 'bonus_vs_weak_4' }, icon: 'Lock' },
  { id: 'git_blame', name: 'Git Blame', cost: 1, type: 'attack', rarity: 'common', description: '造成7点伤害。揭示敌人意图', effect: { type: 'damage', value: 7, target: 'enemy', extraEffect: 'reveal_intent' }, icon: 'GitCommit' },
  { id: 'segfault', name: '段错误', cost: 2, type: 'attack', rarity: 'common', description: '造成9点伤害。如果击杀敌人，获得2能量', effect: { type: 'damage', value: 9, target: 'enemy', extraEffect: 'kill_energy_2' }, icon: 'Bug' },
];

const rareAttacks: Card[] = [
  { id: 'zero_day', name: '零日漏洞', cost: 2, type: 'attack', rarity: 'rare', description: '造成12点伤害，但下回合开始时失去6生命', effect: { type: 'damage', value: 12, target: 'enemy', extraEffect: 'recoil_6_next' }, icon: 'Radiation' },
  { id: 'dependency_hell', name: '依赖地狱', cost: 3, type: 'attack', rarity: 'rare', description: '造成12点伤害。手牌中每有1张其他攻击牌，伤害+4', effect: { type: 'damage', value: 12, target: 'enemy', extraEffect: 'bonus_per_attack_4' }, icon: 'GitMerge' },
  { id: 'man_in_middle', name: '中间人攻击', cost: 2, type: 'attack', rarity: 'rare', description: '造成8点伤害，随机触发1个敌人的特殊能力为己用', effect: { type: 'damage', value: 8, target: 'enemy', extraEffect: 'steal_ability' }, icon: 'UserX' },
  { id: 'divide_by_zero', name: '除以零', cost: 2, type: 'attack', rarity: 'rare', description: '造成目标当前生命15%的伤害（无视护盾）', effect: { type: 'damage', value: 0, target: 'enemy', extraEffect: 'percent_15_ignore_shield' }, icon: 'Calculator' },
  { id: 'spaghetti_code', name: '面条代码', cost: 2, type: 'attack', rarity: 'rare', description: '随机造成2-20点伤害。如果掷出20，晕眩所有敌人', effect: { type: 'damage', value: 0, target: 'enemy', extraEffect: 'random_2_20_crit' }, icon: 'Dices' },
  { id: 'sql_injection', name: 'SQL注入', cost: 1, type: 'attack', rarity: 'rare', description: '造成8点伤害，无视护盾和减伤', effect: { type: 'damage', value: 8, target: 'enemy', extraEffect: 'pure_damage' }, icon: 'Database' },
  { id: 'crypto_miner', name: '加密货币挖矿', cost: 3, type: 'attack', rarity: 'rare', description: '造成10点伤害3次。获得等于总伤害的金钱', effect: { type: 'damage', value: 10, target: 'enemy', extraEffect: 'triple_damage_to_money' }, icon: 'Bitcoin' },
  { id: 'blue_screen', name: '蓝屏死机', cost: 2, type: 'attack', rarity: 'rare', description: '对所有敌人造成12点伤害，晕眩1回合', effect: { type: 'damage', value: 12, target: 'all', extraEffect: 'stun_all_1' }, icon: 'MonitorX' },
  { id: 'fork_bomb', name: 'Fork炸弹', cost: 2, type: 'attack', rarity: 'rare', description: '造成6点伤害。每有1个存活的敌人，重复1次', effect: { type: 'damage', value: 6, target: 'enemy', extraEffect: 'repeat_per_enemy' }, icon: 'Network' },
  { id: 'logic_bomb', name: '逻辑炸弹', cost: 1, type: 'attack', rarity: 'rare', description: '埋伏：敌人下次行动时受到15点伤害', effect: { type: 'damage', value: 0, target: 'enemy', extraEffect: 'ambush_damage_15' }, icon: 'Bomb' },
  { id: 'eternal_blue', name: '永恒之蓝', cost: 3, type: 'attack', rarity: 'rare', description: '对所有敌人造成8点伤害。本回合每使用1张牌，重复1次', effect: { type: 'damage', value: 8, target: 'all', extraEffect: 'aoe_repeat_per_card' }, icon: 'CloudLightning' },
  { id: 'meltdown', name: '熔断漏洞', cost: 2, type: 'attack', rarity: 'rare', description: '造成16点伤害。你的下回合开始时受到8点伤害', effect: { type: 'damage', value: 16, target: 'enemy', extraEffect: 'delayed_self_damage_8' }, icon: 'Flame' },
];

const epicAttacks: Card[] = [
  { id: 'rm_rf', name: 'rm -rf /', cost: 5, type: 'attack', rarity: 'epic', description: '对所有敌人造成25点伤害。弃光手牌', effect: { type: 'damage', value: 25, target: 'all', extraEffect: 'discard_all' }, icon: 'Trash2' },
  { id: 'big_bang_refactor', name: '大爆炸重构', cost: 4, type: 'attack', rarity: 'epic', description: '造成20点伤害。本回合每弃掉过1张牌，重复1次', effect: { type: 'damage', value: 20, target: 'enemy', extraEffect: 'repeat_per_discard' }, icon: 'Sparkles' },
  { id: 'ai_takeover', name: 'AI接管', cost: 6, type: 'attack', rarity: 'epic', description: '造成50点伤害。跳过你的下回合', effect: { type: 'damage', value: 50, target: 'enemy', extraEffect: 'skip_next_turn' }, icon: 'Brain' },
  { id: 'singularity', name: '技术奇点', cost: 0, type: 'attack', rarity: 'epic', description: '消耗所有能量，每点能量造成8点伤害', effect: { type: 'damage', value: 0, target: 'enemy', extraEffect: 'all_energy_to_damage' }, icon: 'Zap' },
];

// ==================== 防御牌 (40张) ====================

const commonDefenses: Card[] = [
  { id: 'defend', name: '防御', cost: 1, type: 'defense', rarity: 'common', description: '获得6点护盾', effect: { type: 'shield', value: 6, target: 'self' }, icon: 'Shield' },
  { id: 'barrier', name: '屏障', cost: 2, type: 'defense', rarity: 'common', description: '获得10点护盾', effect: { type: 'shield', value: 10, target: 'self' }, icon: 'ShieldPlus' },
  
  // MyGO梗防御
  { id: 'i_will_do_anything', name: '我什么都愿意做', cost: 2, type: 'defense', rarity: 'common', description: '获得12护盾。下回合开始时失去3生命', effect: { type: 'shield', value: 12, target: 'self', extraEffect: 'next_turn_damage_3' }, icon: 'Heart' },
  { id: 'never_forget', name: '一辈子不会忘', cost: 1, type: 'defense', rarity: 'common', description: '获得6护盾。如果本回合失去护盾，恢复一半', effect: { type: 'shield', value: 6, target: 'self', extraEffect: 'redundancy_half' }, icon: 'Bookmark' },
  { id: 'just_be_myself', name: '只做自己', cost: 2, type: 'defense', rarity: 'common', description: '获得10护盾。手牌上限+1本回合', effect: { type: 'shield', value: 10, target: 'self', extraEffect: 'hand_size_plus_1' }, icon: 'User' },
  { id: 'not_good_enough', name: '我还不够好', cost: 1, type: 'defense', rarity: 'common', description: '获得5护盾。抽1张牌', effect: { type: 'shield', value: 5, target: 'self', extraEffect: 'draw_1' }, icon: 'Frown' },
  { id: 'crychic_memory', name: 'Crychic的回忆', cost: 3, type: 'defense', rarity: 'common', description: '获得18护盾。获得1张诅咒牌', effect: { type: 'shield', value: 18, target: 'self', extraEffect: 'gain_curse' }, icon: 'Ghost' },
  { id: 'ano_koro_no_watashi', name: '那时的我', cost: 2, type: 'defense', rarity: 'common', description: '获得9护盾。恢复4生命', effect: { type: 'shield', value: 9, target: 'self', extraEffect: 'heal_4' }, icon: 'Clock' },
  { id: 'taki_pressure', name: '立希的压力', cost: 2, type: 'defense', rarity: 'common', description: '获得7护盾。敌人获得1层虚弱', effect: { type: 'shield', value: 7, target: 'self', extraEffect: 'apply_weak_1' }, icon: 'Gauge' },
  { id: 'soyo_smile', name: '爽世的微笑', cost: 1, type: 'defense', rarity: 'common', description: '获得4护盾。如果手牌中有攻击牌，获得8护盾', effect: { type: 'shield', value: 4, target: 'self', extraEffect: 'bonus_if_attack_4' }, icon: 'Smile' },
  { id: 'rana_sleep', name: 'Rana睡觉', cost: 0, type: 'defense', rarity: 'common', description: '下回合开始时获得10护盾', effect: { type: 'shield', value: 0, target: 'self', extraEffect: 'next_turn_shield_10' }, icon: 'Moon' },
  { id: 'mutsumin_glass', name: '睦的黄瓜', cost: 1, type: 'defense', rarity: 'common', description: '获得6护盾。如果生命低于50%，获得额外6护盾', effect: { type: 'shield', value: 6, target: 'self', extraEffect: 'low_hp_bonus_6' }, icon: 'Cucumber' },
  
  // 程序梗防御
  { id: 'try_catch', name: 'Try-Catch', cost: 1, type: 'defense', rarity: 'common', description: '获得7护盾。下次受到伤害-3', effect: { type: 'shield', value: 7, target: 'self', extraEffect: 'damage_reduction_next_3' }, icon: 'Shield' },
  { id: 'fallback', name: 'Fallback回退', cost: 1, type: 'defense', rarity: 'common', description: '获得5护盾。将弃牌堆顶1张牌置于牌库顶', effect: { type: 'shield', value: 5, target: 'self', extraEffect: 'recover_discard_top' }, icon: 'Undo2' },
  { id: 'backup', name: '备份存档', cost: 2, type: 'defense', rarity: 'common', description: '获得10护盾。复制1张手牌加入牌库', effect: { type: 'shield', value: 10, target: 'self', extraEffect: 'copy_hand_to_deck' }, icon: 'Save' },
  { id: 'firewall', name: '防火墙', cost: 2, type: 'defense', rarity: 'common', description: '获得8护盾。敌人获得1层虚弱', effect: { type: 'shield', value: 8, target: 'self', extraEffect: 'apply_weak_1' }, icon: 'Wall' },
  { id: 'circuit_breaker', name: '熔断器', cost: 2, type: 'defense', rarity: 'common', description: '获得8护盾。如果下回合受到超过12伤害，免疫', effect: { type: 'shield', value: 8, target: 'self', extraEffect: 'circuit_break_12' }, icon: 'ToggleRight' },
  { id: 'sandbox', name: '沙箱环境', cost: 1, type: 'defense', rarity: 'common', description: '获得5护盾。手牌上限+1', effect: { type: 'shield', value: 5, target: 'self', extraEffect: 'hand_size_plus_1' }, icon: 'Box' },
  { id: 'immutable', name: '不可变架构', cost: 3, type: 'defense', rarity: 'common', description: '获得18护盾。本回合护盾不消失', effect: { type: 'shield', value: 18, target: 'self', extraEffect: 'shield_no_decay' }, icon: 'Lock' },
  { id: 'lazy_loading', name: '懒加载', cost: 0, type: 'defense', rarity: 'common', description: '下回合开始时获得8护盾', effect: { type: 'shield', value: 0, target: 'self', extraEffect: 'next_turn_shield_8' }, icon: 'Clock' },
  { id: 'cache_hit', name: '缓存命中', cost: 1, type: 'defense', rarity: 'common', description: '获得5护盾。如果本回合已打出防御牌，抽1张', effect: { type: 'shield', value: 5, target: 'self', extraEffect: 'combo_defense_draw' }, icon: 'Database' },
  { id: 'redundancy', name: '冗余备份', cost: 2, type: 'defense', rarity: 'common', description: '获得7护盾。如果下回合失去护盾，恢复一半', effect: { type: 'shield', value: 7, target: 'self', extraEffect: 'redundancy_half' }, icon: 'Copy' },
  { id: 'exception_handler', name: '异常处理器', cost: 1, type: 'defense', rarity: 'common', description: '获得6护盾。如果是手牌唯一防御牌，获得12', effect: { type: 'shield', value: 6, target: 'self', extraEffect: 'only_defense_double' }, icon: 'Bug' },
  { id: 'version_control', name: '版本控制', cost: 2, type: 'defense', rarity: 'common', description: '获得8护盾。恢复上回合失去的生命', effect: { type: 'shield', value: 8, target: 'self', extraEffect: 'restore_last_turn_hp' }, icon: 'GitBranch' },
];

const rareDefenses: Card[] = [
  { id: 'ambush_trap', name: '埋伏陷阱', cost: 1, type: 'defense', rarity: 'rare', description: '埋伏：敌人下次攻击时，取消并晕眩1回合', effect: { type: 'shield', value: 0, target: 'self', extraEffect: 'ambush_cancel_stun' }, icon: 'Target' },
  { id: 'transaction', name: '事务回滚', cost: 3, type: 'defense', rarity: 'rare', description: '获得12护盾。恢复本回合失去的所有生命', effect: { type: 'shield', value: 12, target: 'self', extraEffect: 'restore_all_hp_this_turn' }, icon: 'RotateCcw' },
  { id: 'encryption', name: '量子加密', cost: 2, type: 'defense', rarity: 'rare', description: '获得10护盾。获得2层神器（免疫负面）', effect: { type: 'shield', value: 10, target: 'self', extraEffect: 'artifact_2' }, icon: 'Key' },
  { id: 'microservices', name: '微服务架构', cost: 2, type: 'defense', rarity: 'rare', description: '获得7护盾。本回合每打出1张牌，获得3护盾', effect: { type: 'shield', value: 7, target: 'self', extraEffect: 'shield_per_card_3' }, icon: 'LayoutGrid' },
  { id: 'mirror_shield', name: '镜像护盾', cost: 2, type: 'defense', rarity: 'rare', description: '获得6护盾。下回合反弹护盾值的伤害', effect: { type: 'shield', value: 6, target: 'self', extraEffect: 'mirror_shield_damage' }, icon: 'Reflect' },
  { id: 'rate_limiter', name: '限流器', cost: 1, type: 'defense', rarity: 'rare', description: '获得5护盾。敌人本回合只能攻击1次', effect: { type: 'shield', value: 5, target: 'self', extraEffect: 'limit_enemy_attacks_1' }, icon: 'Gauge' },
  { id: 'load_balancer', name: '负载均衡', cost: 2, type: 'defense', rarity: 'rare', description: '获得9护盾。受到的伤害由所有敌人分担', effect: { type: 'shield', value: 9, target: 'self', extraEffect: 'damage_share_enemies' }, icon: 'Scale' },
  { id: 'failover', name: '故障转移', cost: 2, type: 'defense', rarity: 'rare', description: '获得8护盾。如果生命降至0，恢复至15', effect: { type: 'shield', value: 8, target: 'self', extraEffect: 'cheat_death_15' }, icon: 'LifeBuoy' },
  { id: 'graceful_degradation', name: '优雅降级', cost: 1, type: 'defense', rarity: 'rare', description: '获得4护盾。如果生命低于25%，获得16护盾', effect: { type: 'shield', value: 4, target: 'self', extraEffect: 'emergency_shield_16' }, icon: 'TrendingDown' },
  { id: 'honey_pot', name: '蜜罐陷阱', cost: 2, type: 'defense', rarity: 'rare', description: '获得6护盾。埋伏：敌人攻击时，窃取10生命', effect: { type: 'shield', value: 6, target: 'self', extraEffect: 'ambush_lifesteal_10' }, icon: 'Candy' },
  { id: 'access_control', name: '访问控制', cost: 2, type: 'defense', rarity: 'rare', description: '获得8护盾。敌人的特殊能力失效2回合', effect: { type: 'shield', value: 8, target: 'self', extraEffect: 'disable_special_2' }, icon: 'KeyRound' },
  { id: 'data_recovery', name: '数据恢复', cost: 3, type: 'defense', rarity: 'rare', description: '获得10护盾。从弃牌堆恢复2张牌到手牌', effect: { type: 'shield', value: 10, target: 'self', extraEffect: 'recover_2_discard' }, icon: 'Database' },
];

const epicDefenses: Card[] = [
  { id: 'invincible', name: '绝对防御', cost: 3, type: 'defense', rarity: 'epic', description: '获得25护盾。如果有诅咒牌，获得50护盾', effect: { type: 'shield', value: 25, target: 'self', extraEffect: 'curse_double_shield' }, icon: 'ShieldCheck' },
  { id: 'time_travel', name: '时光倒流', cost: 4, type: 'defense', rarity: 'epic', description: '恢复至上一回合开始时的状态', effect: { type: 'shield', value: 0, target: 'self', extraEffect: 'rewind_last_turn' }, icon: 'History' },
  { id: 'divine_protection', name: '神圣庇护', cost: 5, type: 'defense', rarity: 'epic', description: '获得40护盾。免疫所有负面效果3回合', effect: { type: 'shield', value: 40, target: 'self', extraEffect: 'immune_3_turns' }, icon: 'Sun' },
  { id: 'immortal', name: '不朽之身', cost: 0, type: 'defense', rarity: 'epic', description: '消耗所有能量，每点能量获得6护盾和恢复3生命', effect: { type: 'shield', value: 0, target: 'self', extraEffect: 'energy_to_shield_heal' }, icon: 'Heart' },
];

// ==================== 技能牌 (40张) ====================

const commonSkills: Card[] = [
  { id: 'draw', name: '抽牌', cost: 1, type: 'skill', rarity: 'common', description: '抽2张牌', effect: { type: 'draw', value: 2, target: 'self' }, icon: 'Files' },
  
  // MyGO梗技能
  { id: 'scry_anon', name: '探寻可能性', cost: 1, type: 'skill', rarity: 'common', description: '查看牌库顶3张，选择1张加入手牌', effect: { type: 'draw', value: 0, target: 'self', extraEffect: 'scry_3_pick_1' }, icon: 'Search' },
  { id: 'hotfix_rikki', name: '紧急热修', cost: 0, type: 'skill', rarity: 'common', description: '抽1张牌，可立即打出', effect: { type: 'draw', value: 1, target: 'self', extraEffect: 'draw_play_free' }, icon: 'Zap' },
  { id: 'reshuffle', name: '重新来過', cost: 1, type: 'skill', rarity: 'common', description: '弃光手牌，抽等量的牌', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'mulligan' }, icon: 'Shuffle' },
  { id: 'double_play', name: '双重演奏', cost: 2, type: 'skill', rarity: 'common', description: '本回合下2张打出的牌效果触发2次', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'next_2_double' }, icon: 'Copy' },
  { id: 'reveal_future', name: '预见未来', cost: 0, type: 'skill', rarity: 'common', description: '揭示所有敌人的下回合意图', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'reveal_all_intents' }, icon: 'Eye' },
  { id: 'refactor_crychic', name: 'Crychic重构', cost: 1, type: 'skill', rarity: 'common', description: '弃1张牌，抽2张。如果弃掉诅咒牌，再抽2张', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'discard_draw_curse_bonus' }, icon: 'RefreshCw' },
  { id: 'pipeline', name: 'CI/CD流水线', cost: 3, type: 'skill', rarity: 'common', description: '打出手中所有0费牌，每打出1张抽1张', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'play_zero_draw' }, icon: 'Workflow' },
  { id: 'optimize', name: 'A/B测试', cost: 1, type: 'skill', rarity: 'common', description: '抽2张，选择弃1张，另1张费用-1', effect: { type: 'draw', value: 2, target: 'self', extraEffect: 'draw_2_choose_discount' }, icon: 'Split' },
  { id: 'cleanse_debt', name: '偿还债务', cost: 1, type: 'skill', rarity: 'common', description: '移除所有诅咒牌，每移除1张获得8护盾和8金钱', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'cleanse_curse_reward' }, icon: 'Banknote' },
  { id: 'sprint', name: '敏捷冲刺', cost: 2, type: 'skill', rarity: 'common', description: '抽3张牌。本回合无法打出防御牌', effect: { type: 'draw', value: 3, target: 'self', extraEffect: 'draw_3_no_defense' }, icon: 'Timer' },
  { id: 'dark_deploy', name: '黑暗部署', cost: 0, type: 'skill', rarity: 'common', description: '抽2张牌，受到8点伤害', effect: { type: 'draw', value: 2, target: 'self', extraEffect: 'draw_2_damage_8' }, icon: 'Cloud' },
  
  // 程序梗技能
  { id: 'git_stash', name: 'Git Stash', cost: 1, type: 'skill', rarity: 'common', description: '将手牌置于牌库顶，抽等量牌', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'stash_and_draw' }, icon: 'Archive' },
  { id: 'debug_mode', name: '调试模式', cost: 0, type: 'skill', rarity: 'common', description: '揭示敌人意图，抽1张牌', effect: { type: 'draw', value: 1, target: 'self', extraEffect: 'reveal_intent_draw' }, icon: 'Bug' },
  { id: 'breakpoint', name: '断点调试', cost: 1, type: 'skill', rarity: 'common', description: '抽2张牌。下1张攻击牌伤害+4', effect: { type: 'draw', value: 2, target: 'self', extraEffect: 'next_attack_plus_4' }, icon: 'CircleDot' },
  { id: 'copy_clipboard', name: '复制粘贴', cost: 0, type: 'skill', rarity: 'common', description: '复制手牌中1张牌', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'copy_1_hand' }, icon: 'Copy' },
  { id: 'recover_trash', name: '从回收站恢复', cost: 1, type: 'skill', rarity: 'common', description: '将弃牌堆中1张牌加入手牌', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'recover_1_discard' }, icon: 'Clipboard' },
  { id: 'rm_rf_small', name: 'rm -rf', cost: 2, type: 'skill', rarity: 'common', description: '弃光手牌，造成弃牌数×3的伤害', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'discard_all_damage_per_3' }, icon: 'Trash2' },
  { id: 'unit_test', name: '单元测试', cost: 0, type: 'skill', rarity: 'common', description: '抽1张牌。如果抽到攻击牌，获得2能量', effect: { type: 'draw', value: 1, target: 'self', extraEffect: 'if_attack_gain_2_energy' }, icon: 'CheckCircle' },
  { id: 'integration_test', name: '集成测试', cost: 2, type: 'skill', rarity: 'common', description: '抽4张牌，弃掉其中的技能牌', effect: { type: 'draw', value: 4, target: 'self', extraEffect: 'filter_skills' }, icon: 'TestTube' },
  { id: 'scrum', name: '敏捷Scrum', cost: 1, type: 'skill', rarity: 'common', description: '抽3张牌，本回合手牌上限+2', effect: { type: 'draw', value: 3, target: 'self', extraEffect: 'hand_size_plus_2' }, icon: 'Timer' },
  { id: 'cleanse_all', name: '清除所有负面', cost: 1, type: 'skill', rarity: 'common', description: '移除所有负面效果，抽2张牌', effect: { type: 'draw', value: 2, target: 'self', extraEffect: 'cleanse_draw_2' }, icon: 'UserCheck' },
  { id: 'stack_upgrade', name: '技术栈升级', cost: 1, type: 'skill', rarity: 'common', description: '本战斗每回合抽牌+1', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'permanent_draw_plus_1' }, icon: 'Layers' },
  { id: 'monorepo', name: 'Monorepo', cost: 2, type: 'skill', rarity: 'common', description: '将所有手牌费用变为0', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'hand_cost_zero' }, icon: 'FolderGit' },
];

const rareSkills: Card[] = [
  { id: 'sacrifice_refactor', name: '重构祭品', cost: 0, type: 'skill', rarity: 'rare', description: '弃掉所有手牌，抽等量的牌+3张。弃掉的攻击牌每1张造成5伤害', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'sacrifice_draw_damage' }, icon: 'Flame' },
  { id: 'rush_commit', name: '紧急提交', cost: 4, type: 'skill', rarity: 'rare', description: '费用：4。每有1张手牌，费用-1（最低0）。造成20伤害', effect: { type: 'damage', value: 20, target: 'enemy', extraEffect: 'dynamic_cost_per_hand' }, icon: 'Rocket' },
  { id: 'chaos_deploy', name: '混沌部署', cost: 2, type: 'skill', rarity: 'rare', description: '随机将2张手牌费用变为0。如果有诅咒牌，全部变为0', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'random_free_curse_bonus' }, icon: 'Shuffle' },
  { id: 'legacy_code', name: '祖传代码', cost: 1, type: 'skill', rarity: 'rare', description: '将弃牌堆所有牌洗入牌库。每重洗入1张，获得2护盾', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'recycle_shield' }, icon: 'Recycle' },
  { id: 'copy_paste_3x', name: '复制粘贴×3', cost: 2, type: 'skill', rarity: 'rare', description: '选择手牌中1张牌，本回合获得3张复制', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'copy_triple' }, icon: 'Copy' },
  { id: 'kubernetes', name: 'K8s编排', cost: 3, type: 'skill', rarity: 'rare', description: '获得能量数×3的护盾，抽手牌数张牌', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'resource_to_benefit' }, icon: 'Boxes' },
  { id: 'type_script', name: 'TypeScript严格模式', cost: 1, type: 'skill', rarity: 'rare', description: '获得2层神器，抽1张牌', effect: { type: 'draw', value: 1, target: 'self', extraEffect: 'artifact_2' }, icon: 'FileType' },
  { id: 'rust_memory', name: 'Rust内存安全', cost: 1, type: 'skill', rarity: 'rare', description: '获得10护盾。本回合受到的伤害反弹50%', effect: { type: 'shield', value: 10, target: 'self', extraEffect: 'reflect_50' }, icon: 'Cog' },
  { id: 'go_routine', name: 'Go协程', cost: 0, type: 'skill', rarity: 'rare', description: '抽1张牌，将1张手牌费用变为0', effect: { type: 'draw', value: 1, target: 'self', extraEffect: 'draw_free_1' }, icon: 'Zap' },
  { id: 'docker_compose', name: 'Docker Compose', cost: 2, type: 'skill', rarity: 'rare', description: '获得8护盾，抽2张牌', effect: { type: 'shield', value: 8, target: 'self', extraEffect: 'shield_draw_2' }, icon: 'Container' },
  { id: 'kubernetes_orchestrate', name: 'K8s编排', cost: 3, type: 'skill', rarity: 'rare', description: '获得15护盾，抽3张牌', effect: { type: 'shield', value: 15, target: 'self', extraEffect: 'shield_draw_3' }, icon: 'Boxes' },
  { id: 'terraform', name: 'Terraform', cost: 2, type: 'skill', rarity: 'rare', description: '查看牌库顶5张，选择任意张置于牌库顶或弃掉', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'scry_5_arrange' }, icon: 'Map' },
];

const epicSkills: Card[] = [
  { id: 'singularity', name: '技术奇点', cost: 5, type: 'skill', rarity: 'epic', description: '获得5能量，抽5张牌，手牌上限+5，所有卡牌费用为0', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'singularity_burst' }, icon: 'Sparkles' },
  { id: 'sudo_rm_rf', name: 'sudo rm -rf /*', cost: 6, type: 'skill', rarity: 'epic', description: '对所有敌人造成50点伤害。弃光手牌和牌库，抽5张牌', effect: { type: 'damage', value: 50, target: 'all', extraEffect: 'nuke_refresh' }, icon: 'Bomb' },
  { id: 'artificial_intelligence', name: '人工智能', cost: 5, type: 'skill', rarity: 'epic', description: '抽3张牌，它们本回合费用为0', effect: { type: 'draw', value: 3, target: 'self', extraEffect: 'drawn_free_double' }, icon: 'Brain' },
  { id: 'machine_learning', name: '机器学习', cost: 2, type: 'skill', rarity: 'epic', description: '本战斗每回合抽牌+1，永久伤害+1', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'permanent_draw_damage' }, icon: 'TrendingUp' },
  { id: 'smart_contract', name: '智能合约', cost: 2, type: 'skill', rarity: 'epic', description: '本回合打出的所有牌自动重复1次', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'all_cards_repeat' }, icon: 'FileSignature' },
  { id: 'parallel_universe', name: '平行宇宙', cost: 3, type: 'skill', rarity: 'epic', description: '复制当前整手牌', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'duplicate_hand' }, icon: 'Copy' },
  { id: 'docker_restart', name: 'Docker Restart', cost: 1, type: 'skill', rarity: 'epic', description: '移除所有负面效果，恢复10生命', effect: { type: 'heal', value: 10, target: 'self', extraEffect: 'cleanse' }, icon: 'Container' },
  { id: 'rubber_duck', name: '小黄鸭调试法', cost: 1, type: 'skill', rarity: 'epic', description: '查看牌库顶10张牌，选择3张加入手牌', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'scry_10_fetch_3' }, icon: 'Duck' },
];

// ==================== 导出 ====================

export const allNewCards: Card[] = [
  ...commonAttacks,
  ...rareAttacks,
  ...epicAttacks,
  ...commonDefenses,
  ...rareDefenses,
  ...epicDefenses,
  ...commonSkills,
  ...rareSkills,
  ...epicSkills
];

// 按稀有度分类
export const newCommonCards: Card[] = [...commonAttacks, ...commonDefenses, ...commonSkills];
export const newRareCards: Card[] = [...rareAttacks, ...rareDefenses, ...rareSkills];
export const newEpicCards: Card[] = [...epicAttacks, ...epicDefenses, ...epicSkills];

// 按类型分类
export const newAttackCards: Card[] = [...commonAttacks, ...rareAttacks, ...epicAttacks];
export const newDefenseCards: Card[] = [...commonDefenses, ...rareDefenses, ...epicDefenses];
export const newSkillCards: Card[] = [...commonSkills, ...rareSkills, ...epicSkills];
