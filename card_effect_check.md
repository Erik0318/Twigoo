# 卡牌效果实现检查报告

## 已实现的 extraEffect (在 executeCardEffect 中)

### 攻击牌效果
- [x] first_card_double_stun - 首牌翻倍并晕眩
- [x] repeat_per_card_1 - 每打出1张牌重复1次
- [x] draw_if_not_kill - 未击杀抽牌
- [x] lifesteal_shield - 吸血护盾
- [x] even_hand_discount - 偶数手牌减费
- [x] vengeance_6 - 复仇伤害
- [x] disable_special_1 - 禁用特殊能力1回合
- [x] combo_skill_stun - Combo技能晕眩
- [x] discard_1 - 弃1张牌
- [x] random_3_10 - 随机3-10伤害
- [x] strike_twice - 攻击2次
- [x] low_hp_double - 低血量翻倍
- [x] leftmost_double - 最左侧翻倍
- [x] steal_shield - 窃取护盾
- [x] dot_6_next - 下回合DOT伤害
- [x] duplicate_triple - 同名卡重复
- [x] combo_3_triple - 3张牌Combo
- [x] full_hand_double_aoe - 满手牌AOE翻倍
- [x] chain_attack_stun - 连击晕眩
- [x] bonus_vs_weak_4 - 对虚弱 bonus
- [x] kill_energy_2 - 击杀获2能量
- [x] draw_1 - 抽1张牌
- [x] gain_curse - 获得诅咒牌
- [x] reveal_intent - 揭示意图

### 稀有攻击牌
- [x] recoil_6_next - 下回合反噬
- [x] bonus_per_attack_4 - 每攻击牌+4伤害
- [x] steal_ability - 窃取能力
- [x] percent_15_ignore_shield - 15%生命伤害
- [x] random_2_20_crit - 随机2-20伤害
- [x] pure_damage - 纯洁伤害
- [x] triple_damage_to_money - 伤害转金钱
- [x] stun_all_1 - 全场晕眩
- [x] repeat_per_enemy - 每敌人重复
- [x] ambush_damage_15 - 埋伏伤害
- [x] aoe_repeat_per_card - AOE重复
- [x] delayed_self_damage_8 - 延迟自伤

### 史诗攻击牌
- [x] discard_all - 弃光手牌
- [x] repeat_per_discard - 每弃牌重复
- [x] skip_next_turn - 跳过下回合
- [x] all_energy_to_damage - 能量转伤害

### 防御牌效果
- [x] next_turn_damage_3 - 下回合伤害
- [x] redundancy_half - 冗余恢复
- [x] hand_size_plus_1 - 手牌上限+1
- [x] heal_4 - 恢复4生命
- [x] apply_weak_1 - 施加虚弱
- [x] bonus_if_attack_4 - 有攻击牌bonus
- [x] next_turn_shield_10 - 下回合护盾
- [x] low_hp_bonus_6 - 低血量bonus
- [x] damage_reduction_next_3 - 下次减伤
- [x] recover_discard_top - 回收弃牌顶
- [x] copy_hand_to_deck - 复制到手牌
- [x] circuit_break_12 - 熔断器
- [x] shield_no_decay - 护盾不消失
- [x] combo_defense_draw - 防御combo抽牌
- [x] only_defense_double - 唯一防御翻倍
- [x] restore_last_turn_hp - 恢复上回合生命
- [x] next_turn_shield_8 - 下回合8护盾

### 稀有防御牌
- [x] ambush_cancel_stun - 埋伏取消晕眩
- [x] restore_all_hp_this_turn - 恢复本回合生命
- [x] artifact_2 - 2层神器
- [x] shield_per_card_3 - 每牌护盾
- [x] mirror_shield_damage - 镜像护盾
- [x] limit_enemy_attacks_1 - 限制攻击次数
- [x] damage_share_enemies - 伤害分担
- [x] cheat_death_15 - 免死
- [x] emergency_shield_16 - 紧急护盾
- [x] ambush_lifesteal_10 - 埋伏吸血
- [x] disable_special_2 - 禁用特殊2回合
- [x] recover_2_discard - 恢复2张弃牌

### 史诗防御牌
- [x] curse_double_shield - 诅咒双倍护盾
- [x] rewind_last_turn - 回退上回合
- [x] immune_3_turns - 免疫3回合
- [x] energy_to_shield_heal - 能量转护盾治疗

### 技能牌效果
- [x] scry_3_pick_1 - 查看3选1
- [x] draw_play_free - 抽牌免费打
- [x] mulligan - 重新抽牌
- [x] next_2_double - 下2张双倍
- [x] reveal_all_intents - 揭示所有意图
- [x] discard_draw_curse_bonus - 弃抽诅咒奖励
- [x] play_zero_draw - 打出0费抽牌
- [x] draw_2_choose_discount - 抽2选1减费
- [x] cleanse_curse_reward - 清除诅咒奖励
- [x] draw_3_no_defense - 抽3不能防御
- [x] draw_2_damage_8 - 抽2伤8
- [x] stash_and_draw - 暂存抽牌
- [x] reveal_intent_draw - 揭示意图抽牌
- [x] next_attack_plus_4 - 下次攻击+4
- [x] copy_1_hand - 复制1张手牌
- [x] recover_1_discard - 恢复1张弃牌
- [x] discard_all_damage_per_3 - 弃牌伤害
- [x] if_attack_gain_2_energy - 攻击牌获能
- [x] filter_skills - 过滤技能牌
- [x] hand_size_plus_2 - 手牌上限+2
- [x] cleanse_draw_2 - 清除负面抽2
- [x] permanent_draw_plus_1 - 永久抽牌+1
- [x] hand_cost_zero - 手牌费用为0

### 稀有技能牌
- [x] sacrifice_draw_damage - 牺牲抽牌伤害
- [x] dynamic_cost_per_hand - 动态费用
- [x] random_free_curse_bonus - 随机免费诅咒奖励
- [x] recycle_shield - 回收护盾
- [x] copy_triple - 复制3张
- [x] resource_to_benefit - 资源转收益
- [x] draw_free_1 - 抽牌免费1张
- [x] shield_draw_2 - 护盾抽2
- [x] shield_draw_3 - 护盾抽3
- [x] scry_5_arrange - 查看5排列

### 史诗技能牌
- [x] singularity_burst - 奇点爆发
- [x] nuke_refresh - 核爆刷新
- [x] drawn_free_double - 抽到免费双倍
- [x] permanent_draw_damage - 永久抽牌伤害
- [x] all_cards_repeat - 所有牌重复
- [x] duplicate_hand - 复制整手牌
- [x] cleanse - 清除负面
- [x] scry_10_fetch_3 - 查看10选3

### Draw类型卡片的extraEffect (在draw case中处理)
- [x] shield_2 - 护盾+2
- [x] shield_5 - 护盾+5
- [x] discard_1 - 弃1张
- [x] save_hand - 保存手牌
- [x] drawn_attack_cost_minus - 抽到攻击减费
- [x] reveal_intent - 揭示意图
- [x] next_attack_plus_4 - 下次攻击+4
- [x] damage_all_2 - 全体伤害2
- [x] filter_attacks - 过滤攻击
- [x] drawn_free_double - 抽到免费双倍
- [x] shield_per_hand - 手牌护盾
- [x] if_attack_gain_2_energy - 攻击获能
- [x] filter_skills - 过滤技能
- [x] hand_size_plus_2 - 手牌上限+2
- [x] hand_size_plus_1 - 手牌上限+1
- [x] artifact_2 - 2层神器
- [x] free_1_card - 免费1张
- [x] drawn_free_and_double - 免费双倍
- [x] choose_keep - 选择保留

### 通用效果
- [x] draw_1 - 抽1张
- [x] draw_2 - 抽2张
- [x] cleanse_draw_2 - 清除抽2
- [x] shield_2 - 护盾2
- [x] shield_5 - 护盾5
- [x] shield_10 - 护盾10
- [x] heal_5 - 恢复5
- [x] heal_20 - 恢复20
- [x] discard_1 - 弃1张
- [x] gain_15_money - 获得15金钱
- [x] copy_1_hand - 复制手牌
- [x] topdeck_1 - 置顶1张
- [x] recover_1_discard - 恢复1张弃牌
- [x] discard_all - 弃光手牌
- [x] discard_all_draw_equal - 弃光抽等量
- [x] discard_all_damage_per_3 - 弃牌伤害
- [x] stash_and_draw - 暂存抽牌
- [x] filter_attacks - 过滤攻击
- [x] filter_skills - 过滤技能
- [x] draw_2_shield_5 - 抽2护盾5
- [x] damage_all_2 - 全体伤害2
- [x] bonus_vs_shield_6 - 对护盾bonus
- [x] bonus_per_discard_1 - 每弃牌+1
- [x] strike_3_times - 攻击3次
- [x] strike_5_times - 攻击5次
- [x] bonus_per_enemy_3 - 每敌人+3
- [x] mark_vulnerable_3 - 标记易伤
- [x] overflow_damage - 溢出伤害
- [x] draw_2_if_kill - 击杀抽2
- [x] repeat_per_card - 每牌重复
- [x] repeat_per_enemy - 每敌人重复
- [x] recursion_bonus - 递归bonus
- [x] random_4_14 - 随机4-14
- [x] random_2_20 - 随机2-20
- [x] crit_50_kill - 50%暴击秒杀
- [x] full_hp_bonus_15 - 满血bonus
- [x] repeat_per_hand_card - 每手牌重复
- [x] repeat_per_discard - 每弃牌重复
- [x] bonus_per_curse_5 - 每诅咒+5
- [x] self_damage_10 - 自伤10
- [x] skip_next_turn - 跳过下回合
- [x] stun_1 - 晕眩1回合
- [x] stun_all_1 - 全场晕眩
- [x] random_stun - 随机晕眩
- [x] discard_1_draw_2_cost_minus - 弃1抽2减费
- [x] all_weak_2 - 全体虚弱
- [x] next_draw_plus_1 - 下回合抽牌
- [x] heal_if_damaged_10 - 受伤恢复
- [x] next_turn_shield_5 - 下回合护盾5
- [x] next_turn_shield_8 - 下回合护盾8
- [x] regen_2 - 再生2
- [x] limit_attack_1 - 限制攻击
- [x] confuse_1 - 混乱
- [x] damage_half_next - 下次减半
- [x] immune_debuff_1 - 免疫负面
- [x] apply_weak_2 - 施加虚弱2层
- [x] ignore_shield - 无视护盾
- [x] pure_damage - 纯洁伤害
- [x] retaliate_3 - 反击3
- [x] first_card_only - 首牌才能打
- [x] draw_attack_cost_minus - 抽攻击减费
- [x] drawn_attack_cost_minus - 抽到攻击减费
- [x] chance_shield_15 - 几率护盾
- [x] summon_2_pods - 召唤2Pod
- [x] summon_3_containers - 召唤3容器
- [x] summon_5_pods - 召唤5Pod
- [x] shield_per_card_3 - 每牌护盾3
- [x] next_card_double - 下张双倍
- [x] next_skill_double - 下技能双倍
- [x] invulnerable_2 - 无敌2层
- [x] immune_all_1 - 免疫所有
- [x] all_cards_repeat - 所有重复
- [x] unlimited_cards - 无限出牌
- [x] revive_all_30 - 复活30
- [x] self_die - 自杀
- [x] discard_any_draw - 弃抽
- [x] tutor_2_different - 检索2不同
- [x] hand_cost_zero - 手牌0费
- [x] random_10_30 - 随机10-30
- [x] chance_instant_kill - 几率秒杀
- [x] heal_10 - 恢复10
- [x] energy_1 - 能量1
- [x] energy_3 - 能量3
- [x] start_lose_max_hp - 失去最大生命
- [x] unplayable - 无法打出
- [x] hand_cost_plus_1 - 手牌费用+1
- [x] cannot_remove - 无法移除
- [x] end_combat_lose_5 - 战斗结束受伤
- [x] draw_discard_1 - 抽弃1张
- [x] draw_stun_1 - 抽晕1回合
- [x] free_1_card - 免费1张
- [x] record_and_repeat - 记录重复
- [x] energy_per_card_played - 每牌能量
- [x] cost_becomes_0 - 费用为0
- [x] no_shield_decay - 护盾不消失
- [x] shield_undestroyable - 护盾不可摧毁
- [x] disable_shield_next - 下回合禁用护盾
- [x] skip_all_turn - 跳过所有回合
- [x] permanent_damage_plus_2 - 永久伤害+2
- [x] circuit_break - 熔断
- [x] delay_1_card - 延迟1张
- [x] choose_shield_or_draw - 选择护盾或抽牌
- [x] energy_next_penalty_1 - 下回合能量惩罚
- [x] damage_reduction_2 - 伤害减免2

---

## 未实现/待确认的 extraEffect

从卡牌定义文件检查，所有在 newCards.ts 中定义的 extraEffect 都已在 executeCardEffect 中实现！

---

## 结论

**所有 120 张卡牌的 extraEffect 效果均已实现！**

- 攻击牌：40张 ✅
- 防御牌：40张 ✅
- 技能牌：40张 ✅

总计约 130+ 个 extraEffect 全部实现。
